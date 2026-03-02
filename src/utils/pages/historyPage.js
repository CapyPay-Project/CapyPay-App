// @ts-nocheck
import { authService, userService } from "../../services/api.js";

export function initHistoryPage() {
  const state = {
    allMovements: [],
    filteredMovements: [],
    currentPage: 1,
    itemsPerPage: 8,
  };

  const dom = getDomRefs();
  setupFilterEvents(dom, state);
  setupPaginationEvents(dom, state);
  setupModalEvents(dom, state);
  setupExportAndReceiptEvents(dom, state);
  initHistory(dom, state);
}

function getDomRefs() {
  return {
    container: document.getElementById("history-rows-container"),
    prevBtn: document.getElementById("prev-page"),
    nextBtn: document.getElementById("next-page"),
    pageInd: document.getElementById("page-indicator"),
    infoSpan: document.getElementById("pagination-info"),
    totalSpan: document.getElementById("total-items"),
    modal: document.getElementById("transaction-modal"),
    searchInput: document.getElementById("search-input"),
    filterType: document.getElementById("filter-type"),
    dateFromEl: document.getElementById("date-from"),
    dateToEl: document.getElementById("date-to"),
    closeModalBtn: document.getElementById("close-modal-btn"),
    exportPdfBtn: document.getElementById("export-pdf-btn"),
    downloadReceiptBtn: document.getElementById("download-receipt-btn"),
  };
}

async function initHistory(dom, state) {
  const user = authService.getCurrentUser();
  if (!user) {
    window.location.href = "/auth/login";
    return;
  }

  try {
    const userId = user.id || user.usuarioId || user._id;
    const profileData = await userService.getProfile(userId);
    const realUser = profileData.usuario || profileData.user || profileData;

    if (!realUser.cedula) {
      showEmpty(dom, state, "No se encontró cédula para cargar historial.");
      return;
    }

    const response = await userService.getHistory(realUser.cedula);
    if (!response || !response.movimientos) {
      showEmpty(dom, state, "No hay movimientos registrados.");
      return;
    }

    state.allMovements = response.movimientos.map((movement, index) => ({
      ...movement,
      uniqueId: index + 12450,
    }));

    applyFilters(dom, state);
  } catch (error) {
    console.error("Error loading history:", error);
    showEmpty(dom, state, "Error al cargar el historial.");
  }
}

function showEmpty(dom, state, message) {
  if (dom.container) {
    dom.container.innerHTML = `<div class="flex flex-col items-center justify-center h-full p-10 opacity-50"><p class="text-center text-slate-500 text-sm">${message}</p></div>`;
  }
  updatePaginationUI(dom, state, 0);
}

function setupFilterEvents(dom, state) {
  dom.searchInput?.addEventListener("input", () => applyFilters(dom, state));
  dom.dateFromEl?.addEventListener("change", () => applyFilters(dom, state));
  dom.dateToEl?.addEventListener("change", () => applyFilters(dom, state));

  document.querySelectorAll(".filter-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      const value = event.target.dataset.val;
      if (dom.filterType) dom.filterType.value = value;

      document.querySelectorAll(".filter-btn").forEach((item) => {
        item.className =
          "filter-btn flex-1 rounded-lg text-xs font-bold transition-all p-2 text-slate-400 hover:text-white";
      });

      event.target.className =
        "filter-btn flex-1 rounded-lg text-xs font-bold transition-all p-2 text-black bg-brand-lime shadow-lg";

      applyFilters(dom, state);
    });
  });
}

