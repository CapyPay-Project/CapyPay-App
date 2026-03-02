// @ts-nocheck
import { userService } from "../../services/api.js";

export function initContactsPage() {
	const dom = getDomRefs();
	if (!dom.grid) return;

	const state = {
		allContacts: [],
		currentFilter: "all",
		isEditMode: false,
		debounceTimer: null,
	};

	setupModalEvents(dom, state);
	setupSearchAndSuggestions(dom, state);
	setupFilterTabs(dom, state);
	setupGlobalMenuClose();
	setupFormSubmit(dom, state);

	loadContacts(dom, state);
}

function getDomRefs() {
	return {
		grid: document.getElementById("contacts-grid"),
		searchInput: document.getElementById("search-input"),
		filterBtns: document.querySelectorAll(".filter-btn"),
		modal: document.getElementById("modal-add-contact"),
		modalTitle: document.getElementById("modal-title-text"),
		btnOpen: document.getElementById("btn-open-modal"),
		btnClose: document.getElementById("btn-close-modal"),
		form: document.getElementById("form-add-contact"),
		inputContactId: document.getElementById("input-contactId"),
		errorContainer: document.getElementById("add-error"),
		errorText: document.getElementById("add-error-text"),
		inputCedula: document.getElementById("input-cedula"),
		suggestionsBox: document.getElementById("cedula-suggestions"),
	};
}

function setupModalEvents(dom, state) {
	dom.btnOpen?.addEventListener("click", () => toggleModal(dom, state, true));
	dom.btnClose?.addEventListener("click", () =>
		toggleModal(dom, state, false),
	);
}

function toggleModal(dom, state, show, editMode = false, contactData = null) {
	if (!dom.modal) return;
	state.isEditMode = editMode;

	if (show) {
		dom.modal.classList.remove("opacity-0", "pointer-events-none");
		const inner = dom.modal.querySelector("div");
		inner?.classList.remove("scale-95");
		inner?.classList.add("scale-100");

		dom.form?.reset();
		dom.errorContainer?.classList.add("hidden");

		if (editMode && contactData) {
			if (dom.modalTitle) dom.modalTitle.innerText = "Editar Alias";
			if (dom.inputContactId) dom.inputContactId.value = contactData.id;

			if (dom.inputCedula) {
				dom.inputCedula.value = contactData.cedula;
				dom.inputCedula.setAttribute("disabled", "true");
				dom.inputCedula.classList.add("opacity-50", "cursor-not-allowed");
			}

			const aliasInput = dom.form?.querySelector('input[name="alias"]');
			if (aliasInput) aliasInput.value = contactData.alias;
		} else {
			if (dom.modalTitle) dom.modalTitle.innerText = "Añadir Contacto";
			if (dom.inputContactId) dom.inputContactId.value = "";

			if (dom.inputCedula) {
				dom.inputCedula.value = "";
				dom.inputCedula.removeAttribute("disabled");
				dom.inputCedula.classList.remove("opacity-50", "cursor-not-allowed");
				dom.inputCedula.focus();
			}
		}
		return;
	}

	dom.modal.classList.add("opacity-0", "pointer-events-none");
	const inner = dom.modal.querySelector("div");
	inner?.classList.remove("scale-100");
	inner?.classList.add("scale-95");
	dom.suggestionsBox?.classList.add("hidden");
}

function setupSearchAndSuggestions(dom, state) {
	if (!dom.inputCedula || !dom.suggestionsBox) return;

	dom.inputCedula.addEventListener("input", (event) => {
		const target = event.target;
		const value = target.value.trim();
		clearTimeout(state.debounceTimer);

		if (value.length < 2) {
			dom.suggestionsBox.classList.add("hidden");
			return;
		}

		state.debounceTimer = setTimeout(async () => {
			try {
				const results = await userService.searchUsers(value);
				renderSuggestions(dom, results);
			} catch (error) {
				console.error("Error de búsqueda de usuarios:", error);
			}
		}, 300);
	});

	document.addEventListener("click", (event) => {
		if (
			!dom.inputCedula.contains(event.target) &&
			!dom.suggestionsBox.contains(event.target)
		) {
			dom.suggestionsBox.classList.add("hidden");
		}
	});
}

