// @ts-nocheck
import { authService, userService } from "../../services/api.js";

const nivelesConfig = [
  {
    id: "novato",
    nombre: "Novato (Cachorro)",
    puntosMin: 0,
    puntosMax: 500,
    color: "#9CA3AF",
    colorGlow: "#6B7280",
  },
  {
    id: "bachiller",
    nombre: "Bachiller",
    puntosMin: 501,
    puntosMax: 2000,
    color: "#60A5FA",
    colorGlow: "#3B82F6",
  },
  {
    id: "licenciado",
    nombre: "Licenciado",
    puntosMin: 2001,
    puntosMax: 5000,
    color: "#A78BFA",
    colorGlow: "#8B5CF6",
  },
  {
    id: "magister",
    nombre: "Magister",
    puntosMin: 5001,
    puntosMax: 10000,
    color: "#34D399",
    colorGlow: "#10B981",
  },
  {
    id: "doctor",
    nombre: "Doctor",
    puntosMin: 10001,
    puntosMax: 20000,
    color: "#F59E0B",
    colorGlow: "#D97706",
  },
  {
    id: "capy-legend",
    nombre: "Capy Legend",
    puntosMin: 20001,
    puntosMax: Number.POSITIVE_INFINITY,
    color: "#F472B6",
    colorGlow: "#EC4899",
  },
];

export function initProfilePage() {
  const dom = getDomRefs();
  setupGlobalActions(dom);
  setupModalCloseOnBackdrop(dom);
  setupEditForm(dom);
  setupToggleFeedback();
  initProfile(dom);
}

function getDomRefs() {
  return {
    nombreUsuario: document.getElementById("nombre-usuario"),
    descripcionUsuario: document.getElementById("descripcion-usuario"),
    aliasUsuario: document.getElementById("alias-usuario"),
    aliasSettings: document.getElementById("alias-settings"),
    cedulaUsuario: document.getElementById("cedula-usuario"),
    avatar: document.getElementById("profile-avatar"),
    editButton: document.getElementById("btn-edit-profile"),

    nivelText: document.getElementById("nivel-text"),
    nivelBadge: document.getElementById("nivel-badge"),
    xpActual: document.getElementById("xp-actual"),
    xpSiguiente: document.getElementById("xp-siguiente"),
    xpFaltante: document.getElementById("xp-faltante"),
    porcentaje: document.getElementById("procentaje"),
    progresoBar: document.getElementById("progreso-bar"),
    glowNivel: document.getElementById("glow-nivel"),
    perfilCard: document.getElementById("perfil-card"),
    profilePhotoBorder: document.getElementById("profile-photo-border"),

    editModal: document.getElementById("editProfileModal"),
    securityModal: document.getElementById("securityModal"),
    faqModal: document.getElementById("faqModal"),
    logoutModal: document.getElementById("logoutModal"),

    editForm: document.getElementById("editProfileForm"),
    editNombre: document.getElementById("editNombre"),
    editAlias: document.getElementById("editAlias"),
    editEmail: document.getElementById("editEmail"),
    editDescripcion: document.getElementById("editDescripcion"),
  };
}

async function initProfile(dom) {
  const localUser = authService.getCurrentUser();
  if (!localUser) {
    window.location.href = "/auth/login";
    return;
  }

  try {
    const userId = localUser.id || localUser.usuarioId || localUser._id;
    const profileResponse = await userService.getProfile(userId);
    const user = profileResponse?.usuario || profileResponse?.user || profileResponse || localUser;

    const normalized = {
      ...localUser,
      ...user,
      nombre: user?.nombre || localUser?.nombre || "Usuario",
      cedula: user?.cedula || localUser?.cedula || "Sin cédula",
      xp: Number(user?.xp ?? localUser?.xp ?? 0),
      alias:
        user?.alias ||
        localUser?.alias ||
        formatAlias(user?.nombre || localUser?.nombre || "capypay"),
      email: user?.email || localUser?.email || "",
      descripcion:
        user?.descripcion ||
        "Estudiante de Ingeniería en Sistemas",
    };

    localStorage.setItem("capypay_user", JSON.stringify(normalized));
    renderProfile(dom, normalized);
  } catch (error) {
    console.error("Error cargando perfil:", error);
    renderProfile(dom, {
      ...localUser,
      nombre: localUser?.nombre || "Usuario",
      cedula: localUser?.cedula || "Sin cédula",
      xp: Number(localUser?.xp ?? 0),
      alias: localUser?.alias || formatAlias(localUser?.nombre || "capypay"),
      email: localUser?.email || "",
      descripcion: "Estudiante de Ingeniería en Sistemas",
    });
  }
}

