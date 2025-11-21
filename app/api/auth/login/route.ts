import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    // Simple demo login - accept any credentials
    // Determine role based on email
    const isAdmin = email.toLowerCase().includes("admin");

    return NextResponse.json({
      success: true,
      user: {
        id: "demo-user-id",
        name: isAdmin ? "Admin User" : "Staff User",
        email: email,
        role: isAdmin ? "ADMIN" : "STAFF",
        staffRole: isAdmin ? null : "NURSE",
        department: isAdmin ? null : "GENERAL_WARD",
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
