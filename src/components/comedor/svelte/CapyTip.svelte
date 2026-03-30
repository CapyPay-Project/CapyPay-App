<script>
  import { onMount, onDestroy } from "svelte";
  import { fade } from "svelte/transition";

  const tips = [
    {
      icon: "💡",
      text: "Si compras antes de las 11:00am, obtienes doble Capy-XP.",
    },
    {
      icon: "🥗",
      text: "El menú vegetariano de hoy tiene alta demanda, ¡resérvalo rápido!",
    },
    { icon: "⚡", text: "Usa el código de descuento CAPY67. (Caiste, aun no hay codigos disponibles)" },
    {
      icon: "🎓",
      text: "Tu facultad está a solo 500 XP de tomar el primer lugar.",
    },
    {
      icon: "⏰",
      text: "El tiempo de espera actual es de 12 minutos, ¡perfecto para una siesta rápida!",
    },
    { icon: "🔥",
    text: "¡Estás en racha! 3 días comprando seguido, no pierdas tu streak."
    },
    { icon: "📱",
    text: "Si te encuentras a la asistente y haces un triangulo correctamente, quizas te de una recompensa!"
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
  class="bg-[#FFF9F0] border-4 border-black p-3 md:p-4 flex flex-row items-center gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all relative z-10 w-full mb-6"
>
  <div
    class="w-12 h-12 md:w-14 md:h-14 bg-[#8CFFE1] border-2 border-black flex items-center justify-center text-2xl md:text-3xl flex-shrink-0 animate-bounce"
  >
    {tips[currentTipIndex].icon}
  </div>
  <div class="flex-1 flex flex-col justify-center min-h-[3rem]">
    <span class="text-xs font-black uppercase tracking-widest text-black/60 mb-1 block"
      >CAPY TIP DEL DÍA</span
    >
    <div class="relative w-full">
      {#key currentTipIndex}
        <p
          class="font-bold text-sm md:text-base leading-tight uppercase text-black"
          in:fade={{ duration: 300, delay: 150 }}
        >
          {tips[currentTipIndex].text}
        </p>
      {/key}
    </div>
  </div>
</div>