function renderProfile(dom, user) {
  if (dom.nombreUsuario) dom.nombreUsuario.textContent = user.nombre;
  if (dom.descripcionUsuario) dom.descripcionUsuario.textContent = user.descripcion;
  if (dom.aliasUsuario) dom.aliasUsuario.textContent = user.alias;
  if (dom.aliasSettings) dom.aliasSettings.textContent = user.alias;
  if (dom.cedulaUsuario) dom.cedulaUsuario.textContent = user.cedula;

  if (dom.avatar) {
    dom.avatar.src = `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(user.nombre)}`;
    dom.avatar.alt = `Foto de perfil de ${user.nombre}`;
  }

  updateLevelUI(dom, user.xp);
}

function updateLevelUI(dom, xpValue) {
  const xp = Number.isFinite(Number(xpValue)) ? Number(xpValue) : 0;
  const nivelActual =
    nivelesConfig.find((nivel) => xp >= nivel.puntosMin && xp <= nivel.puntosMax) ||
    nivelesConfig[0];

  const siguienteNivel = nivelesConfig.find((nivel) => nivel.puntosMin > xp);
  const xpMaxNivel = Number.isFinite(nivelActual.puntosMax)
    ? nivelActual.puntosMax
    : xp + 1000;
  const xpMinNivel = nivelActual.puntosMin;
  const rangoNivel = Math.max(xpMaxNivel - xpMinNivel, 1);
  const progresoRaw = ((xp - xpMinNivel) / rangoNivel) * 100;
  const progreso = Math.min(Math.max(progresoRaw, 0), 100);

  if (dom.nivelText) dom.nivelText.textContent = nivelActual.nombre;
  if (dom.xpActual) dom.xpActual.textContent = xp.toLocaleString("es-VE");
  if (dom.xpSiguiente) {
    dom.xpSiguiente.textContent = siguienteNivel
      ? siguienteNivel.puntosMin.toLocaleString("es-VE")
      : "MAX";
  }

  const faltante = siguienteNivel ? Math.max(siguienteNivel.puntosMin - xp, 0) : 0;
  if (dom.xpFaltante) {
    dom.xpFaltante.textContent = siguienteNivel
      ? `${faltante.toLocaleString("es-VE")} XP para el siguiente nivel`
      : "Nivel máximo alcanzado";
  }

  if (dom.porcentaje) {
    dom.porcentaje.textContent = `${Math.round(progreso)}% completado`;
  }

  if (dom.progresoBar) {
    dom.progresoBar.style.width = `${progreso}%`;
    dom.progresoBar.style.background = `linear-gradient(90deg, ${nivelActual.color}, ${nivelActual.colorGlow})`;
  }

  if (dom.nivelBadge) {
    dom.nivelBadge.style.border = `2px solid ${nivelActual.color}`;
    dom.nivelBadge.style.color = nivelActual.color;
    dom.nivelBadge.style.background = `${hexToRgba(nivelActual.color, 0.1)}`;
    dom.nivelBadge.style.boxShadow = `0 0 15px ${hexToRgba(nivelActual.color, 0.3)}`;
  }

  if (dom.glowNivel) {
    dom.glowNivel.style.background = hexToRgba(nivelActual.color, 0.2);
  }

  if (dom.perfilCard) {
    dom.perfilCard.style.borderColor = `${hexToRgba(nivelActual.color, 0.4)}`;
  }

  if (dom.profilePhotoBorder) {
    dom.profilePhotoBorder.style.background = `linear-gradient(to bottom right, ${nivelActual.color}, ${nivelActual.colorGlow})`;
    dom.profilePhotoBorder.style.boxShadow = `0 0 30px ${hexToRgba(nivelActual.color, 0.3)}`;
  }
}

