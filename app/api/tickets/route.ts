import { NextResponse } from "next/server";
import { getAllTickets, getUploadedAt, getArchiveUploadedAt } from "@/lib/uploaded-tickets";
import { mockTickets } from "@/lib/mock-data";
import { hasCsvUrl, fetchCsvValues } from "@/lib/google-sheets";

const EXPECTED_COLUMNS = 7;

function parseTickets(values: string[][]): import("@/lib/mock-data").Ticket[] {
  const rows = values.slice(1);
  const seen = new Set<string>();
  const result: import("@/lib/mock-data").Ticket[] = [];

  for (const row of rows) {
    if (row.length < EXPECTED_COLUMNS || !row[0]?.trim()) continue;
    const ticket = {
      ticketNumber: row[0].trim(),
      itemName: row[1].trim(),
      serialNumber: row[2].trim(),
      date: row[3].trim(),
      address: row[4].trim(),
      performer: row[5].trim(),
      status: row[6].trim(),
    };
    const key = `${ticket.ticketNumber}-${ticket.serialNumber}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(ticket);
    }
  }

  return result;
}

export async function GET() {
  const uploaded = getAllTickets();

  if (uploaded.length > 0) {
    return NextResponse.json({
      tickets: uploaded,
      uploadedAt: getUploadedAt(),
      archiveUploadedAt: getArchiveUploadedAt(),
      source: "uploaded",
    });
  }

  if (hasCsvUrl()) {
    try {
      const values = await fetchCsvValues();
      const tickets = parseTickets(values);
      return NextResponse.json({
        tickets,
        source: "csv",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Неизвестная ошибка";
      return NextResponse.json(
        { error: message, hint: "Проверьте csvUrl в lib/sheet-config.ts" },
        { status: 503 }
      );
    }
  }

  return NextResponse.json({
    tickets: mockTickets,
    source: "mock",
  });
}