function renderSuggestions(dom, users) {
	if (!dom.suggestionsBox) return;
	if (!users || users.length === 0) {
		dom.suggestionsBox.classList.add("hidden");
		return;
	}

	dom.suggestionsBox.innerHTML = "";
	users.forEach((user) => {
		const item = document.createElement("div");
		item.className =
			"px-4 py-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 flex flex-col transition-colors group";
		item.innerHTML = `
			<div class="flex items-center justify-between">
				<span class="text-white text-sm font-bold group-hover:text-brand-lime transition-colors">${user.cedula}</span>
				<span class="text-[10px] text-slate-400 bg-white/5 px-1.5 rounded">Usuario</span>
			</div>
			<span class="text-slate-400 text-xs">${user.name}</span>
		`;

		item.addEventListener("click", () => {
			if (!dom.inputCedula) return;
			dom.inputCedula.value = user.cedula;

			const aliasInput = dom.form?.querySelector('input[name="alias"]');
			if (aliasInput && !aliasInput.value) aliasInput.value = user.name;

			dom.suggestionsBox.classList.add("hidden");
		});

		dom.suggestionsBox.appendChild(item);
	});

	dom.suggestionsBox.classList.remove("hidden");
}

function setupFilterTabs(dom, state) {
	dom.searchInput?.addEventListener("input", () => renderGrid(dom, state));

	dom.filterBtns?.forEach((button) => {
		button.addEventListener("click", () => {
			dom.filterBtns.forEach((item) => {
				item.classList.remove("bg-brand-lime", "text-black", "shadow-sm");
				item.classList.add("text-slate-500");
			});

			button.classList.remove("text-slate-500");
			button.classList.add("bg-brand-lime", "text-black", "shadow-sm");

			state.currentFilter = button.getAttribute("data-filter");
			renderGrid(dom, state);
		});
	});
}

function setupGlobalMenuClose() {
	window.toggleCardMenu = (id) => {
		const menu = document.getElementById(`menu-${id}`);
		document.querySelectorAll(".card-menu").forEach((item) => {
			if (item.id !== `menu-${id}`) item.classList.add("hidden");
		});
		menu?.classList.toggle("hidden");
	};

	document.addEventListener("click", (event) => {
		if (!event.target.closest(".card-actions")) {
			document
				.querySelectorAll(".card-menu")
				.forEach((item) => item.classList.add("hidden"));
		}
	});
}

