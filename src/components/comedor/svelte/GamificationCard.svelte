<script>
  import { onMount } from "svelte";

  // Simulation states
  export let xp = 3450;
  export let nextLevelXp = 5000;
  export let level = 12;
  export let faculty = "Ingeniería";
  export let facultyRank = 1;
  export let streak = 5; // Dias comprando seguido

  $: progressPercentage = (xp / nextLevelXp) * 100;
</script>

<div
  class="bg-[#E4C1F9] border-4 border-black p-4 relative overflow-hidden group shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex flex-col justify-between"
>
  <!-- Background Pattern -->
  <div
    class="absolute inset-0 opacity-10 pointer-events-none"
    style="background-image: radial-gradient(#000 2px, transparent 2px); background-size: 16px 16px;"
  ></div>

  <!-- Header -->
  <div class="flex justify-between items-start mb-4 relative z-10">
    <div>
      <h3
        class="font-black text-2xl tracking-tighter uppercase leading-none mb-1"
      >
        Lvl. {level}
      </h3>
      <p
        class="font-bold text-sm uppercase px-2 py-0.5 bg-black text-white inline-block border-2 border-black"
      >
        {faculty}
      </p>
    </div>

    <!-- Streak Badge -->
    <div
      class="bg-[#FF90E8] border-2 border-black px-2 py-1 flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform rotate-3"
    >
      <span class="text-xl">🔥</span>
      <span class="font-black text-lg">{streak}</span>
    </div>
  </div>

  <!-- Progress Bar -->
  <div class="relative z-10 mb-4">
    <div class="flex justify-between text-xs font-bold uppercase mb-1">
      <span>Capy Experiencia</span>
      <span>{xp} / {nextLevelXp} XP</span>
    </div>
    <div
      class="h-4 w-full bg-white border-2 border-black rounded-full overflow-hidden"
    >
      <div
        class="h-full bg-[#FFD700] border-r-2 border-black transition-all duration-1000 ease-out"
        style="width: {progressPercentage}%"
      ></div>
    </div>
  </div>

  <!-- Footer Stats -->
  <div
    class="flex justify-between border-t-4 border-black pt-3 mt-auto relative z-10"
  >
    <div>
      <span class="block text-xs font-bold uppercase">Ranking Facultad</span>
      <span class="font-black text-xl">#{facultyRank} 🏆</span>
    </div>
    <div class="text-right">
      <span class="block text-xs font-bold uppercase">Próximo Rango</span>
      <span class="font-black text-sm text-gray-700">1550 XP</span>
    </div>
  </div>
</div>
