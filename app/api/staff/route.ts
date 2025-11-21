import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, hashPassword } from "@/lib/auth";

const createStaffSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  staffRole: z.enum(["NURSE", "DOCTOR", "TECHNICIAN"]),
  department: z.enum([
    "EMERGENCY",
    "ICU",
    "GENERAL_WARD",
    "SURGERY",
    "PEDIATRICS",
    "CARDIOLOGY",
    "RADIOLOGY",
    "LABORATORY",
  ]),
  shiftPreference: z.enum(["MORNING", "AFTERNOON", "NIGHT"]).optional(),
  contactNumber: z.string().optional(),
});

// GET /api/staff - List all staff (with optional filters)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");
    const staffRole = searchParams.get("staffRole");
    const department = searchParams.get("department");
    const shiftPreference = searchParams.get("shiftPreference");

    const where: any = {
      role: "STAFF",
    };

    if (name) {
      where.name = { contains: name, mode: "insensitive" };
    }
    if (staffRole) {
      where.staffRole = staffRole;
    }
    if (department) {
      where.department = department;
    }
    if (shiftPreference) {
      where.shiftPreference = shiftPreference;
    }

    const staff = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        staffRole: true,
        department: true,
        shiftPreference: true,
        contactNumber: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ staff });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Get staff error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/staff - Create new staff member
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const data = createStaffSchema.parse(body);

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create staff member
    const staff = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: "STAFF",
        staffRole: data.staffRole,
        department: data.department,
        shiftPreference: data.shiftPreference,
        contactNumber: data.contactNumber,
      },
      select: {
        id: true,
        name: true,
        email: true,
        staffRole: true,
        department: true,
        shiftPreference: true,
        contactNumber: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ staff }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    if (error.message === "Unauthorized" || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Create staff error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
