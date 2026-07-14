import { NextResponse } from "next/server";
import { getAllTickets, getUploadedAt, getArchiveUploadedAt } from "@/lib/uploaded-tickets";
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
