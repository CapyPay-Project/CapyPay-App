    // @ts-nocheck
    import {
      authService,
      userService,
      notificationService,
      gamificationService,
    } from "../../services/api.js";
    import { setupPageWebVitals } from "../../utils/webVitals.js";
    import {
      userProfile,
      fetchUserProfile,
      fetchGamificationSnapshot,
    } from "../../store/userStore.js";

    setupPageWebVitals("dashboard");
    const debugMode =
      new URLSearchParams(window.location.search).get("debug") === "1";

    function debugWarn(...args) {
      if (!debugMode) return;
      console.warn(...args);
    }

    function debugError(...args) {
      if (!debugMode) return;
      console.error(...args);
    }

    let cachedMovements = [];
    let currentFilter = "all";

    function renderHistoryList() {
      const container = document.getElementById("history-list-container");
      if (!container) return;

      let filteredMoves = cachedMovements;
      if (currentFilter === "expenses") {
        filteredMoves = cachedMovements.filter((m) => m.es_negativo);
      } else if (currentFilter === "income") {
        filteredMoves = cachedMovements.filter((m) => !m.es_negativo);
      }

      const moves = filteredMoves.slice(0, 7);

      if (moves.length === 0) {
        container.innerHTML =
          '<p class="text-center font-bold text-gray-500 text-sm mt-10 uppercase">NO HAY MOVIMIENTOS</p>';
        return;
      }

      let html = '<div class="space-y-4">';

      moves.forEach((mov) => {
        const isNegative = mov.es_negativo;
        const amount = mov.monto;
        const displayAmount = isNegative ? `-$${amount}` : `+$${amount}`;
        const amountColor = isNegative ? "text-red-500" : "text-[#10b981]";

        const descString = (
          mov.descripcion ||
          mov.concept ||
          mov.tipo ||
          ""
        ).toLowerCase();
        let iconBg = "bg-white";
        let iconSvg =
          '<span class="material-symbols-outlined font-black">receipt_long</span>';

        if (
          descString.includes("comedor") ||
          descString.includes("canteen") ||
          descString.includes("bite")
        ) {
          iconBg = "bg-[#8b5cf6]";
          iconSvg =
            '<span class="material-symbols-outlined font-black text-white">lunch_dining</span>';
        } else if (
          descString.includes("scholarship") ||
          (!isNegative && descString.includes("deposit"))
        ) {
          iconBg = "bg-[#d7fd48]";
          iconSvg =
            '<span class="material-symbols-outlined font-black text-black">payments</span>';
        } else if (
          descString.includes("ticket") ||
          descString.includes("bus")
        ) {
          iconBg = "bg-[#8b5cf6]";
          iconSvg =
            '<span class="material-symbols-outlined font-black text-white">directions_bus</span>';
        } else if (
          descString.includes("press") ||
          descString.includes("book")
        ) {
          iconBg = "bg-black";
          iconSvg =
            '<span class="material-symbols-outlined font-black text-white">book</span>';
        }

        const dateObj = new Date(mov.fecha);
        const dateFull = dateObj.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const timeFull = dateObj.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });

        html += `
          <div class="flex items-center justify-between p-3 border-4 border-black group hover:-translate-y-1 transition-transform box-shadow-brutal cursor-pointer bg-white">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-12 h-12 border-2 border-black ${iconBg} flex items-center justify-center shrink-0">
                  ${iconSvg}
              </div>
              <div class="flex flex-col min-w-0">
                <h4 class="text-xs font-black text-black uppercase truncate leading-none mb-1">${mov.descripcion || mov.concept || mov.tipo}</h4>
                <p class="text-[9px] font-bold text-gray-500 uppercase tracking-widest">${dateFull}, ${timeFull}</p>
              </div>
            </div>
            <div class="font-black text-sm ${amountColor} whitespace-nowrap pl-2">
              ${displayAmount}
            </div>
          </div>`;
      });

      container.innerHTML = html + "</div>";
    }

    function renderNotificationBar(notifications) {
      const badge = document.getElementById("mobile-notif-badge");
      const notifMenuList = document.getElementById("notif-menu-list");
      const unread = notifications.filter(
        (n) => !n.leida && !n.read && !n.is_read,
      ).length;

      if (badge) {
        if (unread > 0) {
          badge.innerText = unread > 9 ? "+9" : String(unread);
          badge.style.display = "flex";
        } else {
          badge.style.display = "none";
        }
      }

      if (!notifMenuList) return;

      if (notifications.length === 0) {
        notifMenuList.innerHTML =
          '<p class="text-xs text-center font-bold uppercase py-2">Sin notificaciones</p>';
        return;
      }

      notifMenuList.innerHTML = notifications
        .slice(0, 5)
        .map((n) => {
          const isUnread = !n.leida && !n.read && !n.is_read;
          const dateStr = new Date(
            n.created_at || n.fecha || Date.now(),
          ).toLocaleDateString("es-VE");
          const typeTag =
            n.type === "level_up"
              ? '<span class="inline-block text-[8px] px-1 py-0.5 border border-black bg-[#8b5cf6] text-white font-black uppercase">LEVEL UP</span>'
              : n.type === "payment_received"
                ? '<span class="inline-block text-[8px] px-1 py-0.5 border border-black bg-[#d7fd48] text-black font-black uppercase">PAGO</span>'
                : n.type === "mission_complete"
                  ? '<span class="inline-block text-[8px] px-1 py-0.5 border border-black bg-[#16a34a] text-white font-black uppercase">MISION</span>'
                  : n.type === "reward_ready"
                    ? '<span class="inline-block text-[8px] px-1 py-0.5 border border-black bg-black text-[#d7fd48] font-black uppercase">REWARD</span>'
                    : n.type === "streak_warning"
                      ? '<span class="inline-block text-[8px] px-1 py-0.5 border border-black bg-[#f59e0b] text-black font-black uppercase">RACHA</span>'
                      : "";
          return `
            <div class="border-2 border-black p-2 hover:bg-gray-100 transition-colors cursor-pointer ${isUnread ? "bg-[#d7fd48]/20" : "bg-white"}"
                 onclick="window.handleNotificationClick('${n.id || n._id}', ${isUnread})">
              <div class="flex items-start justify-between gap-2">
                <p class="text-[10px] font-black uppercase line-clamp-2 leading-tight">${n.message || "Nueva notificación"}</p>
                ${typeTag}
              </div>
              <p class="text-[9px] text-gray-600 mt-1 uppercase">${dateStr}</p>
            </div>`;
        })
        .join("");
    }

    // Manejador para click en notificación del dropdown
    window.handleNotificationClick = async (notifId, isUnread) => {
      if (isUnread) {
        try {
          await notificationService.markAsRead(notifId);
          // Actualizar estado local y refrescar
          await refreshNotifications();
        } catch (e) {
          debugError("Error marcando notificación como leída:", e);
        }
      }
    };

    async function refreshNotifications() {
      try {
        const notifsRes = await notificationService.getNotifications();
        let notifs = [];
        if (Array.isArray(notifsRes)) notifs = notifsRes;
        else if (notifsRes && Array.isArray(notifsRes.notifications))
          notifs = notifsRes.notifications;
        else if (notifsRes && Array.isArray(notifsRes.data))
          notifs = notifsRes.data;
        renderNotificationBar(notifs);
      } catch (err) {
        debugError("Error actualizando notificaciones:", err);
      }
    }

    let notificationsPollingId = null;

    // end added notification helpers

    async function initDashboard() {
      const btnExpenses = document.getElementById("btn-hist-expenses");
      const btnIncome = document.getElementById("btn-hist-income");
      if (btnExpenses && btnIncome) {
        btnExpenses.onclick = () => {
          if (currentFilter === "expenses") {
            currentFilter = "all";
            btnExpenses.classList.replace("bg-black", "bg-white");
            btnExpenses.classList.replace("text-white", "text-black");
          } else {
            currentFilter = "expenses";
            btnExpenses.classList.replace("bg-white", "bg-black");
            btnExpenses.classList.replace("text-black", "text-white");
            btnIncome.classList.replace("bg-black", "bg-white");
            btnIncome.classList.replace("text-white", "text-black");
          }
          renderHistoryList();
        };
        btnIncome.onclick = () => {
          if (currentFilter === "income") {
            currentFilter = "all";
            btnIncome.classList.replace("bg-black", "bg-white");
            btnIncome.classList.replace("text-white", "text-black");
          } else {
            currentFilter = "income";
            btnIncome.classList.replace("bg-white", "bg-black");
            btnIncome.classList.replace("text-black", "text-white");
            btnExpenses.classList.replace("bg-black", "bg-white");
            btnExpenses.classList.replace("text-white", "text-black");
          }
          renderHistoryList();
        };
      }
      const user = authService.getCurrentUser();
      if (!user) {
        return;
      }

      // User name updater
      const updateName = (name) => {
        let u = name || "USUARIO";
        const desktopName = document.getElementById("desktop-username");
        if (desktopName) desktopName.innerText = u.split(" ")[0].toUpperCase();
      };

      if (user.nombre || user.name) {
        updateName(user.nombre || user.name);
      }

      // Logout Mobile
      const mobileLogout = document.getElementById("mobile-logout-btn");
      const logoutModal = document.getElementById("logout-modal");
      const confirmLogoutBtn = document.getElementById("confirm-logout");
      const cancelLogoutBtn = document.getElementById("cancel-logout");

      window.showLogoutModal = () => {
        if (typeof window.openLogoutModal === "function") {
          window.openLogoutModal();
          return;
        }
        logoutModal.classList.remove("hidden");
        logoutModal.classList.add("flex");
        requestAnimationFrame(() => {
          logoutModal.classList.remove("opacity-0");
          logoutModal.querySelector("div").classList.remove("scale-95");
          logoutModal.querySelector("div").classList.add("scale-100");
        });
      };

      window.closeLogoutModal = () => {
        if (!logoutModal) return;
        logoutModal.classList.add("opacity-0");
        logoutModal.querySelector("div").classList.add("scale-95");
        logoutModal.querySelector("div").classList.remove("scale-100");
        setTimeout(() => {
          logoutModal.classList.add("hidden");
          logoutModal.classList.remove("flex");
        }, 300);
      };

      const missionsModal = document.getElementById("missions-modal");
      const missionsList = document.getElementById("missions-list");
      const missionsCounter = document.getElementById("missions-counter");
      const missionsProgress = document.getElementById("missions-progress");
      const missionsNextAction = document.getElementById(
        "missions-next-action",
      );
      const missionsModalSummary = document.getElementById(
        "missions-modal-summary",
      );
      let lastMissionTrigger = null;
      let missionsExperimentVariant = null;
      let activeMissionCategory = "all";
      let missionCache = [];
      const levelUpModal = document.getElementById("level-up-modal");
      const levelUpTitle = document.getElementById("level-up-title");
      const levelUpBenefits = document.getElementById("level-up-benefits");
      const levelUpCloseBtn = document.getElementById("level-up-close-btn");

      const closeLevelUpModal = () => {
        if (!levelUpModal) return;
        levelUpModal.classList.add("opacity-0");
        const box = levelUpModal.querySelector("div");
        if (box) {
          box.classList.add("scale-95");
          box.classList.remove("scale-100");
        }
        setTimeout(() => {
          levelUpModal.classList.add("hidden");
          levelUpModal.classList.remove("flex");
        }, 250);
      };

      if (levelUpCloseBtn) {
        levelUpCloseBtn.addEventListener("click", closeLevelUpModal);
      }

      function normalizeMissionCategory(item) {
        const code = String(
          item?.missions?.code || item?.code || "",
        ).toLowerCase();

        if (code.startsWith("general_")) return "general";
        if (code.startsWith("daily_")) return "daily";
        if (code.startsWith("weekly_")) return "weekly";
        if (code.startsWith("accumulative_")) return "accumulative";
        if (code.startsWith("streak_")) return "streak";
        if (code.startsWith("repeatable_")) return "repeatable";
        return "general";
      }

      function cleanMissionTitle(rawTitle) {
        const safeTitle = String(rawTitle || "").trim();
        if (!safeTitle) return "";
        const withoutPrefix = safeTitle.replace(/^[^:]{2,35}:\s*/i, "").trim();
        return withoutPrefix || safeTitle;
      }

      function getCategoryMeta(category) {
        if (category === "general")
          return { label: "Generales", accent: "#d7fd48", text: "#111827" };
        if (category === "daily")
          return { label: "Diarias", accent: "#60a5fa", text: "#111827" };
        if (category === "weekly")
          return { label: "Semanales", accent: "#8b5cf6", text: "#ffffff" };
        if (category === "accumulative")
          return { label: "Acumulables", accent: "#14b8a6", text: "#111827" };
        if (category === "streak")
          return { label: "De racha", accent: "#f59e0b", text: "#111827" };
        if (category === "repeatable")
          return { label: "Repetibles", accent: "#111827", text: "#ffffff" };
        return { label: "Todas", accent: "#111827" };
      }

      function renderMissionCards(items) {
        if (!Array.isArray(items) || items.length === 0) {
          return '<p class="text-sm text-center font-black uppercase text-slate-600">No hay misiones en esta categoria.</p>';
        }

        return items
          .map((item) => {
            const target =
              item.missions?.target_count ?? item.target_count ?? 1;
            const progress = item.progress ?? 0;
            const percent = Math.min(
              100,
              Math.round((progress / target) * 100),
            );
            const categoryMeta = getCategoryMeta(item.category);

            return `
              <div class="border-2 border-black bg-white p-3 rounded-lg">
                <div class="flex justify-between items-center gap-2">
                  <p class="font-black text-xs uppercase tracking-wider">${item.missions?.title || "Mision"}</p>
                  <span class="text-[10px] font-black ${item.completed ? "text-green-700" : "text-gray-600"}">${item.completed ? "LISTA" : "EN CURSO"}</span>
                </div>
                <p class="text-[10px] text-gray-600 mt-1">${item.missions?.description || "Descripcion no disponible"}</p>
                <div class="mt-2 flex items-center justify-between gap-2 text-[10px] font-black uppercase">
                  <span class="border-2 border-black px-2 py-0.5" style="background:${categoryMeta.accent};color:${categoryMeta.text || "#111827"}">${categoryMeta.label}</span>
                  <span>+${item.missions?.xp_reward ?? item.xp_reward ?? 0} XP</span>
                </div>
                <div class="w-full bg-black/10 h-2 rounded-full mt-2 overflow-hidden border-2 border-black">
                  <div class="h-full bg-[#8b5cf6] transition-[width] duration-700 ease-out" style="width: ${percent}%"></div>
                </div>
                <p class="text-[10px] font-black mt-1">${progress} / ${target}</p>
                <div class="mt-2 flex justify-end">
                  ${
                    item.claimed
                      ? '<span class="inline-block px-2 py-1 text-[10px] font-black uppercase text-white bg-black rounded">Reclamada</span>'
                      : item.completed
                        ? `<button class="px-2 py-1 text-[10px] font-black uppercase text-white bg-green-700 border-2 border-black rounded hover:bg-green-800 transition" onclick="window.claimMissionReward('${item.id}')">Reclamar +XP</button>`
                        : '<span class="inline-block px-2 py-1 text-[10px] font-black uppercase bg-slate-100 border-2 border-black rounded">En progreso</span>'
                  }
                </div>
              </div>`;
          })
          .join("");
      }

      function renderMissionsByCategory() {
        if (!missionsList) return;

        if (!Array.isArray(missionCache) || missionCache.length === 0) {
          missionsList.innerHTML =
            '<p class="text-sm text-center font-black uppercase text-slate-600">No hay misiones disponibles.</p>';
          return;
        }

        const categoryOrder = [
          "general",
          "daily",
          "weekly",
          "accumulative",
          "streak",
          "repeatable",
        ];
        const groups = missionCache.reduce((acc, mission) => {
          const key = mission.category || "general";
          if (!acc[key]) acc[key] = [];
          acc[key].push(mission);
          return acc;
        }, {});

        if (activeMissionCategory !== "all") {
          missionsList.innerHTML = renderMissionCards(
            groups[activeMissionCategory] || [],
          );
          return;
        }

        missionsList.innerHTML = categoryOrder
          .map((key) => {
            const meta = getCategoryMeta(key);
            const items = groups[key] || [];
            return `
              <section class="space-y-2">
                <div class="flex items-center justify-between">
                  <h3 class="text-xs font-black uppercase tracking-widest">${meta.label}</h3>
                  <span class="text-[10px] font-black uppercase border-2 border-black px-2 py-0.5">${items.length}</span>
                </div>
                ${renderMissionCards(items)}
              </section>`;
          })
          .join("");
      }

      function updateMissionTabs() {
        const tabButtons = document.querySelectorAll(".missions-tab-btn");
        tabButtons.forEach((button) => {
          const isActive =
            button.getAttribute("data-category") === activeMissionCategory;
          button.classList.toggle("bg-black", isActive);
          button.classList.toggle("text-white", isActive);
          button.classList.toggle("bg-white", !isActive);
          button.classList.toggle("text-black", !isActive);
        });
      }

      document.querySelectorAll(".missions-tab-btn").forEach((button) => {
        button.addEventListener("click", () => {
          activeMissionCategory = button.getAttribute("data-category") || "all";
          updateMissionTabs();
          renderMissionsByCategory();
        });
      });

      async function fetchAndRenderMissions({ renderModal = false } = {}) {
        const currentUser = authService.getCurrentUser();
        if (!currentUser?.id) {
          debugWarn("Usuario no autenticado para misiones");
          return [];
        }

        try {
          const weeklyData = await gamificationService.getWeeklyMissions(
            currentUser.id,
          );

          const missions = (weeklyData?.missions || []).map((item) => ({
            id: item.id,
            progress: item.progress,
            completed: Boolean(item.completed),
            claimed: Boolean(item.claimed),
            segment: item.segment,
            category: normalizeMissionCategory(item),
            missions: {
              code: item.code,
              title: item.title,
              description: item.description,
              target_count: item.target,
              xp_reward: item.xpReward,
            },
            expiresAt: item.expiresAt,
            status: item.status,
          }));

          let completed = 0;
          missions.forEach((item) => {
            if (item.completed) completed += 1;
          });

          if (missionsCounter) {
            missionsCounter.textContent = `${completed}/${missions.length} listas`;
          }

          if (missionsProgress) {
            missionsProgress.style.width = `${missions.length > 0 ? Math.round((completed / missions.length) * 100) : 0}%`;
          }

          if (missionsNextAction) {
            const pending = missions.find((mission) => !mission.completed);
            const missionName = cleanMissionTitle(pending?.missions?.title);
            missionsNextAction.textContent = pending
              ? `Siguiente: ${missionName || "Completa una mision"}`
              : "Excelente: completaste todo por ahora";
          }

          if (missionsModalSummary) {
            missionsModalSummary.textContent =
              missions.length > 0
                ? `Llevas ${completed} de ${missions.length} misiones completadas esta semana.`
                : "No tienes misiones activas esta semana.";
          }

          missionCache = missions;

          if (renderModal && missionsList) {
            renderMissionsByCategory();
          }

          return missions;
        } catch (err) {
          debugError("Error cargando misiones:", err);
          if (renderModal && missionsList) {
            missionsList.innerHTML =
              '<p class="text-sm text-center">No se pudieron cargar las misiones.</p>';
          }
          return [];
        }
      }

      async function initMissionsExperiment(currentUserId) {
        try {
          const assignment = await gamificationService.assignExperimentVariant(
            "missions_copy_v1",
            currentUserId,
          );
          missionsExperimentVariant = assignment?.variant || "control";

          await gamificationService.trackExperimentEvent({
            userId: currentUserId,
            experimentKey: "missions_copy_v1",
            variant: missionsExperimentVariant,
            eventType: "dashboard_view",
          });
        } catch (error) {
          debugWarn("No se pudo inicializar experimento de misiones:", error);
          missionsExperimentVariant = "control";
        }
      }

      window.showMissionsModal = async () => {
        if (!missionsModal) {
          return;
        }
        lastMissionTrigger = document.activeElement;
        await fetchAndRenderMissions({ renderModal: true });
        updateMissionTabs();

        const currentUser = authService.getCurrentUser();
        if (currentUser?.id && missionsExperimentVariant) {
          gamificationService
            .trackExperimentEvent({
              userId: currentUser.id,
              experimentKey: "missions_copy_v1",
              variant: missionsExperimentVariant,
              eventType: "missions_modal_open",
            })
            .catch((err) =>
              debugWarn("No se pudo trackear modal de misiones:", err),
            );
        }

        missionsModal.setAttribute("aria-hidden", "false");
        missionsModal.classList.remove("hidden");
        missionsModal.classList.add("flex");
        requestAnimationFrame(() => {
          missionsModal.classList.remove("opacity-0");
          const modalBox = missionsModal.querySelector("div");
          if (modalBox) {
            modalBox.classList.remove("scale-95");
            modalBox.classList.add("scale-100");
            modalBox.classList.remove("opacity-0");
          }

          const closeBtn = document.getElementById("missions-modal-close");
          if (closeBtn && typeof closeBtn.focus === "function") {
            closeBtn.focus();
          }
        });
      };

      window.claimMissionReward = async (missionId) => {
        const user = authService.getCurrentUser();
        if (!user?.id || !missionId) return;

        try {
          await gamificationService.claimMission(missionId, user.id);
          await fetchUserProfile();
          await fetchGamificationSnapshot();
          await refreshNotifications();
          await fetchAndRenderMissions({ renderModal: true });
          if (window.showToast) {
            window.showToast(
              "Recompensa reclamada",
              "success",
              "XP acreditada",
            );
          }
        } catch (error) {
          debugError("Error en claimMissionReward:", error);
          if (window.showToast) {
            window.showToast(error?.message || "No se pudo reclamar", "error");
          }
        }
      };

      window.closeMissionsModal = () => {
        if (!missionsModal) return;
        const active = document.activeElement;
        if (
          active &&
          missionsModal.contains(active) &&
          typeof active.blur === "function"
        ) {
          active.blur();
        }

        missionsModal.classList.add("opacity-0");
        const modalBox = missionsModal.querySelector("div");
        if (modalBox) {
          modalBox.classList.add("scale-95");
          modalBox.classList.remove("scale-100");
          modalBox.classList.add("opacity-0");
        }
        setTimeout(() => {
          missionsModal.classList.add("hidden");
          missionsModal.classList.remove("flex");
          missionsModal.setAttribute("aria-hidden", "true");

          if (
            lastMissionTrigger &&
            typeof lastMissionTrigger.focus === "function"
          ) {
            lastMissionTrigger.focus();
          }
        }, 300);
      };

      if (missionsModal) {
        missionsModal.addEventListener("click", (e) => {
          if (e.target === missionsModal) {
            window.closeMissionsModal();
          }
        });
      }

      if (mobileLogout) mobileLogout.onclick = window.showLogoutModal;
      if (cancelLogoutBtn) cancelLogoutBtn.onclick = window.closeLogoutModal;
      if (confirmLogoutBtn) {
        confirmLogoutBtn.onclick = () => {
          authService.logout();
          window.location.href = "/login";
        };
      }

      window.addEventListener("logout-requested", window.showLogoutModal);

      window.addEventListener("capypay-level-up", async (event) => {
        const detail = event?.detail || {};
        const profile = userProfile.get();
        const discountPct = Math.round(
          (profile?.benefits?.descuento || 0) * 100,
        );
        const vipLabel = profile?.benefits?.accesoVIP ? " + VIP" : "";

        if (typeof window.showToast === "function") {
          window.showToast(
            `Subiste a nivel ${detail.newLevel || "nuevo"}`,
            "success",
            detail.levelName || "¡Nuevo nivel desbloqueado!",
          );
        }

        if (levelUpModal) {
          if (levelUpTitle) {
            levelUpTitle.textContent = `${detail.levelName || "Nivel"} (LV ${detail.newLevel || "?"})`;
          }
          if (levelUpBenefits) {
            levelUpBenefits.textContent = `Beneficios: ${discountPct}% descuento${vipLabel}`;
          }

          levelUpModal.classList.remove("hidden");
          levelUpModal.classList.add("flex");
          requestAnimationFrame(() => {
            levelUpModal.classList.remove("opacity-0");
            const box = levelUpModal.querySelector("div");
            if (box) {
              box.classList.remove("scale-95");
              box.classList.add("scale-100");
            }
          });
        }

        await refreshNotifications();
      });

      function registerNivelesPrefetch(userId) {
        if (!userId) return;
        const levelLink = document.getElementById("dashboard-level-link");
        if (!levelLink || levelLink.dataset.prefetchBound === "1") return;

        let prefetchStarted = false;
        const prefetch = () => {
          if (prefetchStarted) return;
          prefetchStarted = true;

          Promise.allSettled([
            gamificationService.getWeeklySummary(userId),
            gamificationService.getWeeklyMissions(userId),
            gamificationService.getRewards(userId, "pending"),
          ]).catch(() => {});
        };

        levelLink.addEventListener("mouseenter", prefetch, { passive: true });
        levelLink.addEventListener("focus", prefetch, { passive: true });
        levelLink.addEventListener("touchstart", prefetch, { passive: true });
        levelLink.dataset.prefetchBound = "1";
      }

      // Fetch
      try {
          const userCedula = user?.cedula;
          
          await Promise.all([
            fetchUserProfile().then(() => {
              const userInfo = userProfile.get();
              registerNivelesPrefetch(userInfo?.id);
            }),
            fetchGamificationSnapshot(),
            refreshNotifications(),
            initMissionsExperiment(user?.id).then(() =>
              fetchAndRenderMissions(),
            ),
            (async () => {
              try {
                // If cedula is missing from cache, wait for profile first
                let targetCedula = userCedula;
                if (!targetCedula) {
                  const profileData = await userService.getProfile(user?.id);
                  targetCedula = profileData?.usuario?.cedula || profileData?.user?.cedula || profileData?.cedula;
                }
                if (!targetCedula) return;

const histRes = await userService.getHistory(targetCedula);
                if (histRes && Array.isArray(histRes.movimientos))
                  cachedMovements = histRes.movimientos;
                else if (histRes && Array.isArray(histRes.data))
                  cachedMovements = histRes.data;
                else cachedMovements = [];

              renderHistoryList();
            } catch (e) {
              const container = document.getElementById(
                "history-list-container",
              );
              if (container)
                container.innerHTML =
                  '<p class="text-center font-bold text-red-500 text-sm mt-10 uppercase">ERROR AL CARGAR</p>';
            }
          })(),
        ]);

        if (!notificationsPollingId) {
          notificationsPollingId = window.setInterval(
            refreshNotifications,
            30000,
          );
        }

        document.addEventListener("click", (e) => {
          const container = document.getElementById("notif-dropdown-container");
          const menu = document.getElementById("notif-menu");
          if (container && menu && !container.contains(e.target)) {
            menu.classList.add("hidden");
            menu.classList.remove("flex");
          }
        });
      } catch (err) {
        debugError("DEBUG DASH:", err);
        const c = document.getElementById("history-list-container");
        if (c)
          c.innerHTML =
            '<p class="text-center font-bold text-red-500 text-sm mt-10 uppercase">ERROR INIT: ' +
            err.message +
            "</p>";
      }
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initDashboard);
    } else {
      initDashboard();
    }

    // Suscribirse al store de usuario para actualizar nivel
    userProfile.subscribe((profile) => {
      const levelEl = document.getElementById("user-level");
      const progressEl = document.getElementById("level-progress");
      const benefitChip = document.getElementById("level-benefit-chip");
      const vipChip = document.getElementById("vip-chip");
      const discountPct = Math.round((profile?.benefits?.descuento || 0) * 100);
      const streak = profile?.streakStatus || {};
      const level = Number(profile?.level || 1);

      if (levelEl) levelEl.textContent = level;
      if (progressEl) progressEl.style.width = `${profile.progress || 0}%`;
      if (benefitChip) benefitChip.textContent = `Beneficio: ${discountPct}%`;

      window.dispatchEvent(
        new CustomEvent("capypay-level-changed", {
          detail: { level },
        }),
      );

      if (vipChip) {
        if (profile?.benefits?.accesoVIP) {
          vipChip.classList.remove("hidden");
        } else {
          vipChip.classList.add("hidden");
        }
      }

      const streakDailyEl = document.getElementById("streak-daily");
      const streakWarningEl = document.getElementById("streak-warning");
      const levelStreakSummaryEl = document.getElementById(
        "level-streak-summary",
      );

      if (streakDailyEl)
        streakDailyEl.textContent = Number(streak.currentDaily || 0);

      if (levelStreakSummaryEl) {
        const daily = Number(streak.currentDaily || 0);
        const weekly = Number(streak.currentWeekly || 0);
        if (daily > 0) {
          levelStreakSummaryEl.textContent = `Racha ${daily}d · Sem ${weekly}`;
        } else {
          levelStreakSummaryEl.textContent = "Empieza tu racha";
        }
      }

      if (streakWarningEl) {
        const lastQualifiedAt = streak.lastQualifiedAt
          ? new Date(streak.lastQualifiedAt).getTime()
          : null;
        const hoursSince = lastQualifiedAt
          ? (Date.now() - lastQualifiedAt) / (1000 * 60 * 60)
          : 0;
        if (
          Number(streak.currentDaily || 0) > 0 &&
          hoursSince >= 20 &&
          hoursSince <= 48
        ) {
          streakWarningEl.classList.remove("hidden");
          if (levelStreakSummaryEl)
            levelStreakSummaryEl.textContent = "Racha en riesgo";
        } else {
          streakWarningEl.classList.add("hidden");
        }
      }
    });
