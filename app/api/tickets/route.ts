import { NextRequest, NextResponse } from "next/server";
import { getAllTickets, getUploadedAt, getArchiveUploadedAt, clearCurrentTickets, clearArchiveTickets } from "@/lib/uploaded-tickets";
import { mockTickets } from "@/lib/mock-data";

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

  return NextResponse.json({
    tickets: mockTickets,
    source: "mock",
  });
}

export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");

  if (type === "archive") {
    clearArchiveTickets();
  } else {
    clearCurrentTickets();
  }

  return NextResponse.json({ success: true });
}
