<script>
  import { onMount, onDestroy } from "svelte";

  export let tips = [
    {
      icon: "💡",
      text: "Si compras antes de las 11:00am, obtienes doble Capy-XP.",
    },
    {
      icon: "🥗",
      text: "El menú vegetariano de hoy tiene alta demanda, ¡resérvalo rápido!",
    },
    {
      icon: "⚡",
      text: "Usa el código de descuento CAPY67. (Caiste, aun no hay codigos disponibles)",
    },
    {
      icon: "🎓",
      text: "Tu facultad está a solo 500 XP de tomar el primer lugar.",
    },
    {
      icon: "⏰",
      text: "El tiempo de espera actual es de 12 minutos, ¡perfecto para una siesta rápida!",
    },
    {
      icon: "🔥",
      text: "¡Estás en racha! 3 días comprando seguido, no pierdas tu streak.",
    },
    {
      icon: "📱",
      text: "Si te encuentras a la asistente y haces un triangulo correctamente, quizas te de una recompensa!",
    },
  ];

  $: safeTips =
    Array.isArray(tips) && tips.length > 0
      ? tips
      : [
          {
            icon: "💡",
            text: "Consulta el estado del comedor para optimizar tu compra.",
          },
        ];

  let currentTipIndex = 0;
  let interval;

  $: if (currentTipIndex >= safeTips.length) currentTipIndex = 0;

  onMount(() => {
    interval = setInterval(() => {
      currentTipIndex = (currentTipIndex + 1) % safeTips.length;
    }, 6500);
  });

  onDestroy(() => {
    if (interval) clearInterval(interval);
  });
</script>

<div
  class="bg-[#FFF9F0] border-4 border-black p-3 md:p-4 flex flex-row items-center gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative z-10 w-full mb-6"
>
  <div
    class="w-12 h-12 md:w-14 md:h-14 bg-[#8CFFE1] border-2 border-black flex items-center justify-center text-2xl md:text-3xl shrink-0"
  >
    {safeTips[currentTipIndex].icon}
  </div>
  <div class="flex-1 flex flex-col justify-center min-h-15">
    <span
      class="text-xs font-black uppercase tracking-widest text-black/60 mb-1 block"
      >CAPY TIP DEL DÍA</span
    >
    <p
      class="font-bold text-sm md:text-base leading-tight uppercase text-black line-clamp-2 min-h-10"
    >
      {safeTips[currentTipIndex].text}
    </p>
  </div>
</div>
