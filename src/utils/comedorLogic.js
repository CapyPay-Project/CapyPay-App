// src/utils/comedorLogic.js
import { addItemToCart, isCartOpen, cartItems } from "../store/cartStore";
import { showToast } from "../utils/toast";
import { fetchAPI, comedorService, authService } from "../services/api";

export const DiningState = {
  BROWSING: "browsing",
  PRE_ARRIVAL: "pre_arrival",
  WAITING: "waiting",
  READY: "ready",
};

// State
let currentState = DiningState.BROWSING;
let activeOrder = null;
let confirmedPresence = false;
let allCarouselItems = [];
let orderCheckErrorShown = false;

// Constants
const CACHE_KEY = "capypay_menu_cache_v5";
const CACHE_DURATION = 1 * 60 * 1000; // 1 minute
const TIPS = [
  "¡Agrega una malta bien fría para completar tu experiencia!",
  "La hora pico es a las 12:30 PM, ¡llega antes!",
  "Gana doble XP pidiendo el Plato del Día.",
  "Usa el código 'CAPY10' (mentira, no hay códigos aún).",
  "Recarga tu saldo con anticipación para evitar colas.",
];

// --- PUBLIC API ---

export async function initComedor(config = {}) {
  console.log("Initializing Comedor Logic...");

  // 1. Initial State Check
  const user = authService.getCurrentUser();
  if (user && user.id) {
    checkActiveOrders(user.id);
  }

  // 2. Start Loops
  loadStats(); 
  startStatsTimer(user ? user.id : null);
  startTipRotation();

  // 3. User Interaction Listeners
  setupEventListeners();

  // 4. Data Fetching
  await loadMenuData();
}

// --- DATA FETCHING ---

async function loadMenuData() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    let menuData = null;
    let useCache = false;

    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_DURATION) {
        console.log("Using Cached Menu");
        menuData = parsed.data;
        useCache = true;
      }
    }

    if (!useCache) {
      console.log("Fetching Menu from API...");
      menuData = await fetchAPI("/comedor/menu");
      if (menuData) {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ timestamp: Date.now(), data: menuData })
        );
      }
    }

    if (menuData) {
      renderPlatoDia(menuData.platoDia);
      renderPopularRotator(menuData.popularItems || []);
      if (menuData.items && Array.isArray(menuData.items)) {
        allCarouselItems = menuData.items; // Store globally for filters
        renderMenuCarousel(menuData.items);
      }
      initFilterListeners();
    }
  } catch (e) {
    console.error("Init Error", e);
    showToast("Error cargando el menú", "error");
  }
}

async function loadStats() {
  try {
    let query = "";
    if (activeOrder && activeOrder.id) {
      query = `?orderId=${activeOrder.id}`;
    }

    const stats = await fetchAPI(`/comedor/stats${query}`);

    if (stats) {
      updateStatsUI(stats);
      checkActiveOrderAndStats(stats);
    }
  } catch (e) {
    console.error("Stats Error", e);
  }
}

// --- STATE MANAGEMENT ---

async function checkActiveOrders(userId) {
  try {
    const res = await comedorService.getMyOrders(userId);
    if (res && res.orders && res.orders.length > 0) {
      const lastOrder = res.orders[0];

      if (lastOrder.status === "preparing") {
        activeOrder = lastOrder;
        confirmedPresence = localStorage.getItem("capypay_dining_confirmed") === "true";
        updateDiningState();
      } else if (lastOrder.status === "completed") {
        handleCompletedOrder(lastOrder);
      }
    }
  } catch (e) {
    console.error("Order check failed", e);
    if (!orderCheckErrorShown) {
      showToast("No se pudo verificar tus pedidos activos", "error");
      orderCheckErrorShown = true;
    }
  }
}

