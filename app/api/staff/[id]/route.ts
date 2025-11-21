import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, hashPassword } from "@/lib/auth";

const updateStaffSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  staffRole: z.enum(["NURSE", "DOCTOR", "TECHNICIAN"]).optional(),
  department: z.enum([
    "EMERGENCY",
    "ICU",
    "GENERAL_WARD",
    "SURGERY",
    "PEDIATRICS",
    "CARDIOLOGY",
    "RADIOLOGY",
    "LABORATORY",
  ]).optional(),
  shiftPreference: z.enum(["MORNING", "AFTERNOON", "NIGHT"]).optional(),
  contactNumber: z.string().optional(),
});

// PUT /api/staff/[id] - Update staff member
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const body = await request.json();
    const data = updateStaffSchema.parse(body);

    // Check if staff exists
    const existing = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!existing || existing.role !== "STAFF") {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    // If email is being updated, check for conflicts
    if (data.email && data.email !== existing.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = { ...data };
    
    // Hash password if provided
    if (data.password) {
      updateData.passwordHash = await hashPassword(data.password);
      delete updateData.password;
    }

    // Update staff member
    const staff = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        staffRole: true,
        department: true,
        shiftPreference: true,
        contactNumber: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ staff });
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

    console.error("Update staff error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/staff/[id] - Delete staff member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const staff = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!staff || staff.role !== "STAFF") {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Delete staff error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
