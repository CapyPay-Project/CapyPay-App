import { atom } from 'nanostores';

let isInitialized = false;

export const ticketsStore = atom<any[]>([]);

ticketsStore.subscribe((tickets) => {
  if (isInitialized) {
    localStorage.setItem('misTicketsCapyPay', JSON.stringify(tickets));
  }
});

export const loadTickets = () => {
  const saved = localStorage.getItem('misTicketsCapyPay');
  if (saved) {
    ticketsStore.set(JSON.parse(saved));
  }
  isInitialized = true;
};

export const addTicket = (ticket: any) => {
  const current = ticketsStore.get();
  ticketsStore.set([...current, ticket]);
};