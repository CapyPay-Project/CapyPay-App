// @ts-nocheck
import { rankingService, authService, userService } from "../services/api";

const estado = {
  vista: "users",
  datos: null,
  paginaActual: 1,
  itemsPorPagina: 7,
  alcance: "global",
  periodo: "semana",
  contactIds: [],
};

function setText(id, valor) {
  const el = document.getElementById(id);
  if (el) el.textContent = valor;
}

function setImg(id, src, nombre = "User") {
  const el = document.getElementById(id);
  if (!el) return;
  el.src = src || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(nombre)}`;
  el.onerror = () => {
    el.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random`;
  };
}

function iconoPorFacultad(nombre = "") {
  const n = nombre.toLowerCase();
  if (n.includes("medicina") || n.includes("salud")) return "🩺";
  if (n.includes("ingenieria") || n.includes("sistemas")) return "💻";
  if (n.includes("derecho") || n.includes("juridicas")) return "⚖️";
  if (n.includes("agronom")) return "🌾";
  if (n.includes("econom")) return "💰";
  return "🏫";
}

async function cargarDatos() {
  const listContainer = document.getElementById("ranking-list-container");

  try {
    const usuario = authService.getCurrentUser();
    const userId = usuario ? (usuario.id || usuario.user_id) : null;

    const [respuesta, contactsResp] = await Promise.all([
      rankingService.getRanking(userId),
      userId ? userService.getContacts(userId).catch(() => ({ contactos: [] })) : Promise.resolve({ contactos: [] }),
    ]);

    estado.contactIds = (contactsResp?.contactos || []).map(c => c.contact_id).filter(Boolean);

    if (respuesta) {
      estado.datos = respuesta;
      renderizar();
    }
  } catch (error) {
    console.error("Error al cargar el ranking:", error);
    if (listContainer) {
      listContainer.innerHTML = '<div class="p-6 text-center font-bold uppercase">Error al cargar el ranking. Intenta de nuevo.</div>';
    }
  }
}

function cambiarTab(vista) {
  estado.vista = vista;

  const tabUsers     = document.getElementById("tab-users");
  const tabFaculties = document.getElementById("tab-faculties");

  if (!tabUsers || !tabFaculties) return;

  const claseActiva = ["bg-[#d7fd48]", "text-black", "border-b-4", "sm:border-b-0", "border-r-4", "border-black", "active"];
  const claseInactiva = ["bg-white", "text-black/50", "hover:bg-gray-100"];

  if (vista === "users") {
    tabUsers.classList.remove(...claseInactiva);
    tabUsers.classList.add(...claseActiva);
    tabFaculties.classList.remove(...claseActiva);
    tabFaculties.classList.add(...claseInactiva);
  } else {
    tabFaculties.classList.remove(...claseInactiva);
    tabFaculties.classList.add(...claseActiva);
    tabUsers.classList.remove(...claseActiva);
    tabUsers.classList.add(...claseInactiva);
  }

  renderizar();
}

function renderizar() {
  if (!estado.datos) return;

  const podiumContainer = document.getElementById("podium-container");
  if (!podiumContainer) return;

  podiumContainer.style.opacity = "0";
  setTimeout(() => {
    if (estado.vista === "users") renderizarUsuarios();
    else renderizarFacultades();
    podiumContainer.style.opacity = "1";
  }, 200);

  actualizarFooter();
}

function renderizarUsuarios() {
  const { top3, list } = estado.datos.users || {};
  const battleSummary = document.getElementById("faculty-battle-summary");
  const listTitle     = document.getElementById("ranking-list-title");

  actualizarPodio(top3 || [], "user");
  actualizarLista(list || [], "user");

  const facultades = estado.datos.faculties;
  if (facultades && facultades.length > 0) actualizarBatallaFacultades(facultades);
  if (battleSummary) battleSummary.style.display = "block";

  if (listTitle) listTitle.textContent = "Top Global 10";
}

function renderizarFacultades() {
  const facultades = estado.datos?.faculties || [];

  const battleSummary = document.getElementById("faculty-battle-summary");
  const listTitle     = document.getElementById("ranking-list-title");

  if (facultades.length === 0) {
    const listContainer = document.getElementById("ranking-list-container");
    if (listContainer) {
      listContainer.innerHTML = '<div class="p-6 text-center font-bold uppercase">Sin datos de facultades aún.</div>';
    }
    actualizarPodio([], "faculty");
    if (battleSummary) battleSummary.style.display = "none";
    if (listTitle) listTitle.textContent = "Clasificación de Facultades";
    return;
  }

  actualizarPodio(facultades.slice(0, 3), "faculty");
  actualizarLista(facultades.slice(3), "faculty");
  if (battleSummary) battleSummary.style.display = "none";
  if (listTitle) listTitle.textContent = "Clasificación General";
}

