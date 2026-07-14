import { NextRequest, NextResponse } from "next/server";
import { setUploadedTickets, setArchiveTickets } from "@/lib/uploaded-tickets";
import type { Ticket } from "@/lib/mock-data";

const COLUMN_NAMES = [
  "№ заявки",
  "Номенклатура",
  "Заводской №",
  "Дата принятия заявки на ремонт",
  "Местонахождение оборудования",
  "Исполнитель",
  "Статус заявки в Фениксе",
];

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
      return NextResponse.json({ error: "Файл пуст или содержит только заголовки" }, { status: 400 });
    }

    const headers = data[0].map((h: string) => h.trim());
    const colIndexes: number[] = [];

    for (const [header] of Object.entries(COLUMN_MAP)) {
    const colIndexes: number[] = [];

    for (const expected of COLUMN_NAMES) {
      const idx = headers.findIndex(
        (h: string) => h.replace(/\s+/g, " ").trim().toLowerCase() === expected.replace(/\s+/g, " ").trim().toLowerCase()
      );
      if (idx === -1) {
        return NextResponse.json(
          { error: `Не найден столбец "${expected}" в файле. Ожидаются: ${COLUMN_NAMES.join(", ")}` },
          { status: 400 }
        );
      }
      colIndexes.push(idx);
    }

    const seen = new Set<string>();
    const tickets: Ticket[] = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 7) continue;

      const ticket: Ticket = {
        ticketNumber: String(row[colIndexes[0]] || "").trim(),
        itemName: String(row[colIndexes[1]] || "").trim(),
        serialNumber: String(row[colIndexes[2]] || "").trim(),
        date: String(row[colIndexes[3]] || "").trim(),
        address: String(row[colIndexes[4]] || "").trim(),
        performer: String(row[colIndexes[5]] || "").trim(),
        status: String(row[colIndexes[6]] || "").trim(),
      };

      if (!ticket.ticketNumber) continue;

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
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
