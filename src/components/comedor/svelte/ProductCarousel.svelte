<script>
  import { addItemToCart } from "../../../store/cartStore.js";
  import emblaCarouselSvelte from "embla-carousel-svelte";

  export let items = [];
  export let title = "Catálogo";

  let emblaApi;
  const options = { dragFree: true, containScroll: "trimSnaps" };

  function onInit(event) {
    emblaApi = event.detail;
  }

  function handleAdd(item) {
    addItemToCart(item);
  }
</script>

<div class="flex flex-col gap-4">
  <div class="flex items-center justify-between border-b-4 border-black pb-2">
    <h3 class="font-black uppercase tracking-tighter text-2xl">{title}</h3>
  </div>

  <div
    class="overflow-hidden cursor-grab active:cursor-grabbing border-4 border-black bg-white"
    use:emblaCarouselSvelte={{ options }}
    on:emblaInit={onInit}
  >
    <div class="flex">
      {#each items as item}
        <div
          class="flex-[0_0_80%] md:flex-[0_0_40%] lg:flex-[0_0_30%] min-w-0 p-4 border-r-4 border-black last:border-r-0 flex flex-col justify-between"
        >
          <div>
            <div
              class="h-32 bg-gray-200 border-4 border-black mb-4 overflow-hidden"
            >
              <img
                src={item.image_url}
                alt={item.name}
                class="w-full h-full object-cover"
              />
            </div>
            <h4
              class="font-bold text-xl uppercase tracking-tight leading-none mb-2"
            >
              {item.name}
            </h4>
            <p class="text-sm uppercase leading-tight line-clamp-2 mb-4">
              {item.description}
            </p>
          </div>

          <div class="flex justify-between items-center mt-auto">
            <span class="font-black text-xl"
              >${Number(item.price).toFixed(2)}</span
            >
            <button
              on:click={() => handleAdd(item)}
              class="w-10 h-10 flex items-center justify-center bg-brand-lime border-4 border-black hover:bg-[#c4ec35] active:translate-y-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform"
            >
              <span class="font-black">+</span>
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
