import { NextRequest, NextResponse } from "next/server";
import { setUploadedTickets, setArchiveTickets } from "@/lib/uploaded-tickets";
import type { Ticket } from "@/lib/mock-data";

export const maxDuration = 60;

const COLUMN_NAMES = [
  "№ заявки",
  "Номенклатура",
  "Заводской №",
  "Дата принятия заявки на ремонт",
  "Местонахождение оборудования",
  "Исполнитель",
  "Статус заявки в Фениксе",
];

const COMPLETION_COLUMN_NAMES = ["Дата выполнения ремонта"];

function normalize(str: string): string {
  return str.replace(/\s+/g, " ").trim().toLowerCase();
}

function findHeaderRow(data: string[][]): number {
  for (let i = 0; i < data.length; i++) {
    const row = data[i].map((h: string) => normalize(String(h)));
    const foundAll = COLUMN_NAMES.every((name) =>
      row.some((cell: string) => cell.includes(normalize(name)))
    );
    if (foundAll) return i;
  }
  return -1;
}

function findColumnIndex(headers: string[], expected: string): number {
  const normalized = normalize(expected);
  return headers.findIndex((h: string) => normalize(h).includes(normalized));
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Файл не выбран" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

    if (data.length < 2) {
      return NextResponse.json({ error: "Файл пуст" }, { status: 400 });
    }

    const headerRowIndex = findHeaderRow(data);
    if (headerRowIndex === -1) {
      return NextResponse.json(
        { error: `Не найдена строка с заголовками. Ожидаются: ${COLUMN_NAMES.join(", ")}` },
        { status: 400 }
      );
    }

    const headers = data[headerRowIndex].map((h: string) => String(h).trim());
    const colIndexes: number[] = [];

    for (const expected of COLUMN_NAMES) {
      const idx = findColumnIndex(headers, expected);
      if (idx === -1) {
        return NextResponse.json(
          { error: `Не найден столбец "${expected}" в файле. Ожидаются: ${COLUMN_NAMES.join(", ")}` },
          { status: 400 }
        );
      }
      colIndexes.push(idx);
    }

    let completionColIndex = -1;
    for (const name of COMPLETION_COLUMN_NAMES) {
      const idx = findColumnIndex(headers, name);
      if (idx !== -1) {
        completionColIndex = idx;
        break;
      }
    }

    const seen = new Set<string>();
    const tickets: Ticket[] = [];

    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 2) continue;

      const ticketNumber = String(row[colIndexes[0]] || "").trim();
      if (!ticketNumber || ticketNumber === "Итого") continue;

      const ticket: Ticket = {
        ticketNumber,
        itemName: String(row[colIndexes[1]] || "").trim(),
        serialNumber: String(row[colIndexes[2]] || "").trim(),
        date: String(row[colIndexes[3]] || "").trim(),
        address: String(row[colIndexes[4]] || "").trim(),
        performer: String(row[colIndexes[5]] || "").trim(),
        status: String(row[colIndexes[6]] || "").trim(),
      };

      if (completionColIndex !== -1) {
        const val = String(row[completionColIndex] || "").trim();
        if (val) ticket.completionDate = val;
      }

      const key = `${ticket.ticketNumber}-${ticket.serialNumber}`;
      if (!seen.has(key)) {
        seen.add(key);
        tickets.push(ticket);
      }
    }

    const url = new URL(request.url);
    const type = url.searchParams.get("type");

    if (type === "archive") {
      setArchiveTickets(tickets);
    } else {
      setUploadedTickets(tickets);
    }

    return NextResponse.json({
      success: true,
      count: tickets.length,
      type: type === "archive" ? "archive" : "current",
      tickets,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
