<script>
  export let categories = [];
  export let activeCategory = "all";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  function selectCategory(id) {
    activeCategory = id;
    dispatch("change", { category: id });
  }
</script>

<div class="flex gap-4 overflow-x-auto pb-4 pt-2 px-2 scrollbar-none snap-x">
  {#each categories as cat}
    <button
      on:click={() => selectCategory(cat.id)}
      class="snap-start shrink-0 font-bold uppercase tracking-wider px-6 py-2 border-4 border-black transition-all
             {activeCategory === cat.id
        ? 'bg-brand-purple text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
        : 'bg-white text-black hover:bg-gray-100 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}"
    >
      {cat.label}
    </button>
  {/each}
</div>

<style>
  /* Hide scrollbar for Chrome, Safari and Opera */
  .scrollbar-none::-webkit-scrollbar {
    display: none;
  }
  /* Hide scrollbar for IE, Edge and Firefox */
  .scrollbar-none {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
</style>
