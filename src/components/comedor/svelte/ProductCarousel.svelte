<script>
  import { addItemToCart } from "../../../store/cartStore.js";
  import emblaCarouselSvelte from "embla-carousel-svelte";
  import Autoplay from "embla-carousel-autoplay";
  import { showToast } from "../../../utils/toast.js";

  export let items = [];
  export let title = "Catálogo";

  let emblaApi;
  const options = { dragFree: true, containScroll: "trimSnaps" };
  const plugins = [Autoplay({ delay: 3000, stopOnInteraction: true })];

  let selectedIndex = 0;
  let scrollSnaps = [];

  function onInit(event) {
    emblaApi = event.detail;
    scrollSnaps = emblaApi.scrollSnapList();

    emblaApi.on("select", () => {
      selectedIndex = emblaApi.selectedScrollSnap();
    });
  }

  function handleAdd(item) {
    addItemToCart(item);
    showToast("Añadido", `${item.name} ha sido añadido al carrito.`, "success");
  }

  function scrollTo(index) {
    if (emblaApi) {
      emblaApi.scrollTo(index);
    }
  }
</script>

<div class="flex flex-col gap-4">
  <div class="flex items-center justify-between border-b-4 border-black pb-2">
    <h3 class="font-black uppercase tracking-tighter text-2xl">{title}</h3>

    <!-- Dots -->
    {#if scrollSnaps.length > 1}
      <div class="flex gap-2">
        {#each scrollSnaps as _, i}
          <button
            on:click={() => scrollTo(i)}
            class="w-3 h-3 rounded-full border-2 border-black transition-colors {i ===
            selectedIndex
              ? 'bg-black'
              : 'bg-transparent'}"
            aria-label="Ir a diapositiva {i + 1}"
          ></button>
        {/each}
      </div>
    {/if}
  </div>

  <div
    class="overflow-hidden cursor-grab active:cursor-grabbing border-4 border-black bg-white"
    use:emblaCarouselSvelte={{ options, plugins }}
    on:emblaInit={onInit}
    style="transform: translateZ(0);"
  >
    <div
      class="flex will-change-transform"
      style="backface-visibility: hidden; -webkit-backface-visibility: hidden;"
    >
      {#each items as item}
        <div
          class="flex-[0_0_80%] md:flex-[0_0_40%] lg:flex-[0_0_30%] min-w-0 p-4 border-r-4 border-black last:border-r-0 flex flex-col justify-between"
        >
          <div>
            <div
              class="h-32 bg-gray-200 border-4 border-black mb-4 overflow-hidden relative group"
            >
              <img
                src={item.image_url}
                alt={item.name}
                loading="lazy"
                decoding="async"
                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 transform-gpu will-change-transform"
              />
            </div>
            <h4
              class="font-bold text-xl uppercase tracking-tight leading-none mb-2"
            >
              {item.name}
            </h4>
            <p
              class="text-sm uppercase leading-tight line-clamp-2 mb-4 font-bold text-black/70"
            >
              {item.description}
            </p>
          </div>

          <div class="flex justify-between items-center mt-auto">
            <span class="font-black text-xl"
              >${Number(item.price).toFixed(2)}</span
            >
            <button
              on:click={() => handleAdd(item)}
              title="Añadir a carrito"
              class="w-10 h-10 flex items-center justify-center bg-brand-lime border-4 border-black hover:bg-[#c4ec35] hover:scale-110 active:scale-90 active:bg-black active:text-brand-lime shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] transition-all"
            >
              <span class="font-black text-xl leading-none">+</span>
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
