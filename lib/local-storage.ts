import { Ticket } from "./mock-data";

const STORAGE_KEY = "polair_tickets";
const ARCHIVE_KEY = "polair_archive_tickets";
const UPLOADED_AT_KEY = "polair_uploaded_at";
const ARCHIVE_UPLOADED_AT_KEY = "polair_archive_uploaded_at";

export function getStoredTickets(): Ticket[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getStoredArchiveTickets(): Ticket[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(ARCHIVE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getStoredUploadedAt(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(UPLOADED_AT_KEY);
}

export function getStoredArchiveUploadedAt(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ARCHIVE_UPLOADED_AT_KEY);
}

export function saveTickets(tickets: Ticket[], isArchive: boolean = false) {
  if (typeof window === "undefined") return;
  try {
    if (isArchive) {
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(tickets));
      localStorage.setItem(ARCHIVE_UPLOADED_AT_KEY, new Date().toISOString());
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
      localStorage.setItem(UPLOADED_AT_KEY, new Date().toISOString());
    }
  } catch {
    // localStorage может быть переполнен
  }
}
