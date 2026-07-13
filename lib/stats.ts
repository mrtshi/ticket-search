import { Ticket } from "./mock-data";

export type Period = "7d" | "30d" | "2026" | "2025" | "2024" | "2023" | "2022" | "2021" | "2020" | "all";

export const PERIOD_LABELS: Record<Period, string> = {
  "7d": "7 дней",
  "30d": "30 дней",
  "2026": "2026 год",
  "2025": "2025 год",
  "2024": "2024 год",
  "2023": "2023 год",
  "2022": "2022 год",
  "2021": "2021 год",
  "2020": "2020 год",
  all: "Всё время",
};

export interface StatsByStatus {
  status: string;
  count: number;
}

function parseDate(dateStr: string): Date {
  const parts = dateStr.split(".");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return new Date(`${year}-${month}-${day}T00:00:00Z`);
  }
  return new Date(dateStr + "T00:00:00Z");
}

function filterByPeriod(tickets: Ticket[], period: Period): Ticket[] {
  if (period === "all") return tickets;
  if (period === "7d") {
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - 7);
    return tickets.filter((t) => parseDate(t.date) >= cutoff);
  }
  if (period === "30d") {
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - 30);
    return tickets.filter((t) => parseDate(t.date) >= cutoff);
  }
  const year = parseInt(period);
  return tickets.filter((t) => parseDate(t.date).getUTCFullYear() === year);
}

export function computeStatsByPeriod(tickets: Ticket[], period: Period): StatsByStatus[] {
  const filtered = filterByPeriod(tickets, period);
  return aggregateByStatus(filtered);
}

export function getWaitingPartsTickets(tickets: Ticket[]): Ticket[] {
  return tickets.filter((t) => t.status === "Ожидание запчастей");
}

export function countRepeatSerialNumbers(tickets: Ticket[]): number {
  const serialCounts = new Map<string, number>();
  for (const t of tickets) {
    serialCounts.set(t.serialNumber, (serialCounts.get(t.serialNumber) || 0) + 1);
  }
  let repeats = 0;
  for (const count of serialCounts.values()) {
    if (count > 1) repeats++;
  }
  return repeats;
}

function aggregateByStatus(tickets: Ticket[]): StatsByStatus[] {
  const map = new Map<string, number>();
  for (const t of tickets) {
    map.set(t.status, (map.get(t.status) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
}
