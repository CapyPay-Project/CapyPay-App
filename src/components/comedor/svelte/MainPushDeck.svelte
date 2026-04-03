<script>
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import { addItemToCart } from "../../../store/cartStore.js";
  import { showToast } from "../../../utils/toast.js";
  import { Flame, Clock3, Sparkles } from "lucide-svelte";

  export let items = [];

  const dispatch = createEventDispatcher();

  let index = 0;
  let rotation = null;

  $: safeItems = Array.isArray(items) ? items.slice(0, 3) : [];
  $: current = safeItems[index] || null;

  function next() {
    if (safeItems.length === 0) return;
    index = (index + 1) % safeItems.length;
  }

  function prev() {
    if (safeItems.length === 0) return;
    index = (index - 1 + safeItems.length) % safeItems.length;
  }

  function goTo(i) {
    index = i;
  }

  function selectCategory(category) {
    if (!category) return;
    dispatch("pickCategory", { category });
  }

  function pushToCart() {
    if (!current) return;
    addItemToCart(current);
    showToast("Main push activado", `${current.name} fue añadido al carrito.`, "success");
  }

  onMount(() => {
    rotation = setInterval(next, 5500);
  });

  onDestroy(() => {
    if (rotation) clearInterval(rotation);
  });
</script>

{#if current}
  <section class="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
    <div class="px-4 py-2 border-b-4 border-black bg-[#fff4d6] flex items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <Flame size={17} strokeWidth={2.8} />
        <p class="font-black uppercase tracking-tight">Main Push Promocionado</p>
      </div>
      <div class="flex items-center gap-2 text-xs font-black uppercase">
        <span class="border-2 border-black px-2 py-0.5 bg-[#d7fd48]">Top elegido</span>
        <span class="border-2 border-black px-2 py-0.5 bg-white inline-flex items-center gap-1">
          <Clock3 size={12} strokeWidth={2.6} />
          Turno rápido
        </span>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2">
      <div class="p-5 md:p-6 border-b-4 md:border-b-0 md:border-r-4 border-black flex flex-col gap-3">
        <p class="text-xs font-black uppercase tracking-[0.2em] text-black/50">Push {index + 1} de {safeItems.length}</p>
        <h3 class="font-black text-3xl uppercase tracking-tighter leading-none">{current.name}</h3>
        <p class="font-bold uppercase text-sm leading-tight text-black/75">{current.description}</p>

        <div class="flex items-center gap-2 flex-wrap mt-1">
          <button
            type="button"
            on:click={() => selectCategory(current.category)}
            class="border-2 border-black px-2 py-1 bg-[#f0ecff] font-black text-xs uppercase"
          >
            {current.category || "recomendado"}
          </button>
          <span class="border-2 border-black px-2 py-1 bg-white font-black text-xs uppercase inline-flex items-center gap-1">
            <Sparkles size={12} strokeWidth={2.6} />
            Recomendado por la casa
          </span>
        </div>

        <div class="mt-auto flex items-center justify-between gap-3 pt-3">
          <p class="font-black text-3xl tracking-tight">${Number(current.price || 0).toFixed(2)}</p>
          <button
            type="button"
            on:click={pushToCart}
            class="border-4 border-black bg-brand-lime px-4 py-2 font-black uppercase hover:bg-[#c4ec35] active:translate-y-0.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
          >
            Agregar push
          </button>
        </div>
      </div>

      <div class="h-64 md:h-auto bg-[#ede7ff] border-black relative overflow-hidden">
        <img
          src={current.image_url}
          alt={current.name}
          class="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>

    <div class="px-4 py-3 border-t-4 border-black bg-white flex items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <button type="button" on:click={prev} class="border-2 border-black px-3 py-1 font-black uppercase text-xs hover:bg-[#f5f5f5]">Anterior</button>
        <button type="button" on:click={next} class="border-2 border-black px-3 py-1 font-black uppercase text-xs hover:bg-[#f5f5f5]">Siguiente</button>
      </div>

      <div class="flex gap-1.5">
        {#each safeItems as item, i}
          <button
            type="button"
            on:click={() => goTo(i)}
            aria-label={`Ver push ${i + 1}`}
            class={`w-3 h-3 border-2 border-black ${i === index ? "bg-black" : "bg-transparent"}`}
          ></button>
        {/each}
      </div>
    </div>
  </section>
{/if}