function handleCompletedOrder(order) {
  const dismissed = JSON.parse(localStorage.getItem("capypay_dismissed_orders") || "[]");
  if (dismissed.includes(order.id)) return;

  const wasTracking = localStorage.getItem("capypay_dining_confirmed") === "true";
  const isRecent = Date.now() - new Date(order.completed_at).getTime() < 30 * 60000;

  if (wasTracking || isRecent) {
    activeOrder = order;
    currentState = DiningState.READY;
    renderStateUI();
    showToast("¡Tu pedido del comedor está listo! 🍔", "success", "¡A comer!");
    if (isRecent && navigator.vibrate) navigator.vibrate([200, 100, 200]);
  } else {
    localStorage.removeItem("capypay_dining_confirmed");
  }
}

function updateDiningState() {
  if (!activeOrder) {
    currentState = DiningState.BROWSING;
  } else if (!confirmedPresence) {
    currentState = DiningState.PRE_ARRIVAL;
  } else {
    currentState = DiningState.WAITING;
  }
  renderStateUI();
}

function checkActiveOrderAndStats(stats) {
  if (activeOrder && confirmedPresence) {
    if (stats.turnsAhead !== undefined && stats.turnsAhead !== null) {
        updateWaitingPositionUI(stats.turnsAhead);
    }
  }
}

// --- UI UPDATERS ---

function renderStateUI() {
  const views = [
    "view-browsing-occupied",
    "view-waiting-rhythm",
    "view-browsing-time",
    "view-pre-arrival",
    "view-waiting-position",
    "view-ready",
  ];
  
  views.forEach(id => document.getElementById(id)?.classList.add("hidden")); // Hide all
  
  const showFlex = (id) => {
      const el = document.getElementById(id);
      if(el) { el.classList.remove("hidden"); el.classList.add("flex"); }
  }

  if (currentState === DiningState.BROWSING) {
    showFlex("view-browsing-occupied");
    showFlex("view-browsing-time");
  } else if (currentState === DiningState.PRE_ARRIVAL) {
    showFlex("view-browsing-occupied");
    showFlex("view-pre-arrival");
    if (activeOrder) updateText("my-ticket-id", `#${activeOrder.id.toString().slice(0, 4)}`);
  } else if (currentState === DiningState.WAITING) {
    showFlex("view-waiting-rhythm");
    showFlex("view-waiting-position");
  } else if (currentState === DiningState.READY) {
    showFlex("view-waiting-rhythm");
    showFlex("view-ready");
    if (activeOrder) updateText("ready-ticket-id", `#${activeOrder.id.toString().slice(0, 4)}`);
  }
}

function updateStatsUI(stats) {
  // Queue Widget
  updateText("ocupacion-text", stats.ocupacion.count || "--");
  updateText("ocupacion-status", stats.ocupacion.nivel);
  updateText("ocupacion-detail", stats.ocupacion.detalle);

  const bar = document.getElementById("ocupacion-bar");
  if(bar) { bar.style.width = '100%'; bar.style.transform = `scaleX(${stats.ocupacion.porcentaje / 100})`; }

  // Colors
  const nivel = stats.ocupacion.nivel;
  let colorClass = "bg-brand-lime";
  if (nivel === "Full") colorClass = "bg-red-500";
  else if (nivel === "Alta") colorClass = "bg-orange-500";
  else if (nivel === "Media") colorClass = "bg-yellow-400";
  
  const dots = ["ping-dot", "static-dot"];
  dots.forEach(id => {
      const d = document.getElementById(id);
      if(d) {
        d.className = d.className.replace(/bg-\S+/, colorClass);
        if(id === 'ping-dot') d.classList.add('opacity-75'); // ensure opacity
      } 
  });

  const statusEl = document.getElementById("ocupacion-status");
  if(statusEl) statusEl.className = statusEl.className.replace(/text-\S+/, `text-${colorClass.replace("bg-", "")}`);

  if(bar) bar.className = `h-full w-full origin-left transition-transform duration-1000 ${colorClass}`;

  // Time Widget
  updateText("espera-text", stats.tiempoEspera);
  updateText("turno-text", stats.proximoTurno);
}