function applyFilters(dom, state) {
  const search = dom.searchInput?.value.toLowerCase() || "";
  const type = dom.filterType?.value || "";
  const dateFrom = dom.dateFromEl?.value || "";
  const dateTo = dom.dateToEl?.value || "";

  state.filteredMovements = state.allMovements.filter((movement) => {
    const description = (
      movement.descripcion ||
      movement.concept ||
      movement.tipo ||
      ""
    ).toLowerCase();

    const matchesSearch =
      description.includes(search) || movement.monto.toString().includes(search);

    let matchesType = true;
    if (type === "income") matchesType = !movement.es_negativo;
    if (type === "expense") matchesType = movement.es_negativo;

    let matchesDate = true;
    if (dateFrom || dateTo) {
      const movementDate = new Date(movement.fecha).setHours(0, 0, 0, 0);

      if (dateFrom && movementDate < new Date(`${dateFrom}T00:00:00`).getTime()) {
        matchesDate = false;
      }

      if (dateTo && movementDate > new Date(`${dateTo}T23:59:59`).getTime()) {
        matchesDate = false;
      }
    }

    return matchesSearch && matchesType && matchesDate;
  });

  state.currentPage = 1;
  renderTable(dom, state);
}

function renderTable(dom, state) {
  if (state.filteredMovements.length === 0) {
    showEmpty(dom, state, "No se encontraron resultados con los filtros actuales.");
    return;
  }

  const start = (state.currentPage - 1) * state.itemsPerPage;
  const end = start + state.itemsPerPage;
  const pageData = state.filteredMovements.slice(start, end);

  const html = pageData
    .map((movement) => {
      const isNegative = movement.es_negativo;
      const amountColor = isNegative ? "text-purple-400" : "text-[#d7fd48]";
      const iconBg = isNegative ? "bg-purple-500/10" : "bg-[#d7fd48]/10";
      const iconColor = isNegative ? "text-purple-400" : "text-[#d7fd48]";
      const sign = isNegative ? "-" : "+";
      const date = new Date(movement.fecha).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const desc = movement.descripcion || movement.concept || "Transferencia";
      const category = movement.tipo || "General";

      return `
      <div onclick="window.openModal('${movement.uniqueId}')" class="group flex items-center justify-between p-4! transition-all duration-300 cursor-pointer w-full mx-auto hover:bg-neutral-800 hover:border-[#d7fd48]/30 hover:scale-[1.01] overflow-hidden bg-black/40 border border-white/10 rounded-3xl backdrop-blur-sm shadow-xl mb-3">
        <div class="flex items-center gap-4 min-w-0 flex-1">
          <div class="w-12 h-12 rounded-full ${iconBg} flex items-center justify-center ${iconColor} transition-transform shrink-0 group-hover:scale-110 group-hover:rotate-12">
            ${
              isNegative
                ? `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>`
                : `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>`
            }
          </div>
          <div class="flex flex-col min-w-0">
            <span class="text-white font-bold group-hover:text-brand-lime transition-colors truncate text-sm sm:text-base">${desc}</span>
            <span class="text-xs text-slate-500 font-mono">${date}</span>
          </div>
        </div>
        <div class="text-right shrink-0">
          <p class="font-bold text-lg sm:text-xl font-mono ${amountColor} group-hover:scale-110 transition-transform origin-right">${sign}${movement.monto}</p>
          <p class="text-[10px] text-slate-500 uppercase tracking-wider">${category}</p>
        </div>
      </div>`;
    })
    .join("");

  if (dom.container) dom.container.innerHTML = html;
  updatePaginationUI(dom, state, state.filteredMovements.length);
}

function updatePaginationUI(dom, state, total) {
  const totalPages = Math.ceil(total / state.itemsPerPage) || 1;

  if (state.currentPage > totalPages) state.currentPage = totalPages;
  if (state.currentPage < 1) state.currentPage = 1;

  const start = total === 0 ? 0 : (state.currentPage - 1) * state.itemsPerPage + 1;
  const end = Math.min(state.currentPage * state.itemsPerPage, total);

  if (dom.infoSpan) dom.infoSpan.innerText = `${start}-${end}`;
  if (dom.totalSpan) dom.totalSpan.innerText = total.toString();
  if (dom.pageInd) dom.pageInd.innerText = `${state.currentPage} / ${totalPages}`;

  if (dom.prevBtn) dom.prevBtn.disabled = state.currentPage === 1;
  if (dom.nextBtn) dom.nextBtn.disabled = state.currentPage === totalPages || total === 0;
}

