<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let activeOrder = null;
  export let diningState = "browsing";
  export let waitRange = "-- min";
  export let nextTicket = "---";
  export let turnsAhead = null;

  $: ticketLabel = String(activeOrder?.id ?? "12345").slice(0, 5);

  $: currentTurnLabel =
    turnsAhead === null || turnsAhead === undefined
      ? "--"
      : `T-${String(Math.max(0, Number(turnsAhead))).padStart(4, "0")}`;

  function confirmArrival() {
    dispatch("confirmArrival");
  }
</script>

<div
  class="border-4 border-black bg-brand-purple text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col items-center justify-center relative overflow-hidden group transition-all"
>
  <!-- Efecto de fondo -->
  <div
    class="absolute -right-10 -top-10 opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-700"
  >
    <span class="material-symbols-outlined text-9xl">schedule</span>
  </div>

  {#if diningState === "browsing"}
    <h3 class="font-bold uppercase tracking-widest text-sm mb-2 z-10">
      Tiempo Estimado de Espera
    </h3>

    <div
      class="text-6xl md:text-7xl font-black tracking-tighter tabular-nums z-10 bg-black px-4 py-2 border-4 border-white mb-4"
    >
      {waitRange}
    </div>

    <button
      on:click={() => {
        /* Quick tip action if needed */
      }}
      class="w-full bg-brand-lime text-black border-4 border-black font-black uppercase py-3 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all z-10"
    >
      Próximo: {nextTicket}
    </button>
  {:else if diningState === "pre_arrival"}
    <h3
      class="font-bold uppercase tracking-widest text-sm mb-4 z-10 text-center"
    >
      Ticket <span
        class="bg-black text-[#8CFFE1] px-2 py-0.5 border-2 border-white mx-1"
        >#{ticketLabel}</span
      > Creado
    </h3>
    <button
      on:click={confirmArrival}
      class="w-full bg-[#8CFFE1] text-black border-4 border-black font-black uppercase text-2xl py-6 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 transition-all z-10 animate-bounce"
    >
      ESTOY EN EL COMEDOR
    </button>
    <p class="text-xs font-bold mt-3 z-10">
      Confirma para entrar a la cola de preparación
    </p>
  {:else if diningState === "waiting"}
    <h3
      class="font-bold uppercase text-yellow-300 tracking-widest text-sm mb-2 z-10 animate-pulse"
    >
      Preparando Orden
    </h3>
    <div
      class="flex gap-4 w-full bg-white text-black border-4 border-black p-4 justify-between items-center z-10 my-2"
    >
      <div class="flex flex-col">
        <span class="text-xs font-bold uppercase text-gray-500">Tu Ticket</span>
        <span class="font-black text-2xl">#{ticketLabel}</span>
      </div>
      <div class="h-full w-1.5 bg-black"></div>
      <div class="flex flex-col text-right">
        <span class="text-xs font-bold uppercase text-gray-500"
          >Turno Actual</span
        >
        <span class="font-black text-2xl">{currentTurnLabel}</span>
      </div>
    </div>
  {:else if diningState === "ready"}
    <div class="z-10 flex flex-col items-center w-full text-center">
      <div class="text-6xl mb-2 animate-bounce">🍔</div>
      <h2
        class="text-4xl font-black uppercase text-[#8CFFE1] tracking-tighter mix-blend-screen bg-black px-4 border-4 border-white"
      >
        ¡LISTO!
      </h2>
      <p class="font-bold uppercase mt-4 mb-2 text-lg">
        Acércate a ventanilla 1
      </p>
      <div
        class="bg-white text-black border-4 border-black font-black text-2xl px-6 py-2"
      >
        Ticket: #{ticketLabel}
      </div>
    </div>
  {/if}
</div>