function updateWaitingPositionUI(diff) {
  const countEl = document.getElementById("people-ahead-count");
  const labelEl = document.getElementById("turns-label");
  const waitEl = document.getElementById("waiting-time-detail");

  if (diff === 0) {
    if (countEl) { countEl.innerText = "YA!"; countEl.className = "text-5xl text-brand-lime font-black relative z-10 transition-all duration-300"; }
    if (labelEl) { labelEl.innerText = "¡Eres el siguiente!"; labelEl.className = "text-[9px] font-black uppercase tracking-widest mb-2 text-brand-lime animate-pulse"; }
    if (waitEl) waitEl.innerText = "¡Tu pedido estará listo pronto!";
  } else {
    if (countEl) { countEl.innerText = diff; countEl.className = "text-6xl font-black text-white relative z-10 transition-all duration-300"; }
    if (labelEl) { labelEl.innerText = "Personas delante"; labelEl.className = "text-[9px] text-white/50 font-bold uppercase tracking-widest mb-2"; }
    if (waitEl) waitEl.innerText = `Aprox ${diff * 3} min`;
  }
}

// --- RENDERERS ---

function renderPlatoDia(item) {
  const container = document.getElementById("plato-dia-container");
  if (!container) return;
  if (!item) {
    container.innerHTML = "<div class='h-96 flex items-center justify-center text-white/40 italic'>No hay plato del día disponible hoy.</div>";
    return;
  }
  // Simplified Inner HTML insertion - keeping the same structure as before but externalized
  // NOTE: Logic to generate HTML string is omitted for brevity but should be same as original
  // We will assume the structure is generated here or imported
  constructPlatoDiaHTML(container, item);
  attachCartListeners(container);
}

function renderMenuCarousel(items) {
  const scrollContainer = document.getElementById("carousel-container");
  if (!scrollContainer) return;
  scrollContainer.innerHTML = "";
  
  if (items.length === 0) {
    scrollContainer.innerHTML = "<div class='w-full text-center text-white/50 p-10'>No hay productos disponibles.</div>";
    return;
  }

  items.forEach(item => {
      const card = document.createElement("div");
      card.innerHTML = getCarouselCardHTML(item);
      scrollContainer.appendChild(card.firstElementChild);
  });

  // Clone for infinite scroll if necessary
  if(items.length >= 3) {
      items.forEach(item => {
        const card = document.createElement("div");
        card.innerHTML = getCarouselCardHTML(item);
        scrollContainer.appendChild(card.firstElementChild);
      });
      // Clone set 2
      items.forEach(item => {
        const card = document.createElement("div");
        card.innerHTML = getCarouselCardHTML(item);
        scrollContainer.appendChild(card.firstElementChild);
      });
      initCarouselLogic(items.length); // Infinite scroll helper
  }

  // Attach listeners to everything (originals + clones) all at once
  attachCartListeners(scrollContainer);
}

function renderPopularRotator(items) {
  const container = document.getElementById("popular-rotator");
  const indicators = document.getElementById("pop-indicators");
  if(!container) return;

  container.innerHTML = "";
  if(indicators) indicators.innerHTML = "";

  if(!items || items.length === 0) {
     container.innerHTML = "<div class='h-full flex items-center justify-center flex-col text-white/30 italic'><span>Aún no hay tendencias.</span></div>";
     return;
  }

  items.forEach((item, idx) => {
      const slide = document.createElement("div");
      // Slide HTML generation
      constructPopularSlideHTML(slide, item, idx);
      container.appendChild(slide);

      if(indicators) {
          const dot = document.createElement("button");
          // Dot setup
          dot.className = idx === 0 ? "h-1.5 rounded-full transition-all duration-300 bg-orange-500 w-6" : "h-1.5 rounded-full transition-all duration-300 bg-white/20 w-1.5 hover:bg-white/40";
          indicators.appendChild(dot);
      }
  });

  attachCartListeners(container);
  initRotatorLogic(container, indicators, items.length);
}

// --- UTILS & LISTENERS ---

