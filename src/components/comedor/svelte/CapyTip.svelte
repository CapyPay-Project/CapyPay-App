<script>
  import { onMount, onDestroy } from "svelte";
  import { fade, slide } from "svelte/transition";

  const tips = [
    {
      icon: "💡",
      text: "Si compras antes de las 11:00am, obtienes doble Capy-XP.",
    },
    {
      icon: "🥗",
      text: "El menú vegetariano de hoy tiene alta demanda, ¡resérvalo rápido!",
    },
    { icon: "⚡", text: "Recarga con Yape para saltarte la comisión." },
    {
      icon: "🎓",
      text: "Tu facultad está a solo 500 XP de tomar el primer lugar.",
    },
  ];

  let currentTipIndex = 0;
  let interval;

  onMount(() => {
    interval = setInterval(() => {
      currentTipIndex = (currentTipIndex + 1) % tips.length;
    }, 6000); // Change every 6 seconds
  });

  onDestroy(() => {
    if (interval) clearInterval(interval);
  });
</script>

<div
  class="bg-[#FFF9F0] border-4 border-black p-3 flex items-center gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative z-10 w-full mb-6"
>
  <div
    class="w-12 h-12 bg-[#8CFFE1] border-2 border-black flex items-center justify-center text-2xl flex-shrink-0 animate-bounce"
  >
    {tips[currentTipIndex].icon}
  </div>
  <div class="flex-1 overflow-hidden" transition:slide>
    <span class="text-xs font-black uppercase text-gray-500 mb-0.5 block"
      >CAPY TIP DEL DÍA</span
    >
    {#key currentTipIndex}
      <p
        class="font-bold text-sm leading-tight text-balance flex items-center h-full"
        in:fade={{ duration: 300, delay: 150 }}
      >
        {tips[currentTipIndex].text}
      </p>
    {/key}
  </div>
</div>
