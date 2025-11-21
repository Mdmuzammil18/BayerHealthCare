import { NextResponse } from "next/server";

export async function POST() {
  // No actual logout needed in demo mode
  return NextResponse.json({ success: true });
}