function setupEventListeners() {
    const btnConfirm = document.getElementById("btn-confirm-presence");
    if (btnConfirm) {
        btnConfirm.addEventListener("click", () => {
            confirmedPresence = true;
            localStorage.setItem("capypay_dining_confirmed", "true");
            updateDiningState();
            showToast("¡Bienvenido! Te avisaremos cuando salga tu pedido.", "success");
        });
    }

    const btnComplete = document.getElementById("btn-complete-order");
    if (btnComplete) {
        btnComplete.addEventListener("click", () => {
            if (activeOrder && activeOrder.id) {
                const dismissed = JSON.parse(localStorage.getItem("capypay_dismissed_orders") || "[]");
                if (!dismissed.includes(activeOrder.id)) {
                    dismissed.push(activeOrder.id);
                    localStorage.setItem("capypay_dismissed_orders", JSON.stringify(dismissed));
                }
            }
            activeOrder = null;
            confirmedPresence = false;
            localStorage.removeItem("capypay_dining_confirmed");
            currentState = DiningState.BROWSING;
            updateDiningState();
            showToast("Gracias por usar CapyPay Comedor 🍔", "success");
        });
    }
}

function initFilterListeners() {
    const buttons = document.querySelectorAll(".filter-btn");
    buttons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
            buttons.forEach(b => b.classList.remove("active", "bg-brand-white", "text-brand-black"));
            buttons.forEach(b => b.classList.add("bg-white/5", "text-white/60"));
            
            e.currentTarget.classList.remove("bg-white/5", "text-white/60");
            e.currentTarget.classList.add("active", "bg-brand-white", "text-brand-black");

            const category = e.currentTarget.dataset.category;
            const filtered = filterItems(allCarouselItems, category);
            renderMenuCarousel(filtered);
        });
    });
}

function filterItems(items, category) {
    if (category === "all") return items;
    return items.filter(item => {
        if(item.category) return item.category.trim().toLowerCase() === category.toLowerCase();
        const txt = (item.name + " " + item.description).toLowerCase();
        if(category === "bebida") return txt.match(/jugo|malta|agua|refresco|soda/);
        if(category === "desayuno") return txt.match(/empanada|arepa|cachapa|teque|pastelito/);
        if(category === "almuerzo") return txt.match(/pabellon|pollo|carne|pasta|arroz|burger|pepito/);
        return true;
    });
}

function attachCartListeners(container) {
    if(!container) return;
    
    // Helper to bind
    const bindBtn = (btn) => {
        btn.removeEventListener("click", handleCartClick);
        btn.addEventListener("click", handleCartClick);
    };

    // Case 1: Container is the button itself
    if (container.classList && (container.classList.contains("add-to-cart-btn") || container.classList.contains("pop-add-btn"))) {
        bindBtn(container);
    }

    // Case 2: Container has children buttons
    if (container.querySelectorAll) {
        const btns = container.querySelectorAll(".add-to-cart-btn, .pop-add-btn");
        btns.forEach(bindBtn);
    }
}

