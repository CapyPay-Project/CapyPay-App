<script>
  import { addItemToCart } from "../../../store/cartStore.js";
  import { showToast } from "../../../utils/toast.js";

  export let items = [];
  export let title = "Todo el Menú";

  function handleAdd(item) {
    addItemToCart(item);
    showToast("Añadido", `${item.name} ha sido añadido al carrito.`, "success");
  }
</script>

<div class="flex flex-col gap-4">
  <div class="flex items-center justify-between border-b-4 border-black pb-2">
    <h3 class="font-black uppercase tracking-tighter text-2xl">{title}</h3>
    <span class="text-xs font-black uppercase tracking-[0.2em] text-black/60">
      {items.length} platos
    </span>
  </div>

  {#if items.length === 0}
    <div class="border-4 border-black bg-white p-8 text-center">
      <p class="font-black uppercase">Sin platos para este filtro</p>
      <p class="font-bold text-xs uppercase text-black/60 mt-2">Prueba otra categoría</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {#each items as item}
        <article class="border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 flex flex-col gap-3">
          <div class="h-36 bg-gray-200 border-4 border-black overflow-hidden">
            <img
              src={item.image_url}
              alt={item.name}
              loading="lazy"
              decoding="async"
              class="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>

          <h4 class="font-black text-xl uppercase tracking-tight leading-none">{item.name}</h4>
          <p class="font-bold text-sm uppercase text-black/70 leading-tight line-clamp-2 min-h-11">{item.description}</p>

          <div class="mt-auto flex items-center justify-between gap-3">
            <span class="font-black text-2xl">${Number(item.price).toFixed(2)}</span>
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
  {/if}
</div>