function actualizarPodio(items, tipo) {
  actualizarTarjetaPodio(1, items[0] || { name: "-", points: 0, xp: 0, total_xp: 0 }, tipo);
  actualizarTarjetaPodio(2, items[1] || { name: "-", points: 0, xp: 0, total_xp: 0 }, tipo);
  actualizarTarjetaPodio(3, items[2] || { name: "-", points: 0, xp: 0, total_xp: 0 }, tipo);
}

function actualizarTarjetaPodio(rango, datos, tipo) {
  if (!datos) return;

  const nameEl   = document.getElementById(`rank${rango}-name`);
  const ptsEl    = document.getElementById(`rank${rango}-points`);
  const avatarEl = document.getElementById(`rank${rango}-avatar`);
  const iconEl   = document.getElementById(`rank${rango}-icon`);

  const puntos      = tipo === "user" ? (datos.points || datos.xp || 0) : (datos.total_xp || datos.xp || 0);
  const nombreMostrar = tipo === "user" ? datos.name : (datos.faculty || datos.name);

  if (nameEl) nameEl.textContent = nombreMostrar || "-";
  if (ptsEl)  ptsEl.textContent  = `${puntos} XP`;

  if (tipo === "user") {
    if (avatarEl) {
      avatarEl.classList.remove("hidden");
      avatarEl.src = datos.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(nombreMostrar || "U")}`;
    }
    if (iconEl) iconEl.classList.add("hidden");
  } else {
    if (avatarEl) avatarEl.classList.add("hidden");
    if (iconEl) {
      iconEl.classList.remove("hidden");
      iconEl.textContent = iconoPorFacultad(nombreMostrar);
    }
  }
}

function obtenerListaFiltrada(items, tipo) {
  if (!items || !items.length) return [];
  let resultado = items.filter((item) => {
    const pts = tipo === "user" ? (item.points || item.xp || 0) : (item.total_xp || item.xp || 0);
    return pts > 0;
  });
  return resultado;
}

function renderizarPaginacion(total, totalPaginas) {
  const pagDiv  = document.getElementById("ranking-pagination");
  const prevBtn = document.getElementById("pag-prev");
  const nextBtn = document.getElementById("pag-next");
  const infoEl  = document.getElementById("pag-info");

  if (!pagDiv) return;

  if (totalPaginas <= 1) {
    pagDiv.classList.remove("flex");
    pagDiv.classList.add("hidden");
    return;
  }

  pagDiv.classList.remove("hidden");
  pagDiv.classList.add("flex");
  if (infoEl)  infoEl.textContent  = `Página ${estado.paginaActual} de ${totalPaginas}`;
  if (prevBtn) prevBtn.disabled    = estado.paginaActual <= 1;
  if (nextBtn) nextBtn.disabled    = estado.paginaActual >= totalPaginas;
}

function actualizarLista(items, tipo) {
  const listContainer = document.getElementById("ranking-list-container");
  if (!listContainer) return;

  const listadoFiltrado = obtenerListaFiltrada(items, tipo);

  if (listadoFiltrado.length === 0) {
    listContainer.innerHTML = `<div class="p-6 text-center font-bold uppercase">Sin más participantes.</div>`;
    const pagDiv = document.getElementById("ranking-pagination");
    if (pagDiv) { pagDiv.classList.remove("flex"); pagDiv.classList.add("hidden"); }
    return;
  }

  const totalPaginas = Math.ceil(listadoFiltrado.length / estado.itemsPorPagina);
  if (estado.paginaActual > totalPaginas) estado.paginaActual = 1;

  const inicio    = (estado.paginaActual - 1) * estado.itemsPorPagina;
  const pagItems  = listadoFiltrado.slice(inicio, inicio + estado.itemsPorPagina);

  listContainer.innerHTML = "";

  pagItems.forEach((item, indice) => {
    const rango  = inicio + indice + 4;
    const puntos = tipo === "user" ? (item.points ?? item.xp ?? 0) : (item.total_xp ?? item.xp ?? 0);
    const nombre = tipo === "user" ? item.name : (item.faculty || item.name);
    
    let soyYo = false;
    if (tipo === "user" && estado.datos?.users?.user) {
        soyYo = String(estado.datos.users.user.id) === String(item.id);
    }

    const fila = document.createElement("div");
    fila.className = `flex items-center justify-between p-4 sm:p-6 ${soyYo ? "bg-[#d7fd48]" : "bg-white hover:bg-gray-100"} transition-colors`;

    let iconoOAvatar = "";
    if (tipo === "user") {
      iconoOAvatar = `<img src="${item.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(nombre)}`}" class="w-10 h-10 border-2 border-black bg-white rounded-full object-cover" />`;
    } else {
      iconoOAvatar = `<div class="w-10 h-10 border-2 border-black bg-white rounded-full flex items-center justify-center text-xl">${iconoPorFacultad(nombre)}</div>`;
    }

    fila.innerHTML = `
      <div class="flex items-center gap-4 sm:gap-6">
        <span class="font-black text-2xl w-8">${rango.toString().padStart(2, '0')}</span>
        ${iconoOAvatar}
        <span class="font-black text-xl uppercase truncate max-w-[120px] sm:max-w-none">${nombre} ${soyYo ? "(Tú)" : ""}</span>
      </div>
      <span class="font-bold text-xl sm:text-2xl">${puntos} XP</span>
    `;
    listContainer.appendChild(fila);
  });

  renderizarPaginacion(listadoFiltrado.length, totalPaginas);
}

function actualizarBatallaFacultades(facultades) {
  const textEl    = document.getElementById("battle-details-text");
  const container = document.getElementById("battle-bar-container");

  if (!facultades || facultades.length === 0) {
    if (textEl)    textEl.textContent = "Guerra Fría (Sin datos)";
    if (container) container.innerHTML = `<div class="w-full h-full flex items-center justify-center font-bold text-xl border-4 border-black bg-white">Sin actividad reciente</div>`;
    return;
  }

  const f1 = facultades[0];
  const f2 = facultades[1];

  if (!f2) {
    if (textEl)    textEl.textContent = `${f1.name} domina el campus`;
    if (container) container.innerHTML = `
      <div class="h-full relative group flex items-center justify-center overflow-hidden border-4 border-black" style="width: 100%; background-color: ${f1.meta?.color || "#d7fd48"}">
        <span class="text-xl font-black uppercase text-black drop-shadow-md truncate">${f1.name} IMPARABLE</span>
      </div>`;
    return;
  }

  const diferencia = (f1.xp || 0) - (f2.xp || 0);
  if (textEl) textEl.textContent = `${f1.name} +${diferencia} pts sobre ${f2.name}`;

  const total = (f1.xp || 0) + (f2.xp || 0);
  const p1    = total > 0 ? ((f1.xp || 0) / total) * 100 : 50;
  const p2    = 100 - p1;

  if (container) {
    container.innerHTML = `
      <div class="bg-[#d7fd48] h-full border-r-4 border-black flex items-center justify-end px-2 whitespace-nowrap overflow-hidden transition-all duration-1000" style="width: ${p1}%;">
        <span class="font-black text-xl">🔥</span>
      </div>
      <div class="absolute inset-0 flex items-center justify-center font-black text-xl mix-blend-difference text-white pointer-events-none">${Math.round(p1)}% / ${Math.round(p2)}%</div>
    `;
  }
}

function actualizarFooter() {
  const usuario = estado.datos?.users?.user;
  if (!usuario) return;

  setText("user-rank", `#${usuario.rank}`);
  setText("user-points-footer", usuario.points || usuario.xp || 0);
  setImg("user-avatar-footer", usuario.avatar, usuario.name);
}

function inicializarContador() {
  const countdownEl = document.getElementById("countdown-timer");
  if (!countdownEl) return;

  const ahora       = new Date();
  const proximoDom  = new Date();
  proximoDom.setDate(ahora.getDate() + (7 - ahora.getDay()));
  proximoDom.setHours(23, 59, 59, 999);

  function actualizarContador() {
    const distancia = proximoDom.getTime() - new Date().getTime();
    if (distancia < 0) {
      countdownEl.innerText = "¡Finalizado!";
      return;
    }
    const dias    = Math.floor(distancia / (1000 * 60 * 60 * 24));
    const horas   = Math.floor((distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((distancia % (1000 * 60 * 60)) / (1000 * 60));
    countdownEl.innerText = `${dias.toString().padStart(2,"0")}d ${horas.toString().padStart(2,"0")}h ${minutos.toString().padStart(2,"0")}m`;
  }

  setInterval(actualizarContador, 60000);
  actualizarContador();
}

export function initRanking() {
  const tabUsers     = document.getElementById("tab-users");
  const tabFaculties = document.getElementById("tab-faculties");

  tabUsers?.addEventListener("click", () => {
    estado.paginaActual = 1;
    cambiarTab("users");
  });
  tabFaculties?.addEventListener("click", () => {
    estado.paginaActual = 1;
    cambiarTab("faculties");
  });

  document.getElementById("pag-prev")?.addEventListener("click", () => {
    if (estado.paginaActual > 1) {
      estado.paginaActual--;
      renderizar();
    }
  });
  document.getElementById("pag-next")?.addEventListener("click", () => {
    estado.paginaActual++;
    renderizar();
  });

  inicializarContador();
  cargarDatos();
}