function handleCartClick(e) {
    e.preventDefault();
    e.stopPropagation();
    const btn = e.currentTarget;
    const item = {
        id: btn.dataset.id,
        name: btn.dataset.name,
        price: parseInt(btn.dataset.price || "0"),
        image: btn.dataset.image,
        type: 'comedor'
    };
    addItemToCart(item);

    // Animación interactiva en el botón
    const originalText = btn.innerHTML;
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
    </svg>`;
    btn.classList.add("bg-green-500", "text-white", "border-green-700");
    btn.classList.remove("bg-[#d7fd48]", "text-black");
    
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.classList.remove("bg-green-500", "text-white", "border-green-700");
        btn.classList.add("bg-[#d7fd48]", "text-black");
    }, 1000);

    showToast(`¡${item.name} añadido al carrito!`, "success");
}

function updateText(id, text) {
    const el = document.getElementById(id);
    if(el) el.innerText = text;
}

function startStatsTimer(userId) {
    setInterval(() => {
        loadStats();
        if (userId) checkActiveOrders(userId);
    }, 10000);
}

function startTipRotation() {
    let index = 0;
    const tipEl = document.getElementById("capy-tip-text");
    if (!tipEl) return;
    setInterval(() => {
        index = (index + 1) % TIPS.length;
        tipEl.style.opacity = "0";
        setTimeout(() => { tipEl.innerText = TIPS[index]; tipEl.style.opacity = "1"; }, 300);
    }, 8000);
}

// --- HELPER HTML GENERATORS (Moved from Astro file) ---

function getCarouselCardHTML(item) {
    const isOutOfStock = item.is_available === false || (item.stock !== undefined && item.stock !== null && item.stock <= 0);
    const stockOverlay = isOutOfStock ? `
      <div class="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center">
        <span class="text-red-500 font-black text-[10px] md:text-xs border-2 border-red-500 px-3 py-1 rounded-full uppercase tracking-widest bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.3)] transform -rotate-12">
          Sin Stock
        </span>
      </div>
    ` : '';

    return `
      <div class="flex-none w-[80vw] sm:w-72 md:w-[calc(25%-1.125rem)] bg-white/5 border border-white/5 rounded-2xl md:rounded-3xl p-3 md:p-4 group transition-all ${isOutOfStock ? 'opacity-70 grayscale-[0.5]' : 'hover:bg-white/8 hover:-translate-y-2'} snap-center duration-500 ease-out flex flex-col text-center">
        <div class="relative h-32 md:h-48 rounded-xl md:rounded-2xl overflow-hidden mb-2 md:mb-3 shadow-lg shrink-0 ${isOutOfStock ? 'scale-[0.98]' : ''}">
          ${stockOverlay}
          <img alt="${item.name}" class="w-full h-full object-cover ${isOutOfStock ? '' : 'group-hover:scale-110'} transition-transform duration-700" src="${item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'}" />
          <div class="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-white/10 z-20">
            <span class="text-brand-lime font-black text-[9px] md:text-[10px]">${item.price} B</span>
          </div>
        </div>
        <h4 class="font-bold text-xs md:text-base text-white leading-tight mb-1 truncate px-1 ${isOutOfStock ? 'text-white/60' : ''}">${item.name}</h4>
        <div class="grow mb-2 md:mb-3 w-full">
            <p class="text-white/50 text-[9px] md:text-[10px] line-clamp-2 leading-tight px-1">${item.description}</p>
        </div>
        <button class="${isOutOfStock ? 'w-full py-1.5 md:py-2.5 rounded-lg md:rounded-xl border border-white/10 text-white/30 font-bold text-[9px] md:text-[10px] uppercase bg-white/5 cursor-not-allowed mt-auto flex items-center justify-center cursor-not-allowed' : 'add-to-cart-btn w-full py-1.5 md:py-2.5 rounded-lg md:rounded-xl border border-brand-lime/30 text-brand-lime font-bold text-[9px] md:text-[10px] uppercase hover:bg-brand-lime hover:text-black transition-all mt-auto flex items-center justify-center cursor-pointer'}"
          data-id="${item.id}" data-name="${item.name}" data-price="${item.price}" data-image="${item.image_url}" ${isOutOfStock ? 'disabled' : ''}>
          <span>${isOutOfStock ? 'AGOTADO' : 'AGREGAR'}</span>
        </button>
      </div>
    `;
}

function constructPlatoDiaHTML(container, item) {
    const isOutOfStock = item.is_available === false || (item.stock !== undefined && item.stock !== null && item.stock <= 0);
    const stockOverlay = isOutOfStock ? `
      <div class="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-30 flex flex-col items-center justify-center">
        <span class="text-red-500 font-black text-2xl border-4 border-red-500 px-6 py-2 rounded-full uppercase tracking-widest bg-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.3)] transform -rotate-12">
          Sin Stock
        </span>
      </div>
    ` : '';

    container.innerHTML = `
    <div class="grid h-min w-full overflow-hidden rounded-3xl border border-white/10 bg-[#1c2210] shadow-2xl ${isOutOfStock ? 'opacity-80 grayscale-[0.3]' : ''}" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
            <div class="relative h-64 sm:h-auto min-h-70 w-full">
                ${stockOverlay}
                <div class="absolute inset-0 bg-linear-to-t md:bg-linear-to-r from-[#0a0a0a] via-transparent to-transparent z-10 opacity-70"></div>
                <img alt="${item.name}" class="absolute inset-0 w-full h-full object-cover" style="width:100%; height:100%;" src="${item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"}" />
                <div class="absolute top-4 left-4 z-20">
                    <span class="bg-brand-lime text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-xl flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
                    PLATO DEL DÍA
                    </span>
                </div>
            </div>
            
            <div class="p-6 md:p-8 flex flex-col justify-center bg-[#1c2210] w-full box-border relative z-20">
              <h3 class="text-2xl md:text-3xl font-extrabold mb-3 leading-tight text-white line-clamp-2 ${isOutOfStock ? 'text-white/60' : ''}">${item.name}</h3>
              <p class="text-white/70 text-sm md:text-base mb-6 font-medium line-clamp-3 leading-relaxed">${item.description}</p>
              
              <div class="flex items-center justify-between mt-auto gap-4 pt-4 border-t border-white/5">
                   <div class="flex flex-col">
                    <span class="text-[10px] text-white/40 font-bold uppercase tracking-wider">PRECIO</span>
                    <p class="text-3xl font-black text-brand-lime whitespace-nowrap ${isOutOfStock ? 'opacity-50' : ''}">${parseFloat(item.price) === 0 ? "GRATIS" : item.price + " BARAS"}</p>
                   </div>
                  <button class="${isOutOfStock ? 'w-full md:w-auto bg-white/5 border border-white/10 text-white/30 font-black px-6 py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 text-xs uppercase tracking-widest cursor-not-allowed' : 'add-to-cart-btn bg-white text-black hover:bg-brand-lime font-black px-6 py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all cursor-pointer'}"
                  data-id="${item.id}" data-name="${item.name}" data-price="${item.price}" data-image="${item.image_url}" ${isOutOfStock ? 'disabled' : ''}>
                    <span>${isOutOfStock ? 'AGOTADO' : 'AÑADIR'}</span>
                  </button>
              </div>
            </div>
        </div>
    `;
}

function constructPopularSlideHTML(slide, item, idx) {
    const isOutOfStock = item.is_available === false || (item.stock !== undefined && item.stock !== null && item.stock <= 0);
    const stockOverlay = isOutOfStock ? `
      <div class="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-30 flex flex-col items-center justify-center">
        <span class="text-red-500 font-black text-xl md:text-2xl border-4 border-red-500 px-6 py-2 rounded-full uppercase tracking-widest bg-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.3)] transform -rotate-12">
          Sin Stock
        </span>
      </div>
    ` : '';
    
    slide.className = `absolute inset-0 w-full h-full transition-all duration-700 ease-in-out flex flex-col md:flex-row bg-[#1c2210] ${idx === 0 ? "opacity-100 translate-x-0 z-10 pointer-events-auto" : "opacity-0 translate-x-full z-0 pointer-events-none"} ${isOutOfStock ? 'grayscale-[0.3]' : ''}`;
    slide.innerHTML = `
        <div class="relative w-full md:w-1/2 h-1/2 md:h-full overflow-hidden">
            ${stockOverlay}
            <div class="absolute inset-0 bg-linear-to-t md:bg-linear-to-r from-[#0a0a0a] via-transparent to-transparent z-10 opacity-60"></div>
             <img src="${item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"}" class="w-full h-full object-cover ${isOutOfStock ? '' : 'transform hover:scale-105'} transition-transform duration-1000" alt="${item.name}">
        </div>
        <div class="w-full md:w-1/2 h-1/2 md:h-full p-6 md:p-10 flex flex-col justify-center relative">
            <h3 class="text-2xl md:text-3xl font-black text-white mb-2 leading-tight line-clamp-2 ${isOutOfStock ? 'text-white/60' : ''}">${item.name}</h3>
            <p class="text-white/60 text-xs md:text-sm font-medium mb-6 line-clamp-3 leading-relaxed">${item.description || ""}</p>
            <div class="mt-auto flex items-center gap-4 relative z-20">
                <span class="text-2xl font-bold text-white ${isOutOfStock ? 'opacity-50' : ''}">${item.price} B</span>
                <button class="${isOutOfStock ? 'w-full md:w-auto bg-white/5 border border-white/10 text-white/30 font-bold uppercase tracking-widest text-[10px] md:text-xs px-6 py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-not-allowed' : 'pop-add-btn bg-white text-black hover:bg-orange-500 hover:text-white transition-colors duration-300 font-bold uppercase tracking-widest text-[10px] md:text-xs px-6 py-3 rounded-xl shadow-lg flex-1 md:flex-none flex items-center justify-center gap-2 group cursor-pointer'}" 
                  data-id="${item.id}" data-name="${item.name}" data-price="${item.price}" data-image="${item.image_url || ""}" ${isOutOfStock ? 'disabled' : ''}>
                    ${isOutOfStock ? 'AGOTADO' : 'PEDIR'}
                </button>
            </div>
        </div>
    `;
}

