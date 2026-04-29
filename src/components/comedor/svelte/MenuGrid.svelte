<script>
  import { onMount, onDestroy } from "svelte";
  import { addItemToCart } from "../../../store/cartStore.js";
  import { showToast } from "../../../utils/toast.js";

  export let items = [];
  export let title = "Todo el Menú";
  export let lazyReveal = true;

  const BATCH_SIZE = 6;
  let visibleCount = BATCH_SIZE;
  let sentinelEl;
  let observer;

  $: safeItems = Array.isArray(items) ? items : [];
  $: visibleItems = lazyReveal ? safeItems.slice(0, visibleCount) : safeItems;
  $: hasMore = lazyReveal && visibleCount < safeItems.length;

  $: if (lazyReveal) {
    // Reset reveal when item set changes (e.g., category change).
    visibleCount = Math.min(
      Math.max(BATCH_SIZE, visibleCount),
      safeItems.length || BATCH_SIZE,
    );
  }

  // Ensure first render after a filter switch starts from the first batch.
  let lastItemsRef = items;
  $: if (items !== lastItemsRef) {
    lastItemsRef = items;
    visibleCount = BATCH_SIZE;
  }

  function revealMore() {
    visibleCount = Math.min(visibleCount + BATCH_SIZE, safeItems.length);
  }

  function handleAdd(item) {
    addItemToCart(item);
    showToast("Añadido", `${item.name} ha sido añadido al carrito.`, "success");
  }

  onMount(() => {
    observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && hasMore) {
          revealMore();
        }
      },
      { rootMargin: "220px 0px" },
    );

    if (sentinelEl) observer.observe(sentinelEl);
  });

  onDestroy(() => {
    if (observer) observer.disconnect();
  });
</script>

<div class="flex flex-col gap-4">
  <div class="flex items-center justify-between border-b-4 border-black pb-2">
    <h3 class="font-black uppercase tracking-tighter text-2xl">{title}</h3>
    <span class="text-xs font-black uppercase tracking-[0.2em] text-black/60">
      {visibleItems.length} / {safeItems.length} platos
    </span>
  </div>

  {#if safeItems.length === 0}
    <div class="border-4 border-black bg-white p-8 text-center">
      <p class="font-black uppercase">Sin platos para este filtro</p>
      <p class="font-bold text-xs uppercase text-black/60 mt-2">
        Prueba otra categoría
      </p>
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {#each visibleItems as item (item.id)}
        <article
          class="border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 flex flex-col gap-3 min-h-90"
        >
          <div class="h-36 bg-gray-200 border-4 border-black overflow-hidden">
            <img
              src={item.image_url}
              alt={item.name}
              loading="lazy"
              decoding="async"
              fetchpriority="low"
              width="640"
              height="480"
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
              class="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>

          <h4
            class="font-black text-xl uppercase tracking-tight leading-none line-clamp-2 min-h-[3.2rem]"
          >
            {item.name}
          </h4>
          <p
            class="font-bold text-sm uppercase text-black/70 leading-tight line-clamp-2 min-h-11"
          >
            {item.description}
          </p>

          <div class="mt-auto flex items-center justify-between gap-3">
            <span class="font-black text-2xl"
              >${Number(item.price).toFixed(2)}</span
            >
            <button
              type="button"
              on:click={() => handleAdd(item)}
              class="border-4 border-black bg-brand-lime px-3 py-2 font-black uppercase text-xs hover:bg-[#c4ec35] active:translate-y-0.5"
            >
              Añadir
            </button>
          </div>
        </article>
      {/each}
    </div>

    {#if hasMore}
      <div class="mt-5 flex flex-col items-center gap-3">
        <button
          type="button"
          on:click={revealMore}
          class="border-4 border-black bg-white px-4 py-2 font-black uppercase text-sm hover:bg-[#f5f5f5]"
        >
          Cargar más platos
        </button>
        <div bind:this={sentinelEl} class="w-full h-2" aria-hidden="true"></div>
      </div>
    {/if}
  {/if}
</div>