function setupEditForm(dom) {
  dom.editButton?.addEventListener("click", () => {
    openEditModal(dom);
  });

  dom.editForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const localUser = authService.getCurrentUser() || {};
    const updatedUser = {
      ...localUser,
      nombre: dom.editNombre?.value?.trim() || localUser.nombre || "Usuario",
      alias:
        normalizeAlias(dom.editAlias?.value?.trim()) ||
        localUser.alias ||
        formatAlias(localUser.nombre || "capypay"),
      email: dom.editEmail?.value?.trim() || localUser.email || "",
      descripcion:
        dom.editDescripcion?.value?.trim() ||
        "Estudiante de Ingeniería en Sistemas",
    };

    localStorage.setItem("capypay_user", JSON.stringify(updatedUser));
    renderProfile(dom, updatedUser);
    closeModal(dom.editModal);
  });
}

function openEditModal(dom) {
  const localUser = authService.getCurrentUser() || {};

  if (dom.editNombre) dom.editNombre.value = localUser.nombre || "";
  if (dom.editAlias) dom.editAlias.value = localUser.alias || "";
  if (dom.editEmail) dom.editEmail.value = localUser.email || "";
  if (dom.editDescripcion) {
    dom.editDescripcion.value =
      localUser.descripcion || "Estudiante de Ingeniería en Sistemas";
  }

  openModal(dom.editModal);
}

function setupGlobalActions(dom) {
  window.showEditModal = () => openEditModal(dom);
  window.closeEditModal = () => closeModal(dom.editModal);

  window.showSecurityModal = () => openModal(dom.securityModal);
  window.closeSecurityModal = () => closeModal(dom.securityModal);

  window.showFAQModal = () => openModal(dom.faqModal);
  window.closeFAQModal = () => closeModal(dom.faqModal);

  window.showLogoutModal = () => openModal(dom.logoutModal);
  window.closeLogoutModal = () => closeModal(dom.logoutModal);

  window.confirmLogout = () => {
    localStorage.removeItem("capypay_token");
    localStorage.removeItem("capypay_user");
    window.location.href = "/auth/login";
  };

  window.confirmarEliminacionCuenta = () => {
    const confirmed = window.confirm(
      "¿Estás seguro? Esta acción es irreversible y perderás tus BARAS y XP",
    );

    if (confirmed) {
      localStorage.removeItem("capypay_token");
      localStorage.removeItem("capypay_user");
      window.location.href = "/auth/login";
    }
  };

  window.cambiarPin = () => {
    alert("Función de cambiar PIN próximamente disponible");
  };

  window.activarBiometria = () => {
    const toggle = document.getElementById("biometria-toggle");
    const enabled = Boolean(toggle?.checked);
    alert(`Autenticación biométrica ${enabled ? "activada" : "desactivada"}`);
  };

  window.verificarDispositivos = () => {
    alert("Listado de dispositivos próximamente disponible");
  };
}

function setupModalCloseOnBackdrop(dom) {
  [dom.editModal, dom.securityModal, dom.faqModal, dom.logoutModal].forEach(
    (modal) => {
      modal?.addEventListener("click", (event) => {
        if (event.target === modal) {
          closeModal(modal);
        }
      });
    },
  );
}

function setupToggleFeedback() {
  const toggles = document.querySelectorAll('input[type="checkbox"]');
  toggles.forEach((toggle) => {
    toggle.addEventListener("change", (event) => {
      const isEnabled = Boolean(event.target.checked);
      console.log(`Toggle actualizado: ${isEnabled ? "activado" : "desactivado"}`);
    });
  });
}

function openModal(modal) {
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove("flex");
  modal.classList.add("hidden");
}

function formatAlias(name) {
  return `@${String(name)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9._-]/g, "")}`;
}

function normalizeAlias(alias) {
  if (!alias) return "";
  return alias.startsWith("@") ? alias : `@${alias}`;
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace("#", "");
  const bigint = Number.parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
