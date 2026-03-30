# 🐹 CAPYPAY V2 MANIFESTO: NEO-BRUTALIST PROTOCOL

Welcome to the **CapyPay V2: Neo-Brutalist Protocol**. The old ways are gone. The soft shadows are dead. We are building an aggressive, bold, and ultra-performant campus fintech dashboard.

## ✊ The 3 Pillars of V2

1. **Neo-Brutalism Overhaul:** Deep #0f101f blacks, neon #d7fd48 yellows, and vibrant #8b5cf6 purples. Thick order-4 border-black everywhere. Box shadows that don't blur, they hit hard.
2. **Aggressive User Experience (UX):** No more 500 errors crashing the whole page. If one API endpoint drops, the rest of the application survives with robust Promise.allSettled fetching and localized error states.
3. **Gamification & Ecosystem:** Recharges provide $+10$ XP. Tiers are real. An ecosystem of Cantinas, Comedores, and Transport tickets built directly on the robust backend.

---

## 🎨 TRACK 1: NEO-BRUTALISM OVERHAUL (Design & CSS)

- [x] **Finance Recharges:** Converted /finance/recarga to Neo-Brutalist. Includes estimated Capy calculators synced with active exchange rates.
- [x] **Dashboard Overview:** Action buttons, ticker panels, and the main layout transitioned to the new brutalist CSS pattern.
- [x] **Z-Index Layering:** Fixed the floating elements (Notifications popover) to ensure they sit above widgets on the z-axis.
- [ ] **Account Pages (Pending Refactor):** Convert /account/profile, /account/settings, and /account/contacts into the new brutalist standard (thick borders, brutalist tables, rigid shapes).
- [ ] **Animations:** Upgrade standard transitions to punchy -translate-y-1 and hover states with solid offsets (shadow-[4px_4px_0px_0px_#000]).

---

## 🏗️ TRACK 2: BACKEND & GAMIFICATION ARCHITECTURE

- [x] **Database Upgrades:** Executed ALTER TABLE to inject xp, vatar_url, eference_number, and status.
- [x] **Gamification System:** Backend 	ransaccion.controller.js properly yields XP for pending recharges and handles user profiles dynamically.
- [ ] **Approval Panel (Backoffice):** We need a basic admin dashboard view to change transaction statuses from pending -> pproved.
- [ ] **XP Ranks:** Link the XP system directly to the UI badge system. (Nivel 1 = 0 XP, Nivel 2 = 100 XP, etc.)

---

## ⚡ TRACK 3: USER EXPERIENCE (UX) & STABILITY

- [x] **Frontend Resiliency:** Isolated fetching methods in the dashboard and echarge panel so total application failures are prevented.
- [ ] **Contacts System:** Integrate the address book logic inside /account/contacts using the real backend structure rather than just UI stubs.
- [ ] **Toast Overhaul:** Finish standardizing the global 	oast.js system to follow the heavy brutalist styling applied globally rather than per component.
- [ ] **Concurrent Fetching:** Refactor the waterfall pattern inside .astro files. Move towards optimistic UI (show result before DB confirms) and fallback states.
