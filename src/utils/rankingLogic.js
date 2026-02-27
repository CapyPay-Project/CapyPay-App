// @ts-nocheck
/**
 * rankingLogic.js
 * ---------------
 * Lógica completa de la página de Ranking de Influencia.
 * Exporta `initRanking()` que conecta todos los eventos y carga los datos.
 *
 * Dependencias: rankingService, authService (de ../../services/api)
 */

import { rankingService, authService, userService } from "../services/api";

// ------------------------------------------------------------------
// Estado global de la vista
// ------------------------------------------------------------------
const estado = {
  vista: "users",       // "users" | "faculties"
  datos: null,          // Respuesta cruda de rankingService.getRanking()
  paginaActual: 1,      // Página actual de la lista
  itemsPorPagina: 7,    // Items del puesto 4 en adelante por página
  alcance: "global",    // "global" | "facultad" | "carrera" | "amigos"
  periodo: "semana",    // "semana" | "mes" | "historico"
  contactIds: [],       // Profile UUIDs de los contactos del usuario
};

// ------------------------------------------------------------------
// Utilidades de DOM
// ------------------------------------------------------------------

/** Establece el texto de un elemento por su ID */
function setText(id, valor) {
  const el = document.getElementById(id);
  if (el) el.textContent = valor;
}