function initCarouselLogic(count) {
    const scrollContainer = document.getElementById("carousel-container");
    const btnLeft = document.getElementById("scroll-left");
    const btnRight = document.getElementById("scroll-right");

    if (!scrollContainer || !btnLeft || !btnRight) return;

    const getCardWidth = () => {
        const card = scrollContainer.children[0];
        if (!card) return 0;
        const style = window.getComputedStyle(scrollContainer);
        const gap = parseFloat(style.gap) || 24;
        return card.clientWidth + gap;
    };

    // Scroll Fix on Init
    setTimeout(() => {
        const width = getCardWidth();
        if (width > 0) {
            const singleSetWidth = width * count;
            scrollContainer.scrollLeft = singleSetWidth;
        }
    }, 100);

    // Infinite Scroll Logic
    scrollContainer.removeEventListener("scroll", scrollContainer._infiniteScrollHandler);
    scrollContainer._infiniteScrollHandler = () => {
        const width = getCardWidth();
        if (width === 0) return;
        const singleSetWidth = width * count;
        
        if (scrollContainer.scrollLeft < 50) {
            scrollContainer.scrollLeft += singleSetWidth;
        } else if (scrollContainer.scrollLeft > singleSetWidth * 2 - 50) {
            scrollContainer.scrollLeft -= singleSetWidth;
        }
    };
    scrollContainer.addEventListener("scroll", scrollContainer._infiniteScrollHandler);

    // Smooth Scroll Helper
    const smoothScroll = (element, change, duration) => {
        const start = element.scrollLeft;
        const startTime = performance.now();
        const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const animateScroll = (currentTime) => {
            const timeElapsed = currentTime - startTime;
            let progress = timeElapsed / duration;
            if (progress > 1) progress = 1;
            element.scrollLeft = start + change * easeInOutCubic(progress);
            if (progress < 1) requestAnimationFrame(animateScroll);
        };
        requestAnimationFrame(animateScroll);
    };

    // Button Listeners (Prevent multiple bindings)
    btnLeft.onclick = () => smoothScroll(scrollContainer, -getCardWidth() * 2, 600);
    btnRight.onclick = () => smoothScroll(scrollContainer, getCardWidth() * 2, 600);
}