function setupPaginationEvents(dom, state) {
  dom.prevBtn?.addEventListener("click", () => {
    if (state.currentPage > 1) {
      state.currentPage -= 1;
      renderTable(dom, state);
    }
  });

  dom.nextBtn?.addEventListener("click", () => {
    const totalPages = Math.ceil(state.filteredMovements.length / state.itemsPerPage);
    if (state.currentPage < totalPages) {
      state.currentPage += 1;
      renderTable(dom, state);
    }
  });
}

function setupModalEvents(dom, state) {
  window.openModal = (uniqueId) => {
    const movement = state.allMovements.find((item) => item.uniqueId == uniqueId);
    if (!movement || !dom.modal) return;

    document.getElementById("modal-id").innerText = `ID: #${uniqueId}`;

    const isNegative = movement.es_negativo;
    const sign = isNegative ? "-" : "+";

    const amountEl = document.getElementById("modal-amount");
    if (amountEl) {
      amountEl.innerText = `${sign}${movement.monto}$`;
      amountEl.className = `text-3xl font-bold flex justify-center items-center gap-2 ${isNegative ? "text-purple-400" : "text-[#d7fd48]"}`;
    }

    const badgeEl = document.getElementById("modal-status-badge");
    if (badgeEl) {
      badgeEl.className = `inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${isNegative ? "bg-purple-500/10 text-purple-400" : "bg-[#d7fd48]/10 text-[#d7fd48]"}`;
    }

    const dateObj = new Date(movement.fecha);
    document.getElementById("modal-date").innerText = dateObj.toLocaleDateString();
    document.getElementById("modal-time").innerText = dateObj.toLocaleTimeString();
    document.getElementById("modal-desc").innerText =
      movement.descripcion || movement.concept || "Sin descripción";
    document.getElementById("modal-type").innerText = movement.tipo || "General";

    dom.modal.classList.remove("hidden");
    dom.modal.classList.add("flex");

    setTimeout(() => {
      if (!dom.modal) return;
      dom.modal.classList.remove("opacity-0");
      const inner = dom.modal.querySelector("div");
      inner?.classList.remove("scale-95");
      inner?.classList.add("scale-100");
    }, 10);
  };

  const closeModal = () => {
    if (!dom.modal) return;
    dom.modal.classList.add("opacity-0");
    const inner = dom.modal.querySelector("div");
    inner?.classList.add("scale-95");
    inner?.classList.remove("scale-100");

    setTimeout(() => {
      dom.modal.classList.add("hidden");
      dom.modal.classList.remove("flex");
    }, 300);
  };

  dom.closeModalBtn?.addEventListener("click", closeModal);
  dom.modal?.addEventListener("click", (event) => {
    if (event.target === dom.modal) closeModal();
  });
}

function setupExportAndReceiptEvents(dom, state) {
  dom.downloadReceiptBtn?.addEventListener("click", () => {
    window.showToast?.("La descarga de comprobante estará disponible pronto", "info");
  });

  const exportFn = () => {
    if (state.filteredMovements.length === 0) {
      window.showToast?.("No hay datos para exportar", "error");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, 210, 20, "F");
    doc.setTextColor(215, 253, 73);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("CapyPay - Historial de Transacciones", 14, 13);

    doc.setTextColor(100);
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 28);

    const tableBody = state.filteredMovements.map((movement) => [
      new Date(movement.fecha).toLocaleDateString(),
      movement.descripcion || movement.concept,
      movement.tipo || "General",
      `${movement.es_negativo ? "-$" : "+$"}${movement.monto}`,
    ]);

    doc.autoTable({
      head: [["Fecha", "Descripción", "Categoría", "Monto"]],
      body: tableBody,
      startY: 35,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save("CapyPay_Historial.pdf");
  };

  window.exportToPDF = exportFn;
  dom.exportPdfBtn?.addEventListener("click", exportFn);
}
