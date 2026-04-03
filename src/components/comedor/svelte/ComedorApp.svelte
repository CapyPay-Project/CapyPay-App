<script>
  import { onMount, onDestroy } from "svelte";
  import { fetchAPI } from "../../../services/api.js";
  import PlatoDelDiaHero from "./PlatoDelDiaHero.svelte";
  import CategoriaTabs from "./CategoriaTabs.svelte";
  import ProductCarousel from "./ProductCarousel.svelte";
  import LiveQueue from "./LiveQueue.svelte";
  import TimerWidget from "./TimerWidget.svelte";
  import CapyTip from "./CapyTip.svelte";
  import { isCartOpen } from "../../../store/cartStore.js";
  import CarritoSidebar from "./CarritoSidebar.svelte";
  import { Trophy, ArrowRight, Star } from "lucide-svelte";

  const categories = [
    { id: "all", label: "Todo" },
    { id: "almuerzo", label: "Almuerzos" },
    { id: "desayuno", label: "Desayunos" },
    { id: "snack", label: "Snacks" },
    { id: "bebida", label: "Bebidas" },
  ];

  const devShowcaseItems = [
    {
      id: "demo-desayuno-capy",
      name: "Desayuno Capy",
      description:
        "Arepa dorada, huevo perico y queso fresco para arrancar con energía.",
      price: 18,
      image_url: "/images/cantina/sandwich.jpg",
    },
    {
      id: "demo-almuerzo-power",
      name: "Almuerzo Power",
      description:
        "Proteína, arroz, ensalada y guarnición para el combo más completo.",
      price: 36,
      image_url: "/images/cantina/empanadas.webp",
    },
    {
      id: "demo-snack-crunch",
      name: "Snack Crunch",
      description: "Crujiente, rápido y con el balance justo para la tarde.",
      price: 14,
      image_url: "/images/cantina/empanada.jpg",
    },
    {
      id: "demo-bebida-fresh",
      name: "Bebida Fresh",
      description:
        "Fría, liviana y pensada para acompañar el menú completo.",
      price: 10,
      image_url: "/images/cantina/sandwich.jpg",
    },
  ];

  let activeCategory = "all";
  let menuData = null;
  let loading = true;
  let isRefreshingMenu = false;
  let error = null;

  // State Management
  let diningState = "browsing"; // browsing, pre_arrival, waiting, ready
  let activeOrder = null;
  let queueCapacity = 150;
  let queueCurrentLoad = 0;
  let queueOccupancyPercent = 0;
  let queueLabel = "DESCONOCIDO";
  let queueDetail = "Sincronizando estado...";
  let waitRange = "-- min";
  let nextTicket = "---";
  let turnsAhead = null;
  let debugStateOverride = null;
  let showDebugPanel = false;
  let debugBusy = false;
  let hydrated = false;

  let realtimeInterval = null;

  $: activeCategoryLabel =
    categories.find((category) => category.id === activeCategory)?.label ||
    "Todo";

  $: visibleMenuItems = Array.isArray(menuData?.items) ? menuData.items : [];

  $: showcaseMenuItems = (() => {
    const baseItems = [...visibleMenuItems];

    if (!import.meta.env.DEV || baseItems.length >= 8) {
      return baseItems;
    }

    for (const sample of devShowcaseItems) {
      if (!baseItems.some((item) => item.id === sample.id)) {
        baseItems.push(sample);
      }

      if (baseItems.length >= 8) {
        break;
      }
    }

    return baseItems;
  })();

  $: showcaseAddedCount = Math.max(
    0,
    showcaseMenuItems.length - visibleMenuItems.length,
  );

  function normalizeOrderStatus(rawStatus) {
    return String(rawStatus || "").toLowerCase();
  }

  function resolveDiningStateFromOrder(order) {
    if (!order) return "browsing";

    const status = normalizeOrderStatus(order.status);

    if (
      status === "completed" ||
      status === "ready" ||
      status === "delivered"
    ) {
      return "ready";
    }

    if (
      status === "pre arrival" ||
      status === "preparing" ||
      status === "pending"
    ) {
      return "waiting";
    }

    return "browsing";
  }

  function mapQueueLabel(nivel, porcentaje) {
    const level = String(nivel || "").toLowerCase();

    if (
      level.includes("full") ||
      level.includes("alta") ||
      Number(porcentaje) >= 80
    )
      return "LLENO";
    if (level.includes("media") || Number(porcentaje) >= 45) return "MODERADO";
    return "FLUIDO";
  }

  async function loadMenu(category) {
    const hasExistingMenu = Boolean(menuData);

    if (hasExistingMenu) {
      isRefreshingMenu = true;
    } else {
      loading = true;
    }

    error = null;
    try {
      const qs = category && category !== "all" ? `?category=${category}` : "";
      const response = await fetchAPI(`/comedor/menu${qs}`);
      menuData = response;
    } catch (err) {
      error = err.message || "Error al cargar menú";
    } finally {
      loading = false;
      isRefreshingMenu = false;
    }
  }

  async function loadRealtimeWidgets() {
    try {
      const userRaw = localStorage.getItem("capypay_user");
      const user = userRaw ? JSON.parse(userRaw) : null;
      const userId = user?.id || user?.usuarioId;

      let latestActiveOrder = null;

      if (userId) {
        const ordersRes = await fetchAPI(`/comedor/my-orders/${userId}`);
        const orders = ordersRes?.orders || [];

        latestActiveOrder =
          orders.find((order) => {
            const status = normalizeOrderStatus(order.status);
            return [
              "pre arrival",
              "preparing",
              "pending",
              "ready",
              "completed",
            ].includes(status);
          }) || null;
      }

      activeOrder = latestActiveOrder;
      diningState = resolveDiningStateFromOrder(latestActiveOrder);

      const statsQuery = latestActiveOrder?.id
        ? `?orderId=${encodeURIComponent(latestActiveOrder.id)}`
        : "";

      const statsRes = await fetchAPI(`/comedor/stats${statsQuery}`);
      const ocupacion = statsRes?.ocupacion || {};

      queueCurrentLoad = Number(ocupacion.count || 0);
      queueOccupancyPercent = Number(ocupacion.porcentaje || 0);
      queueLabel = mapQueueLabel(ocupacion.nivel, queueOccupancyPercent);
      queueDetail = String(ocupacion.detalle || "Flujo sin datos");
      waitRange = String(statsRes?.tiempoEspera || "-- min");
      nextTicket = String(statsRes?.proximoTurno || "---");
      turnsAhead =
        statsRes?.turnsAhead === null || statsRes?.turnsAhead === undefined
          ? null
          : Number(statsRes.turnsAhead);

      if (debugStateOverride) {
        diningState = debugStateOverride;
      }
    } catch (err) {
      console.error("Error cargando widgets de comedor", err);
      queueLabel = "DESCONOCIDO";
      queueDetail = "No se pudo sincronizar con el servidor";
      waitRange = "-- min";
      nextTicket = "---";
      turnsAhead = null;
    }
  }

  async function markKitchenReadyForTesting() {
    debugBusy = true;
    try {
      await fetchAPI("/comedor/complete-all", { method: "POST" });
      await loadRealtimeWidgets();
    } catch (err) {
      console.error("No se pudo completar ordenes en modo test", err);
    } finally {
      debugBusy = false;
    }
  }

  function forceStateForTesting(state) {
    debugStateOverride = state;
    diningState = state;
  }

  function resetStateToRealtime() {
    debugStateOverride = null;
    loadRealtimeWidgets();
  }

  onMount(() => {
    hydrated = true;
    showDebugPanel =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        new URLSearchParams(window.location.search).get("debugComedor") ===
          "1");

    queueMicrotask(() => {
      loadMenu(activeCategory);
      loadRealtimeWidgets();

      realtimeInterval = setInterval(() => {
        loadRealtimeWidgets();
      }, 15000);
    });
  });

  onDestroy(() => {
    if (realtimeInterval) clearInterval(realtimeInterval);
  });

  function handleCategoryChange(e) {
    activeCategory = e.detail.category;
    loadMenu(activeCategory);
  }

  function toggleCart() {
    $isCartOpen = !$isCartOpen;
  }

  function handleCheckoutSuccess(event) {
    activeOrder = event.detail.order;
    if (activeOrder?.id) {
      diningState = "pre_arrival";
    }
  }

  function handleConfirmArrival() {
    // Señal visual local; el estado real se sincroniza por polling backend.
    diningState = "waiting";
  }
