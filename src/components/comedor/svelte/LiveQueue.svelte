<script>
  import { onMount, onDestroy } from "svelte";

  export let capacity = 150;
  export let diningState = "browsing";

  let currentLoad = 45;
  let interval;

  $: loadPercentage = Math.round((currentLoad / capacity) * 100);

  $: status =
    loadPercentage < 40
      ? { text: "FLUIDO", color: "bg-brand-lime" }
      : loadPercentage < 80
        ? { text: "MODERADO", color: "bg-yellow-400" }
        : { text: "LLENO", color: "bg-red-500" };

  onMount(() => {
    // Simular actualizaciones en tiempo real (luego se cambiará a Supabase WebSockets)
    interval = setInterval(() => {
      // Variación aleatoria entre -3 y +5 personas
      const variation = Math.floor(Math.random() * 9) - 3;
      currentLoad = Math.max(0, Math.min(capacity, currentLoad + variation));
    }, 5000);
  });

  onDestroy(() => {
    clearInterval(interval);
  });
</script>

<div
  class="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 flex flex-col gap-2 transition-all"
>
  {#if diningState === "browsing" || diningState === "pre_arrival"}
    <div class="flex justify-between items-center">
      <div class="flex items-center gap-2">
        <div
          class="w-3 h-3 rounded-full bg-green-500 animate-pulse border border-black"
        ></div>
        <h3 class="font-black uppercase tracking-tight">Estado del Comedor</h3>
      </div>
      <div
        class="{status.color} px-3 py-1 border-2 border-black font-bold text-sm tracking-widest text-black"
      >
        {status.text}
      </div>
    </div>

    <div class="flex items-end gap-1 mt-2">
      <span class="font-black text-4xl leading-none">{currentLoad}</span>
      <span class="font-bold text-gray-500 mb-1">/ {capacity} personas</span>
    </div>

    <!-- Barra de progreso Neo-Brutalista -->
    <div
      class="w-full h-6 border-2 border-black bg-gray-200 mt-2 relative overflow-hidden"
    >
      <div
        class="h-full border-r-2 border-black transition-all duration-500 {status.color}"
        style="width: {loadPercentage}%"
      ></div>
    </div>
  {:else}
    <!-- View: Waiting (Kitchen Rhythm) -->
    <div
      class="flex flex-col relative z-10 animate-fade-in bg-[#C4EC35] p-2 -mx-2 -my-2 h-[calc(100%+1rem)] w-[calc(100%+1rem)] border-2 border-black shadow-inner"
    >
      <div class="flex items-center gap-2 mb-2">
        <div class="p-1.5 bg-black text-white px-2">🔥</div>
        <p class="font-black uppercase tracking-widest text-sm">Ritmo Cocina</p>
      </div>

      <div class="grow flex flex-col justify-center mt-2">
        <h3
          class="text-3xl font-black text-black tracking-tight leading-none mb-1 uppercase"
        >
          ALTA DEMANDA
        </h3>
        <span class="text-sm font-bold text-gray-800"
          >Frecuencia de lotes rápida</span
        >
      </div>

      <div class="mt-4">
        <div
          class="bg-white border-2 border-black p-2.5 flex items-center gap-3 w-full"
        >
          <span class="relative flex h-3 w-3">
            <span
              class="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-purple opacity-75"
            ></span>
            <span
              class="relative inline-flex rounded-full h-3 w-3 bg-brand-purple border border-black"
            ></span>
          </span>
          <span class="text-xs text-black uppercase font-black tracking-wide">
            Produciendo a tope
          </span>
        </div>
      </div>
    </div>
  {/if}
</div>
