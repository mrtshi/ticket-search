import { NextRequest, NextResponse } from "next/server";
import { restoreUploadedTickets, restoreArchiveTickets } from "@/lib/uploaded-tickets";
import type { Ticket } from "@/lib/mock-data";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tickets, uploadedAt, archiveTickets, archiveUploadedAt } = body;

    if (tickets && Array.isArray(tickets)) {
      restoreUploadedTickets(tickets as Ticket[], uploadedAt || new Date().toISOString());
    }

    if (archiveTickets && Array.isArray(archiveTickets)) {
      restoreArchiveTickets(archiveTickets as Ticket[], archiveUploadedAt || new Date().toISOString());
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