/** Establece el src de una imagen por su ID, con fallback */
function setImg(id, src, nombre = "User") {
  const el = document.getElementById(id);
  if (!el) return;
  el.src = src || `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random`;
  el.onerror = () => {
    el.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random`;
  };
}

/** Devuelve el emoji de icono correspondiente al nombre de una facultad */
function iconoPorFacultad(nombre = "") {
  const n = nombre.toLowerCase();
  if (n.includes("medicina") || n.includes("salud")) return "🩺";
  if (n.includes("ingenieria") || n.includes("sistemas")) return "💻";
  if (n.includes("derecho") || n.includes("juridicas")) return "⚖️";
  if (n.includes("agronom")) return "🌾";
  if (n.includes("econom")) return "💰";
  return "🏫";
}

// ------------------------------------------------------------------
// Carga de datos
// ------------------------------------------------------------------

async function cargarDatos() {
  const listContainer = document.getElementById("ranking-list-container");

  try {
    const usuario = authService.getCurrentUser();
    const userId = usuario ? (usuario.id || usuario.user_id) : null;

    // Cargar ranking y contactos en paralelo
    const [respuesta, contactsResp] = await Promise.all([
      rankingService.getRanking(userId),
      userId ? userService.getContacts(userId).catch(() => ({ contactos: [] })) : Promise.resolve({ contactos: [] }),
    ]);

    // Guardar IDs de contactos para filtro de amigos
    estado.contactIds = (contactsResp?.contactos || []).map(c => c.contact_id).filter(Boolean);

    if (respuesta) {
      estado.datos = respuesta;
      renderizar();
    }
  } catch (error) {
    console.error("Error al cargar el ranking:", error);
    if (listContainer) {
      listContainer.innerHTML = '<div class="p-6 text-center text-red-400 italic">Error al cargar el ranking. Intenta de nuevo.</div>';
    }
    // Mostrar toast si está disponible en la página
    if (typeof window.showToast === "function") {
      window.showToast("No se pudo cargar el ranking.", "error", "Error de red");
    }
  }
}

// ------------------------------------------------------------------
// Cambio de tab (Estudiantes / Facultades)
// ------------------------------------------------------------------

function cambiarTab(vista) {
  estado.vista = vista;

  const tabUsers     = document.getElementById("tab-users");
  const tabFaculties = document.getElementById("tab-faculties");

  if (!tabUsers || !tabFaculties) return;

  const claseActiva   = ["bg-brand-lime", "text-black", "shadow-lg", "active"];
  const claseInactiva = ["bg-white/5", "text-white/50"];

  if (vista === "users") {
    tabUsers.classList.add(...claseActiva);
    tabUsers.classList.remove(...claseInactiva);
    tabFaculties.classList.remove(...claseActiva);
    tabFaculties.classList.add(...claseInactiva);
  } else {
    tabFaculties.classList.add(...claseActiva);
    tabFaculties.classList.remove(...claseInactiva);
    tabUsers.classList.remove(...claseActiva);
    tabUsers.classList.add(...claseInactiva);
  }

  renderizar();
}

// ------------------------------------------------------------------
// Render principal (con transición de opacidad)
// ------------------------------------------------------------------

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

// ------------------------------------------------------------------
// Vista: Estudiantes
// ------------------------------------------------------------------

function renderizarUsuarios() {
  const { top3, list } = estado.datos.users || {};
  const battleSummary = document.getElementById("faculty-battle-summary");
  const listTitle     = document.getElementById("ranking-list-title");

  if (estado.alcance === "amigos") {
    // Combinar todos los usuarios y filtrar por contactos del usuario
    const todos   = [...(top3 || []), ...(list || [])];
    const amigos  = todos.filter(u => estado.contactIds.includes(u.id));
    actualizarPodio(amigos.slice(0, 3), "user");
    actualizarLista(amigos.slice(3), "user");
    if (listTitle) listTitle.textContent = "Ranking de Amigos";
    if (battleSummary) battleSummary.style.display = "none";
    return;
  }

  actualizarPodio(top3 || [], "user");
  actualizarLista(list || [], "user");

  // Mostrar la barra de batalla de facultades
  const facultades = estado.datos.faculties;
  if (facultades && facultades.length > 0) actualizarBatallaFacultades(facultades);
  if (battleSummary) battleSummary.style.display = "block";

  if (listTitle) listTitle.textContent = "Top Global 10";
}

// ------------------------------------------------------------------
// Vista: Facultades
// ⚠ FIX: null-guard para `state.data.faculties` — si la API no devuelve
//    facultades, el array vacío previene un crash en .slice()
// ------------------------------------------------------------------

function renderizarFacultades() {
  const facultades = estado.datos?.faculties || [];

  const battleSummary = document.getElementById("faculty-battle-summary");
  const listTitle     = document.getElementById("ranking-list-title");

  if (facultades.length === 0) {
    // Estado vacío: no hay datos de facultades aún
    const listContainer = document.getElementById("ranking-list-container");
    const podiumContainer = document.getElementById("podium-container");

    if (listContainer) {
      listContainer.innerHTML = '<div class="p-6 text-center text-white/40 italic">Sin datos de facultades aún.</div>';
    }
    if (podiumContainer) {
      // Limpiar el podio con placeholders vacíos
      actualizarPodio([], "faculty");
    }
    if (battleSummary) battleSummary.style.display = "none";
    if (listTitle) listTitle.textContent = "Clasificación de Facultades";
    return;
  }

  actualizarPodio(facultades.slice(0, 3), "faculty");
  actualizarLista(facultades.slice(3), "faculty");
  if (battleSummary) battleSummary.style.display = "none";
  if (listTitle) listTitle.textContent = "Clasificación General";
}

// ------------------------------------------------------------------
// Actualización del podio (Top 3)
// ------------------------------------------------------------------

function actualizarPodio(items, tipo) {
  actualizarTarjetaPodio(1, items[0] || { name: "-", xp: 0, total_xp: 0 }, tipo);
  actualizarTarjetaPodio(2, items[1] || { name: "-", xp: 0, total_xp: 0 }, tipo);
  actualizarTarjetaPodio(3, items[2] || { name: "-", xp: 0, total_xp: 0 }, tipo);
}

function actualizarTarjetaPodio(rango, datos, tipo) {
  if (!datos) return;

  const nameEl   = document.getElementById(`rank${rango}-name`);
  const ptsEl    = document.getElementById(`rank${rango}-points`);
  const avatarEl = document.getElementById(`rank${rango}-avatar`);
  const iconEl   = document.getElementById(`rank${rango}-icon`);

  const puntos      = tipo === "user"
    ? (datos.points || datos.xp || 0)
    : (datos.total_xp || datos.xp || 0);
  const nombreMostrar = tipo === "user"
    ? datos.name
    : (datos.faculty || datos.name);

  if (nameEl) nameEl.textContent = nombreMostrar || "-";
  if (ptsEl)  ptsEl.textContent  = `${puntos} pts`;

  if (tipo === "user") {
    if (avatarEl) {
      avatarEl.classList.remove("hidden");
      avatarEl.src = datos.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreMostrar || "U")}&background=random`;
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

// ------------------------------------------------------------------
// Filtra la lista de items: excluye usuarios con 0/undefined puntos
// y aplica el filtro de alcance (global / facultad)
// ------------------------------------------------------------------

function obtenerListaFiltrada(items, tipo) {
  if (!items || !items.length) return [];

  // Excluir entradas sin puntos
  let resultado = items.filter((item) => {
    const pts = tipo === "user"
      ? (item.points || item.xp || 0)
      : (item.total_xp || item.xp || 0);
    return pts > 0;
  });

  // Aplicar filtro de alcance solo en vista de usuarios
  if (tipo === "user") {
    const yo = estado.datos?.users?.user;
    if (estado.alcance === "facultad" && yo?.faculty) {
      resultado = resultado.filter((item) => item.faculty === yo.faculty);
    } else if (estado.alcance === "carrera" && yo?.career) {
      resultado = resultado.filter((item) => item.career === yo.career);
    }
    // "amigos": la lista ya viene pre-filtrada desde renderizarUsuarios()
  }

  return resultado;
}

// ------------------------------------------------------------------
// Actualiza los controles de paginación
// ------------------------------------------------------------------

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

// ------------------------------------------------------------------
// Actualización de la lista (Ranks 4+) con filtrado y paginación
// ------------------------------------------------------------------

function actualizarLista(items, tipo) {
  const listContainer = document.getElementById("ranking-list-container");
  if (!listContainer) return;

  const listadoFiltrado = obtenerListaFiltrada(items, tipo);

  if (listadoFiltrado.length === 0) {
    const msj = tipo === "user" && estado.alcance === "facultad"
      ? "No hay otros estudiantes de tu facultad en el ranking aún."
      : tipo === "user" && estado.alcance === "carrera"
      ? "No hay otros estudiantes de tu carrera en el ranking aún."
      : tipo === "user" && estado.alcance === "amigos"
      ? "Ninguno de tus amigos aparece en el top 20 aún. ¡Invítalos a competir!"
      : "Sin más participantes en esta categoría.";
    listContainer.innerHTML = `<div class="p-6 text-center text-white/40 italic">${msj}</div>`;
    const pagDiv = document.getElementById("ranking-pagination");
    if (pagDiv) { pagDiv.classList.remove("flex"); pagDiv.classList.add("hidden"); }
    return;
  }

  // Paginación
  const totalPaginas = Math.ceil(listadoFiltrado.length / estado.itemsPorPagina);
  if (estado.paginaActual > totalPaginas) estado.paginaActual = 1;

  const inicio    = (estado.paginaActual - 1) * estado.itemsPorPagina;
  const pagItems  = listadoFiltrado.slice(inicio, inicio + estado.itemsPorPagina);

  listContainer.innerHTML = "";

  pagItems.forEach((item, indice) => {
    const rango  = inicio + indice + 4; // el podio ocupa 1-3
    const puntos = tipo === "user"
      ? (item.points ?? item.xp ?? 0)
      : (item.total_xp ?? item.xp ?? 0);
    const nombre = tipo === "user"
      ? item.name
      : (item.faculty || item.name);
    const soyYo  = tipo === "user"
      && estado.datos.users?.user
      && estado.datos.users.user.id === item.id;

    const fila = document.createElement("div");
    fila.className = `flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-all cursor-pointer group ${soyYo ? "user-highlight-card relative overflow-hidden" : ""}`;

    let iconoOAvatar = "";
    if (tipo === "user") {
      iconoOAvatar = `<img class="w-full h-full object-cover" src="${item.avatar}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random'"/>`;
    } else {
      iconoOAvatar = `<div class="bg-white/10 w-full h-full flex items-center justify-center text-xl">${iconoPorFacultad(nombre)}</div>`;
    }

    fila.innerHTML = `
      ${soyYo ? '<div class="absolute inset-0 bg-brand-lime/5 pointer-events-none"></div>' : ""}
      <span class="${soyYo ? "text-brand-lime" : "text-white/40"} font-black italic w-6 group-hover:text-white transition-colors text-center">${rango}</span>
      <div class="size-10 rounded-lg overflow-hidden border ${soyYo ? "border-brand-lime/30" : "border-white/10"} relative ${soyYo ? "z-10" : ""}">
        ${iconoOAvatar}
      </div>
      <div class="flex-1 flex flex-col justify-center min-w-0 ${soyYo ? "z-10" : ""}">
        <p class="font-bold text-white leading-tight truncate">${nombre} ${soyYo ? "(Tú)" : ""}</p>
        ${tipo === "user" ? `<p class="text-xs text-white/40 truncate">${item.faculty || "Sin facultad"}</p>` : ""}
      </div>
      <p class="text-brand-lime font-black italic text-right ${soyYo ? "z-10" : ""}">${puntos} pts</p>
    `;
    listContainer.appendChild(fila);
  });

  renderizarPaginacion(listadoFiltrado.length, totalPaginas);
}

// ------------------------------------------------------------------
// Actualización de la barra de batalla de facultades
// ------------------------------------------------------------------

function actualizarBatallaFacultades(facultades) {
  const textEl    = document.getElementById("battle-details-text");
  const container = document.getElementById("battle-bar-container");

  if (!facultades || facultades.length === 0) {
    if (textEl)    textEl.textContent = "Guerra Fría (Sin datos)";
    if (container) container.innerHTML = `<div class="w-full h-full flex items-center justify-center text-xs text-white/30 italic">Sin actividad reciente</div>`;
    return;
  }

  const f1 = facultades[0];
  const f2 = facultades[1]; // Puede ser undefined si solo hay una facultad

  if (!f2) {
    // Solo existe una facultad
    if (textEl)    textEl.textContent = `${f1.name} domina el campus`;
    if (container) container.innerHTML = `
      <div class="h-full relative group flex items-center justify-center overflow-hidden"
           style="width: 100%; background-color: ${f1.meta?.color || "#3b82f6"}">
        <span class="text-[10px] font-bold text-white drop-shadow-md truncate">${f1.name.toUpperCase()} IMPARABLE</span>
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
      <div class="h-full relative group transition-all duration-500 flex items-center justify-end pr-2 overflow-hidden"
           style="width: ${p1}%; background-color: ${f1.meta?.color || "#3b82f6"}">
        <span class="text-[10px] font-bold text-white drop-shadow-md truncate">${f1.name.substring(0, 3).toUpperCase()}</span>
      </div>
      <div class="h-full relative group transition-all duration-500 flex items-center pl-2 overflow-hidden"
           style="width: ${p2}%; background-color: ${f2.meta?.color || "#ef4444"}">
        <span class="text-[10px] font-bold text-white/90 drop-shadow-md truncate">${f2.name.substring(0, 3).toUpperCase()}</span>
      </div>
      <div class="absolute left-[${p1}%] top-0 bottom-0 w-1 bg-black/50 z-10 -translate-x-1/2"></div>
    `;
  }
}

// ------------------------------------------------------------------
// Actualización del footer (posición del usuario y rival)
// ------------------------------------------------------------------

function actualizarFooter() {
  const usuario = estado.datos?.users?.user;
  if (!usuario) return;

  setText("user-rank", `#${usuario.rank}`);
  setText("user-points-footer", usuario.points);
  setImg("user-avatar-footer", usuario.avatar, usuario.name);

  const rival        = estado.datos.users.rival;
  const tieneRival   = rival && rival.points !== undefined && rival.rank !== "-";

  if (tieneRival) {
    const diferencia = rival.points - usuario.points;
    setText("rival-text", `A ${diferencia} pts del #${rival.rank}`);
    setImg("rival-avatar-footer", rival.avatar, rival.name);

    // Barra de progreso relativa al rival
    let porcentaje = rival.points > 0 ? (usuario.points / rival.points) * 100 : 0;
    const barra = document.getElementById("rival-progress-bar");
    if (barra) barra.style.width = `${Math.min(porcentaje, 100)}%`;
  } else {
    // Sin rival: el usuario es el #1 o no está rankeado
    const esRank1 = typeof usuario.rank === "number" && usuario.rank === 1;
    setText("rival-text", esRank1 ? "¡Eres el Rey Capibara! 👑" : "Sigue subiendo de nivel");
    const barra = document.getElementById("rival-progress-bar");
    if (barra) barra.style.width = "100%";
  }
}

// ------------------------------------------------------------------
// Filtros de alcance (Global / Facultad / Carrera / Amigos)
// - "Global"   → muestra toda la lista
// - "Facultad" → filtra por la facultad del usuario actual
// - "Carrera"  → filtra por la carrera del usuario actual
// - "Amigos"   → muestra solo contactos guardados del usuario
// ------------------------------------------------------------------

function inicializarFiltrosAlcance() {
  const scopeBtns = document.querySelectorAll(".scope-btn");
  if (!scopeBtns.length) return;

  scopeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const valor = btn.getAttribute("data-value");

      // Amigos: avisar si no tiene contactos cargados
      if (valor === "amigos" && estado.contactIds.length === 0) {
        if (typeof window.showToast === "function") {
          window.showToast("No tienes contactos guardados aún. ¡Añade amigos desde la sección de Transferencias!", "info", "Sin amigos 😅");
        }
      }

      // Actualizar estilos
      scopeBtns.forEach((b) => {
        b.classList.remove("bg-brand-lime", "text-black", "shadow-[0_0_10px_rgba(215,253,73,0.3)]");
        b.classList.add("text-white/50");
      });
      btn.classList.remove("text-white/50");
      btn.classList.add("bg-brand-lime", "text-black", "shadow-[0_0_10px_rgba(215,253,73,0.3)]");

      // Aplicar filtro y volver a la página 1
      estado.alcance = valor;
      estado.paginaActual = 1;
      renderizar();
    });
  });
}