function createContactCard(contact) {
	const isFavorite = contact.is_favorite;
	const card = document.createElement("div");
	card.className =
		"bg-brand-black border border-white/10 rounded-3xl p-6 flex flex-col items-center gap-4 hover:border-brand-lime/30 transition-all group relative animate-fade-in hover:shadow-xl hover:shadow-black/50";

	const favoriteBadge = isFavorite
		? `<div class="absolute top-4 right-4 text-brand-lime"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg></div>`
		: "";

	card.innerHTML = `
		${favoriteBadge}
		<div class="relative">
			<img
				src="https://api.dicebear.com/9.x/avataaars/svg?seed=${contact.nombre}"
				alt="${contact.nombre}"
				class="w-24 h-24 rounded-full bg-[#121212] border-4 border-white/10 group-hover:border-brand-lime transition-colors shadow-2xl"
			/>
			<div class="absolute bottom-1 right-1 w-5 h-5 bg-brand-lime border-2 border-[#121212] rounded-full"></div>
		</div>

		<div class="text-center w-full">
			<h3 class="text-white font-bold text-lg truncate mb-1" title="${contact.nombre}">${contact.nombre}</h3>
			<div class="flex justify-center mb-2">
				<span class="text-[10px] text-slate-400 font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5">${contact.cedula}</span>
			</div>
			<div class="text-xs text-slate-400 truncate w-full px-2">${contact.alias ? "@" + contact.alias : "@" + contact.nombre.replace(/\s+/g, "").toLowerCase()}</div>
		</div>

		<div class="flex gap-2 w-full">
			<button
				class="flex-1 bg-brand-lime hover:bg-[#bce628] text-black text-xs font-bold py-3 rounded-xl transition-all shadow-[0_0_10px_rgba(215,253,73,0.1)] hover:shadow-[0_0_15px_rgba(215,253,73,0.2)] active:scale-95"
				onclick="window.location.href='/dashboard?transferTo=${contact.cedula}'"
			>
				Enviar BARAS
			</button>

			<div class="relative card-actions">
				<button
					onclick="toggleCardMenu('${contact.id}')"
					class="w-10 h-full rounded-xl bg-[#121212] text-slate-400 hover:text-white hover:bg-[#252525] flex items-center justify-center border border-white/5 transition-colors cursor-pointer"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
				</button>

				<div id="menu-${contact.id}" class="card-menu hidden absolute bottom-full right-0 mb-2 w-48 bg-[#121212] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20">
					<div class="p-1 flex flex-col gap-0.5">
						<button class="w-full text-left px-3 py-2.5 text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-white rounded-lg flex items-center gap-3 transition-colors btn-favorite" data-id="${contact.id}" data-fav="${isFavorite}">
							<span class="${isFavorite ? "text-brand-lime" : "text-slate-500"}">★</span> ${isFavorite ? "Quitar de Favoritos" : "Añadir a Favoritos"}
						</button>
						<button class="w-full text-left px-3 py-2.5 text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-white rounded-lg flex items-center gap-3 transition-colors btn-edit" data-id="${contact.id}" data-alias="${contact.alias || ""}" data-cedula="${contact.cedula}">
							<span>✎</span> Editar Alias
						</button>
						<button class="w-full text-left px-3 py-2.5 text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg flex items-center gap-3 transition-colors btn-delete" data-id="${contact.id}">
							<span>🗑</span> Eliminar Contacto
						</button>
					</div>
				</div>
			</div>
		</div>
	`;

	return card;
}

function createAddCard(onClick) {
	const card = document.createElement("div");
	card.className =
		"bg-transparent border-2 border-dashed border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 hover:border-brand-lime/30 hover:bg-brand-lime/5 transition-all group cursor-pointer h-full min-h-[240px]";
	card.innerHTML = `
		<div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-brand-lime group-hover:text-black transition-all">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
			</svg>
		</div>
		<div class="text-center">
			<h3 class="text-slate-400 group-hover:text-black font-bold mb-1 transition-colors text-lg">Añadir Nuevo</h3>
			<p class="text-xs text-slate-500 group-hover:text-slate-600 transition-colors">Guardar nuevo destinatario</p>
		</div>
	`;
	card.addEventListener("click", onClick);
	return card;
}

function attachDynamicActionListeners(dom, state) {
	document.querySelectorAll(".btn-edit").forEach((button) => {
		button.addEventListener("click", () => {
			toggleModal(dom, state, true, true, {
				id: button.getAttribute("data-id"),
				cedula: button.getAttribute("data-cedula"),
				alias: button.getAttribute("data-alias"),
			});
		});
	});

	document.querySelectorAll(".btn-delete").forEach((button) => {
		button.addEventListener("click", async () => {
			const id = button.getAttribute("data-id");
			if (!confirm("¿Estás seguro de eliminar este contacto?")) return;
			try {
				await userService.deleteContact(id);
				window.showToast("Contacto eliminado", "success");
				loadContacts(dom, state);
			} catch (error) {
				window.showToast(error.message || "No se pudo eliminar el contacto", "error");
			}
		});
	});

	document.querySelectorAll(".btn-favorite").forEach((button) => {
		button.addEventListener("click", async () => {
			const id = button.getAttribute("data-id");
			const isFavorite = button.getAttribute("data-fav") === "true";
			try {
				await userService.toggleFavorite(id, !isFavorite);
				window.showToast(
					isFavorite ? "Quitado de favoritos" : "Añadido a favoritos ★",
					"success",
				);
				loadContacts(dom, state);
			} catch (error) {
				window.showToast(
					error.message || "No se pudo actualizar favorito",
					"error",
				);
			}
		});
	});
}

