// @ts-nocheck
import { authService, userService, gamificationService } from "../../services/api.js";
import { calculateLevel } from "../../config/levelsConfig.js";

const BADGES_STORAGE_PREFIX = "capypay_badges_unlocked";
const MAX_AVATAR_FILE_SIZE = 2 * 1024 * 1024;

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
    badgesList: document.getElementById("badges-list"),
    badgesUnlockedCount: document.getElementById("badges-unlocked-count"),
    badgesHint: document.getElementById("badges-hint"),
    badgesRecentList: document.getElementById("badges-recent-list"),

    editModal: document.getElementById("editProfileModal"),
    securityModal: document.getElementById("securityModal"),
    faqModal: document.getElementById("faqModal"),
    logoutModal: document.getElementById("logoutModal"),

    editForm: document.getElementById("editProfileForm"),
    editNombre: document.getElementById("editNombre"),
    editAlias: document.getElementById("editAlias"),
    editEmail: document.getElementById("editEmail"),
    editDescripcion: document.getElementById("editDescripcion"),
    editAvatar: document.getElementById("editAvatar"),
    editAvatarRemove: document.getElementById("editAvatarRemove"),
    editAvatarCurrent: document.getElementById("editAvatarCurrent"),
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
      avatar_url: user?.avatar_url || localUser?.avatar_url || "",
    };

    localStorage.setItem("capypay_user", JSON.stringify(normalized));
    renderProfile(dom, normalized);
    await loadAndRenderBadges(dom, normalized, userId);
  } catch (error) {
    console.error("Error cargando perfil:", error);
    const fallbackUser = {
      ...localUser,
      nombre: localUser?.nombre || "Usuario",
      cedula: localUser?.cedula || "Sin cédula",
      xp: Number(localUser?.xp ?? 0),
      alias: localUser?.alias || formatAlias(localUser?.nombre || "capypay"),
      email: localUser?.email || "",
      descripcion: "Estudiante de Ingeniería en Sistemas",
      avatar_url: localUser?.avatar_url || "",
    };

    renderProfile(dom, fallbackUser);
    await loadAndRenderBadges(dom, fallbackUser, localUser?.id || localUser?.usuarioId || localUser?._id);
  }
}

function normalizeMissionCode(rawCode) {
  const value = String(rawCode || "").trim();
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^WK_*/, "")
    .replace(/^_+|_+$/g, "");
}

function getCurrentStreakDays(streakPayload) {
  const candidates = [
    streakPayload?.streak?.currentDaily,
    streakPayload?.data?.streak?.currentDaily,
    streakPayload?.summary?.streak?.currentDaily,
    streakPayload?.currentDaily,
  ];

  for (const value of candidates) {
    const num = Number(value);
    if (Number.isFinite(num) && num >= 0) return num;
  }

  return 0;
}

function getCompletedMissionCodes(weeklyMissionsPayload) {
  const candidates = [
    weeklyMissionsPayload?.missions,
    weeklyMissionsPayload?.data?.missions,
    weeklyMissionsPayload?.weekly?.missions,
    weeklyMissionsPayload?.result?.missions,
  ];

  const missions = candidates.find((row) => Array.isArray(row)) || [];
  const completedCodes = new Set();

  missions.forEach((mission) => {
    const code = normalizeMissionCode(mission?.code || mission?.missions?.code);
    if (!code) return;

    const progress = Number(mission?.progress || 0);
    const target = Number(mission?.target || mission?.missions?.target_count || 1);
    const status = String(mission?.status || "").toLowerCase();

    const completed =
      Boolean(mission?.completed) ||
      Boolean(mission?.claimed) ||
      status === "completed" ||
      (Number.isFinite(target) && target > 0 && progress >= target);

    if (completed) {
      completedCodes.add(code);
    }
  });

  return completedCodes;
}

function getBadgeIconHTML(templateId) {
  const template = document.getElementById(templateId);
  return template?.innerHTML || "";
}