function initRotatorLogic(container, indicators, count) {
    let currentIndex = 0;
    const slides = container.children;
    const dots = indicators ? indicators.children : [];
    let intervalId;

    const update = () => {
        for(let i=0; i<count; i++) {
             if (i === currentIndex) {
              slides[i].classList.remove("opacity-0", "translate-x-full", "pointer-events-none");
              slides[i].classList.add("opacity-100", "translate-x-0", "z-10", "pointer-events-auto");
              if(dots[i]) dots[i].className = "h-1.5 rounded-full transition-all duration-300 bg-orange-500 w-6 cursor-pointer";
             } else {
                 slides[i].classList.add("opacity-0", "translate-x-full", "z-0", "pointer-events-none");
                 slides[i].classList.remove("opacity-100", "translate-x-0");    
                 if(dots[i]) dots[i].className = "h-1.5 rounded-full transition-all duration-300 bg-white/20 w-1.5 cursor-pointer";
             }
        }
    };

    const startTimer = () => {
        clearInterval(intervalId);
        intervalId = setInterval(() => {
            currentIndex = (currentIndex + 1) % count;
            update();
        }, 5000);
    };

    if (indicators) {
        Array.from(dots).forEach((dot, index) => {
            dot.addEventListener("click", () => {
                currentIndex = index;
                update();
                startTimer(); // Reset auto rotation
            });
        });
    }

    update();
    startTimer();
}
