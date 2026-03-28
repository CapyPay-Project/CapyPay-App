<script>
  import {
    cartItems,
    removeItemFromCart,
    addItemToCart,
    isCartOpen,
    clearCart,
  } from "../../../store/cartStore.js";
  import { fly, slide } from "svelte/transition";
  import { showToast } from "../../../utils/toast.js";
  import { fetchAPI } from "../../../services/api.js";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  $: itemsArray = Object.values($cartItems);
  $: total = itemsArray.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );

  let isCheckingOut = false;

  function closeCart() {
    $isCartOpen = false;
  }

  async function handleCheckout() {
    if (itemsArray.length === 0) return;
    isCheckingOut = true;

    try {
      // Map formatting for backend: [{ id, quantity }]
      const payloadItems = itemsArray.map((i) => ({
        id: i.id,
        quantity: i.quantity,
      }));

      const response = await fetchAPI("/comedor/order", {
        method: "POST",
        body: JSON.stringify({ items: payloadItems }),
      });

      if (response && response.order) {
        showToast("¡COMPRA EXITOSA!", "Tu orden ha sido procesada.", "success");
        clearCart();
        closeCart();
        // Dispatch to ComedorApp so it updates the state
        dispatch("checkout_success", { order: response.order });
      } else {
        throw new Error("Respuesta inválida del servidor");
      }
    } catch (err) {
      showToast(
        "ERROR EN LA COMPRA",
        err.message || "Revisa tu conexión o saldo.",
        "error",
      );
    } finally {
      isCheckingOut = false;
    }
  }
</script>

{#if $isCartOpen}
  <!-- Backdrop (visible on all screens now to focus on the cart) -->
  <div
    class="fixed inset-0 bg-black/50 z-40 transition-opacity"
    on:click={closeCart}
    on:keydown={(e) => e.key === "Escape" && closeCart()}
    role="button"
    tabindex="0"
    transition:fly={{ duration: 200, opacity: 0 }}
  ></div>

  <!-- Sidebar -->
  <aside
    class="fixed top-0 right-0 h-full w-full max-w-md bg-[#FFF9F0] border-l-8 border-black z-50 flex flex-col shadow-[-8px_0px_0px_0px_rgba(0,0,0,1)]"
    transition:fly={{ x: 400, duration: 300 }}
  >
    <!-- Header -->
    <div
      class="p-6 border-b-8 border-black bg-brand-lime flex justify-between items-center"
    >
      <h2 class="font-black text-3xl tracking-tighter uppercase">TU ORDEN</h2>
      <button
        on:click={closeCart}
        class="w-10 h-10 bg-white border-4 border-black font-black flex items-center justify-center hover:bg-gray-100 active:translate-y-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
      >
        X
      </button>
    </div>

    <!-- Items -->
    <div class="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
      {#if itemsArray.length === 0}
        <div
          class="flex-1 flex items-center justify-center text-center p-8 border-4 border-dashed border-black"
        >
          <p class="font-bold uppercase text-xl">Tu bandeja está vacía</p>
        </div>
      {:else}
        {#each itemsArray as item (item.id)}
          <div
            class="bg-white border-4 border-black p-4 flex gap-4 items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            transition:slide
          >
            <div class="flex-1">
              <h4 class="font-bold uppercase tracking-tight leading-none mb-1">
                {item.name}
              </h4>
              <p class="font-black">${Number(item.price).toFixed(2)}</p>
            </div>

            <div class="flex items-center gap-3">
              <button
                on:click={() => removeItemFromCart(item.id)}
                class="w-8 h-8 flex items-center justify-center bg-gray-200 border-2 border-black font-bold active:translate-y-1"
                >-</button
              >
              <span class="font-black text-lg w-4 text-center"
                >{item.quantity}</span
              >
              <button
                on:click={() => addItemToCart(item)}
                class="w-8 h-8 flex items-center justify-center bg-brand-lime border-2 border-black font-bold active:translate-y-1"
                >+</button
              >
            </div>
          </div>
        {/each}
      {/if}
    </div>

    <!-- Footer checkout -->
    <div class="p-6 border-t-8 border-black bg-white">
      <div class="flex justify-between items-end mb-4">
        <span class="font-bold uppercase text-lg">Total</span>
        <span class="font-black text-4xl tracking-tighter"
          >${total.toFixed(2)}</span
        >
      </div>
      <button
        on:click={handleCheckout}
        class="w-full bg-brand-purple text-white font-black text-2xl uppercase py-4 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-2 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={itemsArray.length === 0 || isCheckingOut}
      >
        {isCheckingOut ? "PROCESANDO..." : "PAGAR AHORA"}
      </button>
    </div>
  </aside>
{/if}
