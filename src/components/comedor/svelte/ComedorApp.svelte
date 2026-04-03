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

  $: fallbackPromotedItems = [
    {
      id: "fallback-1",
      name: "Combo Bandeja Plus",
      description: "Proteina + arroz + jugo con salida prioritaria.",
      price: 35,
      category: "almuerzo",
      image_url: "/images/cantina/empanadas.webp",
    },
    {
      id: "fallback-2",
      name: "Desayuno Turbo",
      description: "Arepa rellena + bebida caliente para primera hora.",
      price: 20,
      category: "desayuno",
      image_url: "/images/cantina/sandwich.jpg",
    },
    {
      id: "fallback-3",
      name: "Snack Reload",
      description: "Mini combo para recargar energia antes de clase.",
      price: 14,
      category: "snack",
      image_url: "/images/cantina/empanada.jpg",
    },
  ];

  $: promotedItems = (() => {
    const source = [
      ...(Array.isArray(menuData?.popularItems) ? menuData.popularItems : []),
      ...(Array.isArray(menuData?.items) ? menuData.items : []),
    ];

    const unique = [];
    const seen = new Set();

    for (const item of source) {
      const key = String(item?.id || item?.name || "");
      if (!key || seen.has(key)) continue;
      seen.add(key);
      unique.push(item);
      if (unique.length >= 3) break;
    }

    if (unique.length >= 3) return unique;

    for (const fallback of fallbackPromotedItems) {
      const key = String(fallback.id);
      if (seen.has(key)) continue;
      unique.push(fallback);
      if (unique.length >= 3) break;
    }

    return unique;
  })();

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

  async function loadMenu() {
    loading = true;

    error = null;
    try {
      const response = await fetchAPI(`/comedor/menu`);
      menuData = response;
    } catch (err) {
      error = err.message || "Error al cargar menú";
    } finally {
      loading = false;
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
      loadMenu();
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

    <MainPushDeck items={promotedItems} on:pickCategory={handleMainPushCategory} />

    {#if menuData?.popularItems?.length > 0}
      <ProductCarousel title="Lo Más Popular" items={menuData.popularItems} variant="popular" />
    {/if}

    {#if menuData?.platoDia}
      <PlatoDelDiaHero item={menuData.platoDia} />
    {/if}

    <CategoriaTabs
      {categories}
      {activeCategory}
      on:change={handleCategoryChange}
    />

    <MenuGrid title="Todo el Menú" items={filteredMenuItems} />

  {/if}
</div>

{#if cartCount > 0 && !$isCartOpen}
  <button
    type="button"
    on:click={toggleCart}
    class="fixed z-30 bottom-5 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-auto bg-brand-lime border-4 border-black px-4 py-3 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:bg-[#c4ec35] active:translate-y-0.5 transition-all"
    aria-label="Abrir carrito"
  >
    <div class="flex items-center justify-between gap-4 md:min-w-[17rem]">
      <div class="flex items-center gap-2">
        <span
          class="material-symbols-outlined shrink-0 text-black font-black"
          style="font-variation-settings: 'FILL' 1, 'wght' 700;"
        >
          shopping_cart
        </span>
        <span class="font-black uppercase text-sm tracking-tight">Ver carrito</span>
      </div>

      <div class="flex items-center gap-2">
        <span class="bg-black text-white border-2 border-black px-2 py-0.5 font-black text-xs uppercase">
          {cartCount} item{cartCount === 1 ? "" : "s"}
        </span>
        <span class="font-black text-base">${cartTotal.toFixed(2)}</span>
      </div>
    </div>
  </button>
{/if}

<CarritoSidebar on:checkout_success={handleCheckoutSuccess} />