function renderGrid(dom, state) {
	if (!dom.grid) return;
	dom.grid.innerHTML = "";

	let filtered = [...state.allContacts];
	const searchTerm = dom.searchInput?.value.toLowerCase() || "";

	if (searchTerm) {
		filtered = filtered.filter(
			(item) =>
				item.nombre.toLowerCase().includes(searchTerm) ||
				item.cedula.includes(searchTerm) ||
				(item.alias && item.alias.toLowerCase().includes(searchTerm)),
		);
	}

	if (state.currentFilter === "favorites") {
		filtered = filtered.filter((item) => item.is_favorite);
	}

	if (state.currentFilter === "recent") {
		filtered = filtered.slice(0, 5);
	}

	if (filtered.length === 0 && !searchTerm) {
		if (state.currentFilter === "favorites") {
			dom.grid.innerHTML = `
				<div class="col-span-full flex flex-col items-center justify-center p-10 text-slate-500 border-2 border-dashed border-white/10 rounded-3xl h-64">
					<span class="text-4xl mb-2">★</span>
					<p class="text-slate-400">No tienes favoritos añadidos aún.</p>
				</div>
			`;
		} else {
			dom.grid.appendChild(createAddCard(() => toggleModal(dom, state, true)));
		}
		return;
	}

	if (filtered.length === 0 && searchTerm) {
		dom.grid.innerHTML = `
			<div class="col-span-full flex flex-col items-center justify-center p-10 text-slate-500 border-2 border-dashed border-white/10 rounded-3xl h-64">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
				<p>No hay resultados para "${searchTerm}"</p>
			</div>
		`;
		return;
	}

	filtered.forEach((contact) => dom.grid.appendChild(createContactCard(contact)));

	if (state.currentFilter === "all" && !searchTerm) {
		dom.grid.appendChild(createAddCard(() => toggleModal(dom, state, true)));
	}

	attachDynamicActionListeners(dom, state);
}

async function loadContacts(dom, state) {
	if (!dom.grid) return;
	try {
		const data = await userService.getContacts();
		dom.errorContainer?.classList.add("hidden");
		state.allContacts = data.contactos || [];
		renderGrid(dom, state);
	} catch (error) {
		console.error(error);
		dom.grid.innerHTML =
			'<div class="col-span-full text-red-400 text-center py-10">Error cargando contactos. Revisa tu conexión.</div>';
	}
}

function setupFormSubmit(dom, state) {
	dom.form?.addEventListener("submit", async (event) => {
		event.preventDefault();
		const formData = new FormData(dom.form);
		const contactId = formData.get("contactId");
		const cedula = formData.get("cedula");
		const alias = formData.get("alias");

		dom.errorContainer?.classList.add("hidden");

		try {
			if (state.isEditMode && contactId) {
				await userService.updateContact(contactId, alias);
				window.showToast("Alias actualizado correctamente", "success");
			} else {
				await userService.addContact(cedula, alias);
				window.showToast("Contacto añadido exitosamente", "success");
			}

			toggleModal(dom, state, false);
			loadContacts(dom, state);
		} catch (error) {
			window.showToast(error.message || "No se pudo guardar el contacto", "error");
			if (dom.errorText) dom.errorText.innerText = error.message;
			dom.errorContainer?.classList.remove("hidden");
		}
	});
}