// ------------------------------------------------------------------
// Dropdown de filtro de tiempo (Esta Semana / Este Mes / Histórico)
// ------------------------------------------------------------------

function inicializarDropdownTiempo() {
  const filterBtn    = document.getElementById("time-filter-btn");
  const filterMenu   = document.getElementById("time-filter-menu");
  const filterArrow  = document.getElementById("time-filter-arrow");
  const filterLabel  = document.getElementById("time-filter-label");
  const timeOptions  = document.querySelectorAll(".time-option");

  if (!filterBtn || !filterMenu || !filterArrow) return;

  let abierto = false;

  function alternarDropdown() {
    abierto = !abierto;
    if (abierto) {
      filterMenu.classList.remove("hidden");
      filterArrow.style.transform = "rotate(180deg)";
    } else {
      filterMenu.classList.add("hidden");
      filterArrow.style.transform = "rotate(0deg)";
    }
  }

  filterBtn.addEventListener("click", alternarDropdown);

  // Cerrar al hacer clic fuera del dropdown
  document.addEventListener("click", (e) => {
    if (abierto && !filterBtn.contains(e.target) && !filterMenu.contains(e.target)) {
      abierto = false;
      filterMenu.classList.add("hidden");
      filterArrow.style.transform = "rotate(0deg)";
    }
  });

  const mapaEtiquetaPeriodo = { "Esta Semana": "semana", "Este Mes": "mes", "Histórico": "historico" };

  timeOptions.forEach((opcion) => {
    opcion.addEventListener("click", () => {
      const etiqueta = opcion.getAttribute("data-label");
      if (etiqueta && filterLabel) filterLabel.innerText = etiqueta;

      // Actualizar estado de periodo y volver a página 1
      estado.periodo = mapaEtiquetaPeriodo[etiqueta] || "semana";
      estado.paginaActual = 1;

      // Restablecer estilos de todas las opciones
      timeOptions.forEach((opt) => {
        opt.classList.remove("text-white");
        opt.classList.add("text-white/70");
        const indicador = opt.querySelector("span:last-child");
        if (indicador) {
          indicador.classList.remove("opacity-100");
          indicador.classList.add("opacity-0");
        }
      });

      // Marcar la opción activa
      opcion.classList.remove("text-white/70");
      opcion.classList.add("text-white");
      const indicadorActivo = opcion.querySelector("span:last-child");
      if (indicadorActivo) {
        indicadorActivo.classList.remove("opacity-0");
        indicadorActivo.classList.add("opacity-100");
      }

      alternarDropdown(); // Cerrar menú
      // Re-renderizar con el periodo actualizado
      // (Nota: la API actual devuelve datos globales; cuando el backend soporte
      //  filtro temporal, pasar `estado.periodo` en la llamada a cargarDatos)
      renderizar();
    });
  });
}

// ------------------------------------------------------------------
// Cuenta regresiva hasta el próximo domingo
// ------------------------------------------------------------------

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
    countdownEl.innerText = `${dias}d ${horas}h ${minutos}m`;
  }

  setInterval(actualizarContador, 60000);
  actualizarContador();
}

// ------------------------------------------------------------------
// Punto de entrada principal — llamar desde ranking.astro
// ------------------------------------------------------------------

export function initRanking() {
  const tabUsers     = document.getElementById("tab-users");
  const tabFaculties = document.getElementById("tab-faculties");

  // Conectar tabs
  tabUsers?.addEventListener("click", () => {
    estado.paginaActual = 1;
    cambiarTab("users");
  });
  tabFaculties?.addEventListener("click", () => {
    estado.paginaActual = 1;
    cambiarTab("faculties");
  });

  // Conectar botones de paginación (una sola vez)
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

  // Inicializar controles de UI
  inicializarFiltrosAlcance();
  inicializarDropdownTiempo();
  inicializarContador();

  // Cargar datos del ranking
  cargarDatos();
}
