import { Ticket } from "./mock-data";

export type Period =
  | "7d"
  | "30d"
  | "2026"
  | "2025"
  | "2024"
  | "2023"
  | "2022"
  | "2021"
  | "2020"
  | "all";

export const PERIOD_LABELS: Record<Period, string> = {
  "7d": "Последние 7 дней",
  "30d": "Последние 30 дней",
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

export interface DailyCount {
  date: string;
  count: number;
}

export interface FailureCount {
  itemName: string;
  count: number;
}

function parseDate(dateStr: string): Date {
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split(".").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }
  return new Date(dateStr + "T00:00:00Z");
}

function isInPeriod(ticket: Ticket, period: Period): boolean {
  const ticketDate = parseDate(ticket.date);
  const now = new Date();

  if (period === "7d") {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return ticketDate >= sevenDaysAgo;
  }

  if (period === "30d") {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return ticketDate >= thirtyDaysAgo;
  }

  if (period === "all") return true;

  const year = parseInt(period, 10);
  return ticketDate.getUTCFullYear() === year;
}

export function computeStatsByPeriod(
  tickets: Ticket[],
  period: Period
): StatsByStatus[] {
  const filtered = tickets.filter((t) => isInPeriod(t, period));
  const statusMap = new Map<string, number>();

  for (const t of filtered) {
    statusMap.set(t.status, (statusMap.get(t.status) || 0) + 1);
  }

  return Array.from(statusMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
}

export function computeDailyTickets(
  tickets: Ticket[],
  period: Period
): DailyCount[] {
  const filtered = tickets.filter((t) => isInPeriod(t, period));
  const dayMap = new Map<string, number>();

  for (const t of filtered) {
    const day = parseDate(t.date).toISOString().split("T")[0];
    dayMap.set(day, (dayMap.get(day) || 0) + 1);
  }

  return Array.from(dayMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getTopFailures(
  tickets: Ticket[],
  limit: number = 10
): FailureCount[] {
  const itemMap = new Map<string, number>();

  for (const t of tickets) {
    const name = t.itemName || "Не указано";
    itemMap.set(name, (itemMap.get(name) || 0) + 1);
  }

  return Array.from(itemMap.entries())
    .map(([itemName, count]) => ({ itemName, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function getWaitingPartsTickets(tickets: Ticket[]): Ticket[] {
  return tickets.filter((t) => t.status === "Ожидание запчастей");
}

export function countRepeatSerialNumbers(tickets: Ticket[]): number {
  const serialMap = new Map<string, number>();
  for (const t of tickets) {
    if (t.serialNumber) {
      serialMap.set(t.serialNumber, (serialMap.get(t.serialNumber) || 0) + 1);
    }
  }
  let repeatCount = 0;
  for (const count of serialMap.values()) {
    if (count > 1) repeatCount++;
  }
  return repeatCount;
}
