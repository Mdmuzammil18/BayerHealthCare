import { NextResponse } from "next/server";

export async function GET() {
  // Return demo user data
  return NextResponse.json({
    user: {
      id: "demo-user-id",
      name: "Demo User",
      email: "demo@test.com",
      role: "ADMIN",
    },
  });
}
