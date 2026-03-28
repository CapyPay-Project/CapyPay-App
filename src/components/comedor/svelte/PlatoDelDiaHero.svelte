<script>
  export let item = {
    name: "Cargando...",
    description: "Espere un momento.",
    price: 0,
    image_url: "/images/cantina/default.png",
  };

  import { addItemToCart } from "../../../store/cartStore.js";

  function handleAdd() {
    addItemToCart(item);
  }
</script>

<div
  class="relative overflow-hidden bg-[#D7FD49] border-4 border-black p-6 flex flex-col md:flex-row gap-6 items-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
>
  <div
    class="absolute top-0 right-0 bg-black text-white font-black px-4 py-1 tracking-widest text-sm border-b-4 border-l-4 border-black"
  >
    PLATO DEL DÍA
  </div>

  <div
    class="w-32 h-32 md:w-48 md:h-48 shrink-0 bg-white border-4 border-black overflow-hidden object-cover"
  >
    <img
      src={item.image_url}
      alt={item.name}
      class="w-full h-full object-cover"
      data-testid="hero-image"
    />
  </div>

  <div class="flex-1 flex flex-col gap-2 w-full">
    <h2
      class="font-black text-3xl uppercase tracking-tighter leading-none border-b-4 border-black pb-2"
    >
      {item.name}
    </h2>
    <p class="font-medium text-lg leading-tight uppercase">
      {item.description}
    </p>

    <div class="mt-auto pt-4 flex justify-between items-center gap-4">
      <span class="font-black text-2xl tracking-tighter">
        ${Number(item.price).toFixed(2)}
      </span>

      <button
        on:click={handleAdd}
        class="bg-black text-white px-6 py-2 font-bold uppercase hover:bg-gray-800 active:translate-y-1 transition-transform border-2 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
      >
        + Add
      </button>
    </div>
  </div>
</div>
