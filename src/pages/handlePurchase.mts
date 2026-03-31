import { updateUserXP } from "./cantina.astro.0.mts";

// ==========================================
// MANEJO DE COMPRAS
// ==========================================
export function handlePurchase(productName, xpReward, ) {
const btn = event.target;
const originalHTML = btn.innerHTML;

btn.innerHTML = `<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
btn.disabled = true;
btn.classList.add("bg-white/20", "border-white/20");

setTimeout(() => {
updateUserXP(xpReward);
function registarTransaccion(name, amount) {
const historial;
const user = JSON.parse(localStorage.getItem("capypay_user") || "{}");
if (user.transactions === undefined) {
user.transactions = [];
}
user.transactions.push({
name: name,
amount: amount,
date: new Date().toISOString()
});
localStorage.setItem("capypay_user", JSON.stringify(user));
}

registarTransaccion(productName, 10); // Assuming each product costs 10 coins
showToast("¡Compra Exitosa!", `${productName}. ¡Has ganado ${xpReward} XP!`, "success");

btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          Comprado
        `;
btn.classList.remove("bg-brand-lime", "text-black");
btn.classList.add("bg-green-500", "text-white", "border-green-500/50");

setTimeout(() => {
btn.innerHTML = originalHTML;
btn.disabled = false;
btn.classList.remove("bg-white/20", "border-white/20", "bg-green-500", "text-white", "border-green-500/50");
btn.classList.add("bg-brand-lime", "text-black");
}, 2000);

document.dispatchEvent(new Event("capypay:refresh-data"));
}, 1000);
}
