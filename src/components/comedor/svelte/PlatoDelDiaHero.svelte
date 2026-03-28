<script>
  export let item = {
    name: "Cargando...",
    description: "Espere un momento.",
    price: 0,
    image_url: "/images/cantina/default.png",
  };

  import { addItemToCart } from "../../../store/cartStore.js";
  import { showToast } from "../../../utils/toast.js";

  function handleAdd() {
    if (item.id || item.name !== "Cargando...") {
      addItemToCart(item);
      showToast("Añadido", `${item.name} añadido al carrito`, "success");
    }
  }
</script>

<div
  class="relative overflow-hidden bg-brand-lime border-4 border-black p-6 flex flex-col md:flex-row gap-6 items-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 group"
>
  <div
    class="absolute top-0 right-0 bg-black text-white font-black px-4 py-1 tracking-widest text-sm border-b-4 border-l-4 border-black"
  >
    PLATO DEL DÍA
  </div>

  <div
    class="w-32 h-32 md:w-48 md:h-48 shrink-0 bg-white border-4 border-black overflow-hidden object-cover relative"
  >
    <img
      src={item.image_url}
      alt={item.name}
      loading="eager"
      decoding="async"
      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 transform-gpu will-change-transform"
      data-testid="hero-image"
    />
  </div>

  <div class="flex-1 flex flex-col gap-2 w-full">
    <h2
      class="font-black text-3xl uppercase tracking-tighter leading-none border-b-4 border-black pb-2"
    >
      {item.name}
    </h2>
    <p class="font-bold text-lg leading-tight uppercase text-black/80">
      {item.description}
    </p>

    <div class="mt-auto pt-4 flex justify-between items-center gap-4">
      <span
        class="font-black text-3xl tracking-tighter bg-white px-3 py-1 border-2 border-black -rotate-2"
      >
        ${Number(item.price).toFixed(2)}
      </span>

      <button
        on:click={handleAdd}
        class="bg-black text-white border-2 border-transparent px-6 py-2 font-black uppercase hover:bg-white hover:text-black hover:border-black active:scale-95 transition-all text-xl shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group/btn flex items-center gap-2"
      >
        <span>Añadir</span>
        <span
          class="text-2xl leading-none font-bold group-hover/btn:rotate-180 transition-transform duration-300 inline-block"
          >+</span
        >
      </button>
    </div>
  </div>
</div>
