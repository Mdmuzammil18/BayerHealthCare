import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const updateShiftSchema = z.object({
  date: z.string().optional(),
  type: z.enum(["MORNING", "AFTERNOON", "NIGHT"]).optional(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  capacity: z.number().int().min(1).optional(),
});

// PUT /api/shifts/[id] - Update shift
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const body = await request.json();
    const data = updateShiftSchema.parse(body);

    const existing = await prisma.shift.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { assignments: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }

    // If reducing capacity, check if it would be below current assignments
    if (data.capacity && data.capacity < existing._count.assignments) {
      return NextResponse.json(
        {
          error: `Cannot reduce capacity below current assignments (${existing._count.assignments})`,
        },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (data.date) updateData.date = new Date(data.date);
    if (data.type) updateData.type = data.type;
    if (data.startTime) updateData.startTime = data.startTime;
    if (data.endTime) updateData.endTime = data.endTime;
    if (data.capacity) updateData.capacity = data.capacity;

    const shift = await prisma.shift.update({
      where: { id: params.id },
      data: updateData,
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                staffRole: true,
                department: true,
              },
            },
          },
        },
        _count: {
          select: { assignments: true },
        },
      },
    });

    return NextResponse.json({
      shift: {
        ...shift,
        availableSlots: shift.capacity - shift._count.assignments,
        isFull: shift._count.assignments >= shift.capacity,
      },
    });
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

    console.error("Update shift error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/shifts/[id] - Delete shift
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const shift = await prisma.shift.findUnique({
      where: { id: params.id },
    });

    if (!shift) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }

    await prisma.shift.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Delete shift error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
