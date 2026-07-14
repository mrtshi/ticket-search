import { Ticket } from "./mock-data";

let uploadedTickets: Ticket[] = [];
let archiveTickets: Ticket[] = [];
let uploadedAt: string | null = null;
let archiveUploadedAt: string | null = null;

export function setUploadedTickets(tickets: Ticket[]) {
  uploadedTickets = tickets;
  uploadedAt = new Date().toISOString();
}

export function setArchiveTickets(tickets: Ticket[]) {
  archiveTickets = tickets;
  archiveUploadedAt = new Date().toISOString();
}

export function restoreUploadedTickets(tickets: Ticket[], date: string) {
  uploadedTickets = tickets;
  uploadedAt = date;
}

export function restoreArchiveTickets(tickets: Ticket[], date: string) {
  archiveTickets = tickets;
  archiveUploadedAt = date;
}

export function getAllTickets(): Ticket[] {
  const seen = new Set<string>();
  const result: Ticket[] = [];

  const all = [...uploadedTickets, ...archiveTickets];
  for (const t of all) {
    const key = `${t.ticketNumber}-${t.serialNumber}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(t);
    }
  }

  return result;
}

export function getUploadedAt(): string | null {
  return uploadedAt;
}

export function getArchiveUploadedAt(): string | null {
  return archiveUploadedAt;
}

export function clearAllTickets() {
  uploadedTickets = [];
  archiveTickets = [];
  uploadedAt = null;
  archiveUploadedAt = null;
}
