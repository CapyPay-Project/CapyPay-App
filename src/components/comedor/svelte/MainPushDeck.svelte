<script>
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import { addItemToCart } from "../../../store/cartStore.js";
  import { showToast } from "../../../utils/toast.js";
  import { Flame, Clock3, Sparkles } from "lucide-svelte";

  export let items = [];

  const dispatch = createEventDispatcher();

  let index = 0;
  let rotation = null;
  let swapPulse = false;
  let lastIndex = 0;
  let pulseTimer = null;

  $: safeItems = Array.isArray(items) ? items.slice(0, 3) : [];
  $: current = safeItems[index] || null;
  $: socialProofCount = Number(current?.sales_count || 0);

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
    showToast(
      "Promocion activada",
      `${current.name} fue añadido al carrito.`,
      "success",
    );
  }

  onMount(() => {
    rotation = setInterval(next, 5500);
  });

  onDestroy(() => {
    if (rotation) clearInterval(rotation);
    if (pulseTimer) clearTimeout(pulseTimer);
  });

  $: if (index !== lastIndex) {
    lastIndex = index;
    swapPulse = true;
    if (pulseTimer) clearTimeout(pulseTimer);
    pulseTimer = setTimeout(() => {
      swapPulse = false;
    }, 260);
  }
</script>

{#if current}
  <section
    class="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
  >
    <div
      class="px-4 py-2 border-b-4 border-black bg-[linear-gradient(90deg,#fff4d6_0%,#ffe98b_100%)] flex items-center justify-between gap-3"
    >
      <div class="flex items-center gap-2">
        <Flame size={17} strokeWidth={2.8} />
        <p class="font-black uppercase tracking-tight">Promocion destacada</p>
      </div>
      <div class="flex items-center gap-2 text-xs font-black uppercase">
        <span class="border-2 border-black px-2 py-0.5 bg-[#d7fd48]"
          >Top elegido</span
        >
        <span
          class="border-2 border-black px-2 py-0.5 bg-white inline-flex items-center gap-1"
        >
          <Clock3 size={12} strokeWidth={2.6} />
          Turno rápido
        </span>
      </div>
    </div>

    <div
      class="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] min-h-125 md:min-h-90"
    >
      <div
        class="p-5 md:p-6 border-b-4 md:border-b-0 md:border-r-4 border-black flex flex-col gap-3 bg-[radial-gradient(circle_at_top_left,#ffffff_0%,#fffdf8_55%,#fff4d6_100%)]"
      >
        <p class="text-xs font-black uppercase tracking-[0.2em] text-black/50">
          Destacado {index + 1} de {safeItems.length}
        </p>
        <h3
          class={`font-black text-3xl uppercase tracking-tighter leading-none line-clamp-2 min-h-16 ${swapPulse ? "promo-swap" : ""}`}
        >
          {current.name}
        </h3>
        <p
          class="font-bold uppercase text-sm leading-tight text-black/75 line-clamp-2 min-h-11"
        >
          {current.description}
        </p>

        <div class="flex items-center gap-2 flex-wrap mt-1">
          <button
            type="button"
            on:click={() => selectCategory(current.category)}
            class="border-2 border-black px-2 py-1 bg-[#f0ecff] font-black text-xs uppercase"
          >
            {current.category || "recomendado"}
          </button>
          <span
            class="border-2 border-black px-2 py-1 bg-white font-black text-xs uppercase inline-flex items-center gap-1"
          >
            <Sparkles size={12} strokeWidth={2.6} />
            Recomendado por la casa
          </span>
          <span
            class="border-2 border-black px-2 py-1 bg-[#fff4d6] font-black text-xs uppercase"
          >
            {socialProofCount > 0
              ? `${socialProofCount}+ pedidos`
              : "alta demanda"}
          </span>
        </div>

        <p class="text-xs font-bold uppercase text-black/65">
          {socialProofCount > 0
            ? "Esta promocion se está moviendo rápido hoy"
            : "Rotación fuerte en horas pico"}
        </p>

        <div
          class="mt-auto flex items-center justify-between gap-3 pt-4 border-t-2 border-dashed border-black/40"
        >
          <p class="font-black text-3xl tracking-tight">
            ${Number(current.price || 0).toFixed(2)}
          </p>
          <button
            type="button"
            on:click={pushToCart}
            class="border-4 border-black bg-brand-lime px-4 py-2 min-w-40 font-black uppercase hover:bg-[#c4ec35] active:translate-y-0.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
          >
            Agregar promo
          </button>
        </div>
      </div>

      <div
        class={`h-full bg-[#ede7ff] border-black relative overflow-hidden ${swapPulse ? "promo-swap" : ""}`}
      >
        <div
          class="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.3),transparent_45%)] z-1"
        ></div>
        <img
          src={current.image_url}
          alt={current.name}
          class="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div
          class="absolute bottom-3 right-3 z-2 border-2 border-black bg-white/90 px-2 py-1 text-[10px] font-black uppercase tracking-wide"
        >
          Cupos volando
        </div>
      </div>
    </div>

    <div
      class="px-4 py-3 border-t-4 border-black bg-white flex items-center justify-between gap-4"
    >
      <div class="flex items-center gap-2">
        <button
          type="button"
          on:click={prev}
          class="border-2 border-black px-3 py-1 font-black uppercase text-xs hover:bg-[#f5f5f5]"
          >Anterior</button
        >
        <button
          type="button"
          on:click={next}
          class="border-2 border-black px-3 py-1 font-black uppercase text-xs hover:bg-[#f5f5f5]"
          >Siguiente</button
        >
      </div>

      <div class="flex gap-1.5">
        {#each safeItems as item, i}
          <button
            type="button"
            on:click={() => goTo(i)}
            aria-label={`Ver promo ${i + 1}`}
            class={`w-3 h-3 border-2 border-black ${i === index ? "bg-black" : "bg-transparent"}`}
          ></button>
        {/each}
      </div>
    </div>
  </section>
{/if}

<style>
  .promo-swap {
    animation: promoSwapIn 260ms ease-out;
  }

  @keyframes promoSwapIn {
    0% {
      opacity: 0.9;
      transform: translateY(2px) scale(0.995);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
</style>