</script>

<div class="max-w-6xl mx-auto w-full flex flex-col gap-8 pb-32 relative">
  <div class="flex justify-between items-end border-b-8 border-black pb-4">
    <div>
      <h1
        class="font-black text-5xl md:text-7xl uppercase tracking-tighter leading-none"
      >
        COMEDOR
      </h1>
      <p
        class="font-bold text-xl md:text-2xl mt-2 tracking-tight text-brand-purple uppercase"
      >
        CAPYPAY PROTOCOL
      </p>
    </div>

    <!-- FIX: Visible on ALL screens now, not just mobile -->
    <div class="flex items-center gap-2 sm:gap-3">
      <a
        href="/services/orders"
        class="bg-white border-4 border-black p-3 px-4 sm:px-5 hover:bg-[#f3f3f3] active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2"
      >
        <span class="material-symbols-outlined shrink-0 text-black font-black"
          >receipt_long</span
        >
        <span class="font-black text-sm sm:text-base uppercase tracking-tighter"
          >Ordenes</span
        >
      </a>

      <button
        on:click={toggleCart}
        class="bg-brand-lime border-4 border-black p-3 px-6 hover:bg-[#c4ec35] active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2"
      >
        <span
          class="material-symbols-outlined shrink-0 text-black font-black"
          style="font-variation-settings: 'FILL' 1, 'wght' 700;"
        >
          shopping_cart
        </span>
        <span
          class="font-black text-xl uppercase tracking-tighter hidden sm:inline"
          >Carrito</span
        >
      </button>
    </div>
  </div>

  {#if loading && !menuData}
    <div
      class="w-full h-64 border-4 border-dashed border-black flex items-center justify-center"
    >
      <span class="font-black uppercase text-2xl animate-pulse"
        >CARGANDO MENÚ...</span
      >
    </div>
  {:else if error}
    <div class="w-full p-6 border-4 border-black bg-red-500 text-white">
      <span class="font-black uppercase text-xl"
        >ALERTA DEL SISTEMA: {error}</span
      >
      <button
        on:click={() => loadMenu(activeCategory)}
        class="mt-4 bg-black text-white px-4 py-2 font-bold uppercase border-2 border-white"
        >REINTENTAR</button
      >
    </div>
  {:else}
    <!-- Comedor Top Widgets -->
    <CapyTip />

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <LiveQueue
        {diningState}
        capacity={queueCapacity}
        currentLoad={queueCurrentLoad}
        occupancyPercent={queueOccupancyPercent}
        occupancyLabel={queueLabel}
        occupancyDetail={queueDetail}
      />
      <TimerWidget
        {diningState}
        {activeOrder}
        {waitRange}
        {nextTicket}
        {turnsAhead}
        on:confirmArrival={handleConfirmArrival}
      />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <p class="text-xs font-black uppercase tracking-[0.25em] text-black/50">
          Categoría activa
        </p>
        <p class="mt-2 text-3xl font-black uppercase tracking-tighter">
          {activeCategoryLabel}
        </p>
      </div>

      <div class="border-4 border-black bg-[#f9f7ff] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <p class="text-xs font-black uppercase tracking-[0.25em] text-black/50">
          Platos visibles
        </p>
        <p class="mt-2 text-3xl font-black uppercase tracking-tighter">
          {visibleMenuItems.length}
        </p>
      </div>

      <div class="border-4 border-black bg-[#f5fdf2] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <p class="text-xs font-black uppercase tracking-[0.25em] text-black/50">
          Destacados
        </p>
        <p class="mt-2 text-3xl font-black uppercase tracking-tighter">
          {menuData?.popularItems?.length || 0}
        </p>
      </div>
    </div>

    {#if isRefreshingMenu}
      <div class="mb-4 border-4 border-black bg-brand-lime px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <span class="font-black uppercase tracking-tighter text-sm sm:text-base">
          Actualizando {activeCategoryLabel.toLowerCase()} sin mover la vista
        </span>
      </div>
    {/if}

    {#if showDebugPanel}
      <div
        class="mb-6 border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      >
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3"
        >
          <h3 class="font-black uppercase tracking-tight text-lg">
            Zona de testeo (comedor)
          </h3>
          <span class="text-xs font-bold uppercase text-black/60"
            >Solo desarrollo</span
          >
        </div>

        <div class="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
          <button
            on:click={() => forceStateForTesting("browsing")}
            class="px-3 py-2 border-2 border-black bg-[#f5f5f5] font-black text-xs uppercase"
            >Browsing</button
          >
          <button
            on:click={() => forceStateForTesting("pre_arrival")}
            class="px-3 py-2 border-2 border-black bg-[#e9d5ff] font-black text-xs uppercase"
            >Pre Arrival</button
          >
          <button
            on:click={() => forceStateForTesting("waiting")}
            class="px-3 py-2 border-2 border-black bg-[#fde68a] font-black text-xs uppercase"
            >Waiting</button
          >
          <button
            on:click={() => forceStateForTesting("ready")}
            class="px-3 py-2 border-2 border-black bg-[#86efac] font-black text-xs uppercase"
            >Ready</button
          >
          <button
            on:click={resetStateToRealtime}
            class="px-3 py-2 border-2 border-black bg-[#d7fd48] font-black text-xs uppercase"
            >Estado real</button
          >
        </div>

        <button
          on:click={markKitchenReadyForTesting}
          disabled={debugBusy}
          class="px-4 py-2 border-2 border-black bg-black text-white font-black text-xs uppercase disabled:opacity-60"
        >
          {debugBusy ? "Procesando..." : "Marcar órdenes listas (dev)"}
        </button>
      </div>
    {/if}

    {#if menuData?.platoDia}
      <PlatoDelDiaHero item={menuData.platoDia} />
    {/if}

    <CategoriaTabs
      {categories}
      {activeCategory}
      on:change={handleCategoryChange}
    />

    {#if menuData?.popularItems?.length > 0}
      <ProductCarousel title="Lo Más Popular" items={menuData.popularItems} />
    {/if}

    {#if menuData?.items?.length > 0}
      <ProductCarousel title="Todo el Menú" items={menuData.items} />
    {/if}

    {#if showcaseAddedCount > 0}
      <ProductCarousel title="Muestra extendida" items={showcaseMenuItems} />
    {/if}
  {/if}
</div>

<CarritoSidebar on:checkout_success={handleCheckoutSuccess} />
