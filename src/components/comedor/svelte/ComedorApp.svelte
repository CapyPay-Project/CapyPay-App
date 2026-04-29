<script>
  import { onMount, onDestroy } from "svelte";
  import { fetchAPI } from "../../../services/api.js";
  import PlatoDelDiaHero from "./PlatoDelDiaHero.svelte";
  import CategoriaTabs from "./CategoriaTabs.svelte";
  import ProductCarousel from "./ProductCarousel.svelte";
  import MainPushDeck from "./MainPushDeck.svelte";
  import MenuGrid from "./MenuGrid.svelte";
  import LiveQueue from "./LiveQueue.svelte";
  import TimerWidget from "./TimerWidget.svelte";
  import CapyTip from "./CapyTip.svelte";
  import { isCartOpen, cartItems } from "../../../store/cartStore.js";
  import CarritoSidebar from "./CarritoSidebar.svelte";

  const categories = [
    { id: "all", label: "Todo" },
    { id: "almuerzo", label: "Almuerzos" },
    { id: "desayuno", label: "Desayunos" },
    { id: "snack", label: "Snacks" },
    { id: "bebida", label: "Bebidas" },
  ];

  let activeCategory = "all";
  let menuData = null;
  let loading = true;
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
  let isRealtimeSyncing = false;
  const REALTIME_POLL_ACTIVE_MS = 15000;
  const REALTIME_POLL_HIDDEN_MS = 60000;
  const POPULAR_ITEMS_LIMIT = 8;

  $: promotedItems = (() => {
    const source = [
      ...(Array.isArray(menuData?.popularItems) ? menuData.popularItems : []),
      ...(Array.isArray(menuData?.items) ? menuData.items : []),
    ];

    const unique = [];
    const seen = new Set();

    for (const item of source) {
      if (!item || !item.id) continue;
      const key = String(item.id);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    }

    return unique;
  })();

  $: popularItemsForCarousel = Array.isArray(menuData?.popularItems)
    ? menuData.popularItems.slice(0, POPULAR_ITEMS_LIMIT)
    : [];

  $: menuItems = Array.isArray(menuData?.items) ? menuData.items : [];
  $: filteredMenuItems =
    activeCategory === "all"
      ? menuItems
      : menuItems.filter((item) => item?.category === activeCategory);
  $: cartItemsArray = Object.values($cartItems || {});
  $: cartCount = cartItemsArray.reduce(
    (acc, item) => acc + Number(item?.quantity || 0),
    0,
  );
  $: cartTotal = cartItemsArray.reduce(
    (acc, item) => acc + Number(item?.price || 0) * Number(item?.quantity || 0),
    0,
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

  function resolveSketchImage(item, fallbackIndex = 0) {
    const descriptor =
      `${item?.name || ""} ${item?.description || ""} ${item?.category || ""}`.toLowerCase();

    if (
      descriptor.includes("cola") ||
      descriptor.includes("bebida") ||
      descriptor.includes("jugo") ||
      descriptor.includes("refresco")
    ) {
      return "/comedor/cola-sketch.webp";
    }

    if (descriptor.includes("salad") || descriptor.includes("ensalada")) {
      return "/comedor/salad-sketch.jpg";
    }

    if (
      descriptor.includes("burger") ||
      descriptor.includes("hamburg") ||
      descriptor.includes("desay") ||
      descriptor.includes("arepa")
    ) {
      return "/comedor/hamburger-sketch.jpg";
    }

    const fallbackCycle = [
      "/comedor/beef-sketch.jpg",
      "/comedor/hamburger-sketch.jpg",
      "/comedor/salad-sketch.jpg",
    ];
    return fallbackCycle[fallbackIndex % fallbackCycle.length];
  }

  async function loadMenu() {
    loading = true;

    error = null;
    try {
      const response = await fetchAPI(`/comedor/menu`);

      const normalizedItems = Array.isArray(response?.items)
        ? response.items.map((item, i) => ({
            ...item,
            image_url: resolveSketchImage(item, i),
          }))
        : [];

      const normalizedPopularItems = Array.isArray(response?.popularItems)
        ? response.popularItems.map((item, i) => ({
            ...item,
            image_url: resolveSketchImage(item, i),
          }))
        : [];

      const normalizedPlatoDia = response?.platoDia
        ? {
            ...response.platoDia,
            image_url: resolveSketchImage(response.platoDia),
          }
        : null;

      menuData = {
        ...response,
        items: normalizedItems,
        popularItems: normalizedPopularItems,
        platoDia: normalizedPlatoDia,
      };
    } catch (err) {
      error = err.message || "Error al cargar menú";
    } finally {
      loading = false;
    }
  }

  async function loadRealtimeWidgets() {
    if (isRealtimeSyncing) return;
    isRealtimeSyncing = true;

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
    } finally {
      isRealtimeSyncing = false;
    }
  }

  function getRealtimePollMs() {
    if (typeof document !== "undefined" && document.hidden) {
      return REALTIME_POLL_HIDDEN_MS;
    }
    return REALTIME_POLL_ACTIVE_MS;
  }

  function startRealtimePolling() {
    if (realtimeInterval) clearInterval(realtimeInterval);
    realtimeInterval = setInterval(() => {
      if (debugStateOverride) return;
      loadRealtimeWidgets();
    }, getRealtimePollMs());
  }

  function handleVisibilityChange() {
    startRealtimePolling();
    if (!document.hidden && !debugStateOverride) {
      loadRealtimeWidgets();
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
      loadMenu();
      loadRealtimeWidgets();
      startRealtimePolling();

      if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", handleVisibilityChange);
      }
    });
  });

  onDestroy(() => {
    if (realtimeInterval) clearInterval(realtimeInterval);
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    }
  });

  function handleCategoryChange(e) {
    activeCategory = e.detail.category;
  }

  function handleMainPushCategory(e) {
    const category = e?.detail?.category;
    if (!category || category === activeCategory) return;
    activeCategory = category;
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

    <!-- Header actions -->
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

    <!-- Comedor Top Widgets -->
    <CapyTip />

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 comedor-perf-block">
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

    <div class="comedor-perf-block">
      <MainPushDeck
        items={promotedItems}
        on:pickCategory={handleMainPushCategory}
      />
    </div>

    {#if popularItemsForCarousel.length > 0}
      <div class="comedor-perf-block">
        <ProductCarousel
          title="Lo Más Popular"
          items={popularItemsForCarousel}
          variant="popular"
        />
      </div>
    {/if}

    {#if menuData?.platoDia}
      <div class="comedor-perf-block">
        <PlatoDelDiaHero item={menuData.platoDia} />
      </div>
    {/if}

    <CategoriaTabs
      {categories}
      {activeCategory}
      on:change={handleCategoryChange}
    />

    <div class="comedor-perf-block">
      <MenuGrid title="Todo el Menú" items={filteredMenuItems} />
    </div>
  {/if}
</div>

{#if cartCount > 0 && !$isCartOpen}
  <button
    type="button"
    on:click={toggleCart}
    class="fixed z-30 bottom-4 right-4 md:bottom-6 md:right-6 bg-brand-lime border-4 border-black px-3 py-2 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#c4ec35] active:translate-y-0.5 transition-all"
    aria-label="Abrir carrito"
    title="Abrir carrito"
  >
    <div class="flex items-center gap-2">
      <span
        class="material-symbols-outlined shrink-0 text-black font-black"
        style="font-variation-settings: 'FILL' 1, 'wght' 700;"
      >
        shopping_cart
      </span>
      <span class="font-black text-sm tracking-tight"
        >${cartTotal.toFixed(2)}</span
      >
    </div>

    <span
      class="absolute -top-2 -right-2 min-w-6 h-6 px-1 bg-black text-white border-2 border-black rounded-full font-black text-[10px] leading-none flex items-center justify-center"
      aria-hidden="true"
    >
      {cartCount}
    </span>

    <span class="sr-only">
      Abrir carrito con {cartCount} item{cartCount === 1 ? "" : "s"}, total ${cartTotal.toFixed(
        2,
      )}
    </span>
  </button>
{/if}

<CarritoSidebar on:checkout_success={handleCheckoutSuccess} />

<style>
  .comedor-perf-block {
    content-visibility: auto;
    contain: layout paint style;
    contain-intrinsic-size: 720px;
  }

  @media (max-width: 640px) {
    .comedor-perf-block {
      contain-intrinsic-size: 920px;
    }
  }
</style>