function getBadgeStorageKey(userId) {
  return `${BADGES_STORAGE_PREFIX}:${String(userId || "guest")}`;
}

function loadBadgeUnlockHistory(userId) {
  if (!userId) return {};
  try {
    const raw = localStorage.getItem(getBadgeStorageKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_error) {
    return {};
  }
}

function normalizeHistoryShape(raw) {
  const out = {};
  if (!raw || typeof raw !== "object") return out;

  Object.entries(raw).forEach(([key, value]) => {
    const safeKey = String(key || "").trim();
    if (!safeKey) return;
    const date = new Date(String(value || ""));
    out[safeKey] = Number.isNaN(date.getTime())
      ? new Date().toISOString()
      : date.toISOString();
  });

  return out;
}

function mergeBadgeHistories(primary = {}, secondary = {}) {
  const a = normalizeHistoryShape(primary);
  const b = normalizeHistoryShape(secondary);
  const merged = { ...a };

  Object.entries(b).forEach(([badgeId, dateValue]) => {
    if (!merged[badgeId]) {
      merged[badgeId] = dateValue;
      return;
    }

    const prev = new Date(merged[badgeId]).getTime();
    const next = new Date(dateValue).getTime();
    if (Number.isFinite(next) && (!Number.isFinite(prev) || next < prev)) {
      merged[badgeId] = dateValue;
    }
  });

  return merged;
}

function saveBadgeUnlockHistory(userId, history) {
  if (!userId) return;
  try {
    localStorage.setItem(getBadgeStorageKey(userId), JSON.stringify(history));
  } catch (_error) {
    // Ignorar errores de storage.
  }
}

function formatBadgeDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function buildBadgesState({ completedCodes, streakDays, isVerified, currentLevel }) {
  const defs = [
    {
      id: "mission-comedor-7d",
      name: "Comedor 7 dias",
      shortName: "Comedor 7d",
      belongsTo: "Mision",
      description: "Completa la mision semanal de comedor por 7 dias.",
      iconTemplateId: "badge-icon-template-utensils",
      accent: "#8B5CF6",
      unlocked: completedCodes.has("WEEKLY_COMEDOR_7D"),
    },
    {
      id: "streak-7d",
      name: "Racha 7 dias",
      shortName: "Racha 7d",
      belongsTo: "Racha",
      description: "Mantiene una racha academica de 7 dias.",
      iconTemplateId: "badge-icon-template-flame",
      accent: "#22C55E",
      unlocked: streakDays >= 7,
    },
    {
      id: "streak-21d",
      name: "Racha 21 dias",
      shortName: "Racha 21d",
      belongsTo: "Racha",
      description: "Mantiene una racha academica de 21 dias.",
      iconTemplateId: "badge-icon-template-flame",
      accent: "#16A34A",
      unlocked: streakDays >= 21,
    },
    {
      id: "streak-90d",
      name: "Racha 3 meses",
      shortName: "Racha 3m",
      belongsTo: "Racha",
      description: "Mantiene una racha academica de 90 dias.",
      iconTemplateId: "badge-icon-template-calendar",
      accent: "#0EA5E9",
      unlocked: streakDays >= 90,
    },
    {
      id: "streak-365d",
      name: "Racha 12 meses",
      shortName: "Racha 12m",
      belongsTo: "Racha",
      description: "Mantiene una racha academica de 365 dias.",
      iconTemplateId: "badge-icon-template-calendar",
      accent: "#0284C7",
      unlocked: streakDays >= 365,
    },
    {
      id: "verified-account",
      name: "Cuenta verificada",
      shortName: "Verificada",
      belongsTo: "Cuenta",
      description: "Verifico su cuenta y desbloqueo seguridad adicional.",
      iconTemplateId: "badge-icon-template-shield",
      accent: "#059669",
      unlocked: isVerified,
    },
  ];

  const levelBadges = [
    { id: 1, name: "Insignia Novato", iconTemplateId: "badge-icon-template-level-1", accent: "#64748B" },
    { id: 2, name: "Insignia Bachiller", iconTemplateId: "badge-icon-template-level-2", accent: "#0284C7" },
    { id: 3, name: "Insignia Licenciado", iconTemplateId: "badge-icon-template-level-3", accent: "#7E22CE" },
    { id: 4, name: "Insignia Magister", iconTemplateId: "badge-icon-template-level-4", accent: "#15803D" },
    { id: 5, name: "Insignia Doctor", iconTemplateId: "badge-icon-template-level-5", accent: "#B45309" },
    { id: 6, name: "Insignia Capy Legend", iconTemplateId: "badge-icon-template-level-6", accent: "#BE123C" },
  ].map((levelBadge) => ({
    id: `level-${levelBadge.id}`,
    name: levelBadge.name,
    shortName: `Nivel ${levelBadge.id}`,
    belongsTo: "Nivel",
    description: `Alcanza el nivel ${levelBadge.id}.`,
    iconTemplateId: levelBadge.iconTemplateId,
    accent: levelBadge.accent,
    unlocked: currentLevel >= levelBadge.id,
  }));

  return [...defs, ...levelBadges];
}

function renderBadges(dom, badges) {
  if (!dom.badgesList) return;

  if (!Array.isArray(badges) || badges.length === 0) {
    dom.badgesList.innerHTML = '<p class="text-[11px] font-bold uppercase text-slate-700">No hay insignias disponibles.</p>';
    if (dom.badgesUnlockedCount) dom.badgesUnlockedCount.textContent = "0/0";
    return;
  }

  const unlockedCount = badges.filter((badge) => badge.unlocked).length;
  const orderedBadges = badges
    .map((badge, index) => ({ ...badge, _orderIndex: index }))
    .sort((a, b) => {
      if (a.unlocked !== b.unlocked) {
        return a.unlocked ? -1 : 1;
      }

      if (a.unlocked && b.unlocked) {
        const timeA = new Date(a.obtainedAt || 0).getTime();
        const timeB = new Date(b.obtainedAt || 0).getTime();
        if (timeA !== timeB) return timeB - timeA;
      }

      return a._orderIndex - b._orderIndex;
    });
  if (dom.badgesUnlockedCount) {
    dom.badgesUnlockedCount.textContent = `${unlockedCount}/${badges.length}`;
  }

  if (dom.badgesHint) {
    dom.badgesHint.textContent = unlockedCount === badges.length
      ? "Coleccion completa de insignias desbloqueada."
      : "Completa misiones, rachas y niveles para desbloquear todas las insignias.";
  }

  dom.badgesList.innerHTML = orderedBadges
    .map((badge) => {
      const icon = getBadgeIconHTML(badge.iconTemplateId);
      const unlockedTone = badge.unlocked
        ? `background:${hexToRgba(badge.accent, 0.16)}; color:${badge.accent}; border-color:${badge.accent};`
        : "background:#f8fafc; color:#334155; border-color:#94a3b8; opacity:0.9;";

      return `
        <div
          class="badge-item group relative flex flex-col items-center text-center gap-1.5 xl:gap-2 shrink-0 cursor-pointer transition-all active:scale-95 w-24 xl:w-28 2xl:w-32"
          data-name="${badge.name}"
          title="${badge.description || badge.name}"
        >
          <div class="w-12 h-12 xl:w-14 xl:h-14 2xl:w-16 2xl:h-16 border-2 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110" style="${unlockedTone}">
            <span class="block w-6 h-6 xl:w-7 xl:h-7 2xl:w-8 2xl:h-8">${icon}</span>
          </div>
          <span class="text-[8px] xl:text-[9px] font-black uppercase border border-black bg-white px-1.5 py-0.5 leading-none">${badge.belongsTo || "Insignia"}</span>
          <span class="text-[9px] xl:text-[10px] font-black uppercase text-black leading-tight line-clamp-2">${badge.shortName || badge.name}</span>
          <span class="text-[9px] xl:text-[10px] font-black uppercase ${badge.unlocked ? "text-black" : "text-slate-500"}">${badge.unlocked ? "Activa" : "Bloq"}</span>
          ${badge.unlocked && badge.obtainedAt ? `<span class="w-8 xl:w-10 border-t border-black/20"></span><span class="text-[8px] xl:text-[9px] font-bold uppercase text-slate-500">${formatBadgeDate(badge.obtainedAt)}</span>` : ""}
        </div>`;
    })
    .join("");
}

function renderRecentBadges(dom, badges) {
  if (!dom.badgesRecentList) return;

  const recent = (Array.isArray(badges) ? badges : [])
    .filter((badge) => badge.unlocked && badge.obtainedAt)
    .sort((a, b) => new Date(b.obtainedAt).getTime() - new Date(a.obtainedAt).getTime())
    .slice(0, 4);

  if (recent.length === 0) {
    dom.badgesRecentList.innerHTML = '<p class="text-[10px] font-bold uppercase text-slate-500">Aun no hay insignias recientes.</p>';
    return;
  }

  dom.badgesRecentList.innerHTML = recent
    .map((badge) => `
      <div class="flex items-center justify-between gap-2 border border-black px-2 py-1 bg-[#fffdf6]">
        <span class="text-[10px] font-black uppercase text-black truncate">${badge.name}</span>
        <span class="text-[9px] font-bold uppercase text-slate-600 shrink-0">${formatBadgeDate(badge.obtainedAt)}</span>
      </div>
    `)
    .join("");
}

async function loadAndRenderBadges(dom, user, userId) {
  const xp = Number(user?.xp ?? 0);
  const levelData = calculateLevel(xp);
  const currentLevel = Number(levelData?.id || 1);

  let completedCodes = new Set();
  let streakDays = Number(user?.streakStatus?.currentDaily || 0);

  if (userId) {
    try {
      const [weeklyMissionsRes, streakRes] = await Promise.all([
        gamificationService.getWeeklyMissions(userId),
        gamificationService.getStreak(userId),
      ]);

      completedCodes = getCompletedMissionCodes(weeklyMissionsRes);
      streakDays = Math.max(streakDays, getCurrentStreakDays(streakRes));
    } catch (_error) {
      // Si falla la API, mantenemos render con datos locales.
    }
  }

  const isVerified =
    Boolean(
      user?.verified ||
      user?.is_verified ||
      user?.account_verified ||
      user?.kyc_verified ||
      user?.verification_status === "verified",
    ) || completedCodes.has("GENERAL_VERIFY_ACCOUNT");

  const badges = buildBadgesState({
    completedCodes,
    streakDays,
    isVerified,
    currentLevel,
  });

  let unlockHistory = loadBadgeUnlockHistory(userId);
  let shouldSyncServer = false;

  if (userId) {
    try {
      const syncRes = await gamificationService.getBadgesSync(userId);
      const serverHistory = normalizeHistoryShape(syncRes?.badges || {});
      const merged = mergeBadgeHistories(serverHistory, unlockHistory);
      const mergedServerFirst = JSON.stringify(merged) !== JSON.stringify(serverHistory);
      unlockHistory = merged;
      saveBadgeUnlockHistory(userId, unlockHistory);
      if (mergedServerFirst) {
        shouldSyncServer = true;
      }
    } catch (_error) {
      // Si falla sincronización remota, se mantiene local.
    }
  }

  let historyUpdated = false;

  const badgesWithHistory = badges.map((badge) => {
    if (!badge.unlocked) {
      return { ...badge, obtainedAt: unlockHistory[badge.id] || null };
    }

    const obtainedAt = unlockHistory[badge.id] || new Date().toISOString();
    if (!unlockHistory[badge.id]) {
      unlockHistory[badge.id] = obtainedAt;
      historyUpdated = true;
    }

    return { ...badge, obtainedAt };
  });

  if (historyUpdated) {
    saveBadgeUnlockHistory(userId, unlockHistory);
    shouldSyncServer = true;
  }

  if (shouldSyncServer && userId) {
    try {
      await gamificationService.saveBadgesSync({
        userId,
        badges: unlockHistory
      });
    } catch (_error) {
      // Si falla remoto, persistimos local y reintentará en próxima carga.
    }
  }

  renderBadges(dom, badgesWithHistory);
  renderRecentBadges(dom, badgesWithHistory);
}

function renderProfile(dom, user) {
  if (dom.nombreUsuario) dom.nombreUsuario.textContent = user.nombre;
  if (dom.descripcionUsuario) dom.descripcionUsuario.textContent = user.descripcion;
  if (dom.aliasUsuario) dom.aliasUsuario.textContent = user.alias;
  if (dom.aliasSettings) dom.aliasSettings.textContent = user.alias;
  if (dom.cedulaUsuario) dom.cedulaUsuario.textContent = user.cedula;

  if (dom.avatar) {
    if (dom.avatar.tagName === "IMG") {
      dom.avatar.src = user.avatar_url || `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(user.nombre)}`;
      dom.avatar.alt = `Foto de perfil de ${user.nombre}`;
    } else {
      dom.avatar.setAttribute("aria-label", `Icono de perfil de ${user.nombre}`);
      dom.avatar.innerHTML = "";

      const avatarUrl = String(user?.avatar_url || "").trim();
      const hasCustomAvatar = /^data:image\//.test(avatarUrl) || /^https?:\/\//i.test(avatarUrl);
      if (hasCustomAvatar) {
        const img = document.createElement("img");
        img.src = avatarUrl;
        img.alt = `Foto de perfil de ${user.nombre}`;
        img.className = "w-full h-full object-cover";
        dom.avatar.appendChild(img);
      } else {
        dom.avatar.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 xl:w-14 xl:h-14 2xl:w-16 2xl:h-16 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21a8 8 0 0 0-16 0"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        `;
      }
    }
  }

  updateLevelUI(dom, user.xp);
}

function updateLevelUI(dom, xpValue) {
  const xp = Number.isFinite(Number(xpValue)) ? Number(xpValue) : 0;
  const levelData = calculateLevel(xp);

  if (!levelData) {
    // XP insuficiente, usar nivel mínimo
    const minLevel = { nombre: "Novato (Cachorro)", color: "#9CA3AF", colorGlow: "#6B7280", progress: 0 };
    if (dom.nivelText) dom.nivelText.textContent = minLevel.nombre;
    if (dom.xpActual) dom.xpActual.textContent = xp.toLocaleString("es-VE");
    if (dom.xpSiguiente) dom.xpSiguiente.textContent = "500";
    if (dom.xpFaltante) dom.xpFaltante.textContent = `${(500 - xp).toLocaleString("es-VE")} XP para el siguiente nivel`;
    if (dom.porcentaje) dom.porcentaje.textContent = "0% completado";
    if (dom.progresoBar) {
      dom.progresoBar.style.width = "0%";
      dom.progresoBar.style.background = `linear-gradient(90deg, ${minLevel.color}, ${minLevel.colorGlow})`;
    }
    // Aplicar estilos con minLevel
    applyLevelStyles(dom, minLevel);
    return;
  }

  const { nombre, progress, nextXp, isMaxLevel, color, colorGlow } = levelData;

  if (dom.nivelText) dom.nivelText.textContent = nombre;
  if (dom.xpActual) dom.xpActual.textContent = xp.toLocaleString("es-VE");
  if (dom.xpSiguiente) {
    dom.xpSiguiente.textContent = isMaxLevel ? "MAX" : (xp + nextXp).toLocaleString("es-VE");
  }

  if (dom.xpFaltante) {
    dom.xpFaltante.textContent = isMaxLevel
      ? "Nivel máximo alcanzado"
      : `${nextXp.toLocaleString("es-VE")} XP para el siguiente nivel`;
  }

  if (dom.porcentaje) {
    dom.porcentaje.textContent = `${progress}% completado`;
  }

  if (dom.progresoBar) {
    dom.progresoBar.style.width = `${progress}%`;
    dom.progresoBar.style.background = `linear-gradient(90deg, ${color}, ${colorGlow})`;
  }

  applyLevelStyles(dom, levelData);
}

function applyLevelStyles(dom, levelData) {
  const { color, colorGlow } = levelData;

  if (dom.nivelBadge) {
    dom.nivelBadge.style.border = `2px solid ${color}`;
    dom.nivelBadge.style.color = color;
    dom.nivelBadge.style.background = `${hexToRgba(color, 0.1)}`;
    dom.nivelBadge.style.boxShadow = `0 0 15px ${hexToRgba(color, 0.3)}`;
  }

  if (dom.glowNivel) {
    dom.glowNivel.style.background = hexToRgba(color, 0.2);
  }

  if (dom.perfilCard) {
    dom.perfilCard.style.borderColor = `${hexToRgba(color, 0.4)}`;
  }

  if (dom.profilePhotoBorder) {
    dom.profilePhotoBorder.style.background = `linear-gradient(to bottom right, ${color}, ${colorGlow})`;
    dom.profilePhotoBorder.style.boxShadow = `0 0 30px ${hexToRgba(color, 0.3)}`;
  }
}

function setupEditForm(dom) {
  dom.editButton?.addEventListener("click", () => {
    openEditModal(dom);
  });

  dom.editForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const localUser = authService.getCurrentUser() || {};
    let avatarUrl = localUser.avatar_url || "";

    if (dom.editAvatarRemove?.checked) {
      avatarUrl = "";
    } else {
      const avatarFile = dom.editAvatar?.files?.[0];
      if (avatarFile) {
        if (!avatarFile.type.startsWith("image/")) {
          alert("Selecciona un archivo de imagen valido (PNG, JPG, WEBP).");
          return;
        }

        if (avatarFile.size > MAX_AVATAR_FILE_SIZE) {
          alert("La imagen debe pesar maximo 2 MB.");
          return;
        }

        avatarUrl = await fileToDataUrl(avatarFile);
      }
    }

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
      avatar_url: avatarUrl,
    };

    const userId = localUser.id || localUser.usuarioId || localUser._id;
    if (userId) {
      try {
        const remoteAvatar = await userService.updateAvatar(userId, avatarUrl);
        updatedUser.avatar_url = remoteAvatar?.avatar_url || "";
      } catch (_error) {
        // Si falla el sync remoto, dejamos persistencia local.
      }
    }

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
  if (dom.editAvatar) dom.editAvatar.value = "";
  if (dom.editAvatarRemove) dom.editAvatarRemove.checked = false;
  if (dom.editAvatarCurrent) {
    dom.editAvatarCurrent.textContent = localUser.avatar_url
      ? "Foto personalizada activa"
      : "Usando avatar predeterminado";
  }

  openModal(dom.editModal);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen seleccionada."));
    reader.readAsDataURL(file);
  });
}

function setupGlobalActions(dom) {
  window.showEditModal = () => openEditModal(dom);
  window.closeEditModal = () => closeModal(dom.editModal);

  window.showSecurityModal = () => openModal(dom.securityModal);
  window.closeSecurityModal = () => closeModal(dom.securityModal);

  window.showFAQModal = () => openModal(dom.faqModal);
  window.closeFAQModal = () => closeModal(dom.faqModal);

  window.showLogoutModal = () => {
    if (typeof window.openLogoutModal === "function") {
      window.openLogoutModal();
    } else {
      openModal(dom.logoutModal);
    }
  };
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
      if (new URLSearchParams(window.location.search).get("debug") === "1") {
        console.log(`Toggle actualizado: ${isEnabled ? "activado" : "desactivado"}`);
      }
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
