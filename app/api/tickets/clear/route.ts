import { NextResponse } from "next/server";
import { clearAllTickets } from "@/lib/uploaded-tickets";

export async function POST() {
  clearAllTickets();
  return NextResponse.json({ success: true });
}
