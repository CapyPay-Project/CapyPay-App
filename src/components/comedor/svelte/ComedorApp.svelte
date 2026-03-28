<script>
  import { onMount } from "svelte";
  import { fetchAPI } from "../../../services/api.js";
  import PlatoDelDiaHero from "./PlatoDelDiaHero.svelte";
  import CategoriaTabs from "./CategoriaTabs.svelte";
  import ProductCarousel from "./ProductCarousel.svelte";
  import LiveQueue from "./LiveQueue.svelte";
  import TimerWidget from "./TimerWidget.svelte";
  import CapyTip from "./CapyTip.svelte";
  import { isCartOpen } from "../../../store/cartStore.js";
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

  async function loadMenu(category) {
    loading = true;
    error = null;
    try {
      const qs = category && category !== "all" ? `?category=${category}` : "";
      const response = await fetchAPI(`/comedor/menu${qs}`);
      menuData = response;
    } catch (err) {
      error = err.message || "Error al cargar menú";
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadMenu(activeCategory);
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
    diningState = "pre_arrival"; // Require user to confirm arrival next
  }

  function handleConfirmArrival() {
    diningState = "waiting";
    // Usually would send a ping to backend here, mocking for now:
    setTimeout(() => {
      diningState = "ready";
    }, 10000); // 10 sec wait for mock readiness
  }
</script>

<div class="max-w-6xl mx-auto w-full flex flex-col gap-8 pb-32 relative">
  <!-- FIX: Dev Tool Panel so the user can test the states easily -->
  <div class="bg-gray-100 border-4 border-dashed border-red-500 p-4 mb-4 mt-4">
    <h3 class="font-black text-red-600 uppercase mb-2">
      Panel de Pruebas (Dev)
    </h3>
    <div class="flex flex-wrap gap-2">
      <button
        on:click={() => (diningState = "browsing")}
        class="bg-white border-2 border-black px-2 py-1 text-sm font-bold {diningState ===
        'browsing'
          ? 'bg-black text-white'
          : ''}">Browsing</button
      >
      <button
        on:click={() => {
          diningState = "pre_arrival";
          activeOrder = { id: "TEST-1234" };
        }}
        class="bg-white border-2 border-black px-2 py-1 text-sm font-bold {diningState ===
        'pre_arrival'
          ? 'bg-black text-white'
          : ''}">Pre-Arrival</button
      >
      <button
        on:click={() => (diningState = "waiting")}
        class="bg-white border-2 border-black px-2 py-1 text-sm font-bold {diningState ===
        'waiting'
          ? 'bg-black text-white'
          : ''}">Waiting</button
      >
      <button
        on:click={() => (diningState = "ready")}
        class="bg-white border-2 border-black px-2 py-1 text-sm font-bold {diningState ===
        'ready'
          ? 'bg-black text-white'
          : ''}">Ready</button
      >
    </div>
  </div>

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

  {#if loading}
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
      <LiveQueue {diningState} on:confirmArrival={handleConfirmArrival} />
      <TimerWidget
        {diningState}
        {activeOrder}
        on:confirmArrival={handleConfirmArrival}
      />
    </div>

    <!-- Go to Ranking Link -->
    <div class="w-full flex justify-end mb-6">
      <a
        href="/account/ranking"
        class="bg-[#E4C1F9] border-4 border-black px-6 py-3 font-black uppercase text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all flex items-center gap-2"
      >
        <span>🏆</span> Ver Ranking y Recompensas
      </a>
    </div>

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
  {/if}
</div>

<CarritoSidebar on:checkout_success={handleCheckoutSuccess} />
