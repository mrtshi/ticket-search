import { Ticket } from "./mock-data";

const KEYS = {
  ticketsCurrent: "polair_tickets_current",
  ticketsArchive: "polair_tickets_archive",
  uploadedAtCurrent: "polair_uploaded_at_current",
  uploadedAtArchive: "polair_uploaded_at_archive",
} as const;

export function getStoredTickets(): Ticket[] {
  if (typeof window === "undefined") return [];
  try {
    const current: Ticket[] = JSON.parse(
      localStorage.getItem(KEYS.ticketsCurrent) || "[]"
    );
    const archive: Ticket[] = JSON.parse(
      localStorage.getItem(KEYS.ticketsArchive) || "[]"
    );
    const seen = new Set<string>();
    const result: Ticket[] = [];
    for (const t of [...current, ...archive]) {
      const key = `${t.ticketNumber}||${t.serialNumber}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(t);
    }
    return result;
  } catch {
    return [];
  }
}

export function getTicketsByType(type: "current" | "archive"): Ticket[] {
  if (typeof window === "undefined") return [];
  try {
    const key = type === "current" ? KEYS.ticketsCurrent : KEYS.ticketsArchive;
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

export function getUploadedAt(type: "current" | "archive"): string | null {
  if (typeof window === "undefined") return null;
  const key =
    type === "current" ? KEYS.uploadedAtCurrent : KEYS.uploadedAtArchive;
  return localStorage.getItem(key);
}

export function saveTickets(
  tickets: Ticket[],
  type: "current" | "archive",
  uploadedAt: string
): void {
  if (typeof window === "undefined") return;
  const ticketsKey =
    type === "current" ? KEYS.ticketsCurrent : KEYS.ticketsArchive;
  const atKey =
    type === "current" ? KEYS.uploadedAtCurrent : KEYS.uploadedAtArchive;
  localStorage.setItem(ticketsKey, JSON.stringify(tickets));
  localStorage.setItem(atKey, uploadedAt);
}

export function clearTicketsByType(type: "current" | "archive"): void {
  if (typeof window === "undefined") return;
  const ticketsKey =
    type === "current" ? KEYS.ticketsCurrent : KEYS.ticketsArchive;
  const atKey =
    type === "current" ? KEYS.uploadedAtCurrent : KEYS.uploadedAtArchive;
  localStorage.removeItem(ticketsKey);
  localStorage.removeItem(atKey);
}

export async function tryRestoreServerData(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const current = getTicketsByType("current");
  const archive = getTicketsByType("archive");

  if (current.length === 0 && archive.length === 0) return false;

  let restored = false;

  if (current.length > 0) {
    const uploadedAt = getUploadedAt("current");
    const res = await fetch("/api/tickets/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "current",
        tickets: current,
        uploadedAt,
      }),
    });
    if (res.ok) restored = true;
  }

  if (archive.length > 0) {
    const uploadedAt = getUploadedAt("archive");
    const res = await fetch("/api/tickets/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "archive",
        tickets: archive,
        uploadedAt,
      }),
    });
    if (res.ok) restored = true;
  }

  return restored;
}

export async function fetchServerTickets(): Promise<{
  tickets: Ticket[];
  uploadedAt: string | null;
  archiveUploadedAt: string | null;
}> {
  const res = await fetch("/api/tickets");
  const data = await res.json();

  const result = {
    tickets: (data.tickets as Ticket[]) || [],
    uploadedAt: (data.uploadedAt as string) || null,
    archiveUploadedAt: (data.archiveUploadedAt as string) || null,
  };

  if (result.tickets.length === 0) {
    const restored = await tryRestoreServerData();
    if (restored) {
      const res2 = await fetch("/api/tickets");
      const data2 = await res2.json();
      return {
        tickets: (data2.tickets as Ticket[]) || [],
        uploadedAt: (data2.uploadedAt as string) || null,
        archiveUploadedAt: (data2.archiveUploadedAt as string) || null,
      };
    }
  }

  return result;
}

export async function tryRestoreFromLocalStorage(): Promise<Ticket[]> {
  const serverData = await fetchServerTickets();
  return serverData.tickets;
}
