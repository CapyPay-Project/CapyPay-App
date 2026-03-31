import { atom } from "nanostores";

export interface TicketBusTicket {
  id_unico: string;
  destino: string;
  bus: string;
  fecha: string;
  hora: string;
  expira?: string;
  [key: string]: unknown;
}

const STORAGE_KEY = "misTicketsCapyPay";

let isInitialized = false;

export const ticketsStore = atom<TicketBusTicket[]>([]);

function hasBrowserStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function sanitizeTickets(raw: unknown): TicketBusTicket[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item) => item && typeof item === "object") as TicketBusTicket[];
}

ticketsStore.subscribe((tickets) => {
  if (!isInitialized || !hasBrowserStorage()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  } catch {
    // Ignore quota/storage errors to avoid breaking UI interactions.
  }
});

export function loadTickets() {
  if (isInitialized) return;
  isInitialized = true;
  if (!hasBrowserStorage()) return;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      ticketsStore.set([]);
      return;
    }
    ticketsStore.set(sanitizeTickets(JSON.parse(saved)));
  } catch {
    ticketsStore.set([]);
  }
}

export function addTicket(ticket: TicketBusTicket) {
  if (!ticket || typeof ticket !== "object") return;
  ticketsStore.set([...ticketsStore.get(), ticket]);
}