import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { wouldCreateConflict } from "@/lib/conflicts";

const assignSchema = z.object({
  userId: z.string(),
});

// POST /api/shifts/[id]/assign - Assign staff to shift
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { userId } = assignSchema.parse(body);

    // Check if shift exists
    const shift = await prisma.shift.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { assignments: true },
        },
      },
    });

    if (!shift) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }

    // Check if shift is full
    if (shift._count.assignments >= shift.capacity) {
      return NextResponse.json(
        { error: "Shift is at full capacity" },
        { status: 400 }
      );
    }

    // Check if user exists and is staff
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== "STAFF") {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    // Check if already assigned
    const existing = await prisma.shiftAssignment.findUnique({
      where: {
        shiftId_userId: {
          shiftId: params.id,
          userId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Staff member already assigned to this shift" },
        { status: 400 }
      );
    }

    // Check for conflicts
    const hasConflict = await wouldCreateConflict(userId, params.id);

    if (hasConflict) {
      return NextResponse.json(
        {
          error:
            "Assignment would create a conflict - staff member is already assigned to an overlapping shift on this date",
        },
        { status: 400 }
      );
    }

    // Create assignment
    const assignment = await prisma.shiftAssignment.create({
      data: {
        shiftId: params.id,
        userId,
      },
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
        shift: true,
      },
    });

    // Also create attendance record
    await prisma.attendance.create({
      data: {
        userId,
        shiftId: params.id,
        status: "ABSENT", // Default to absent until check-in
      },
    });

    return NextResponse.json({ assignment }, { status: 201 });
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

    console.error("Assign shift error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/shifts/[id]/assign - Unassign staff from shift
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const assignment = await prisma.shiftAssignment.findUnique({
      where: {
        shiftId_userId: {
          shiftId: params.id,
          userId,
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Delete assignment and attendance
    await prisma.$transaction([
      prisma.shiftAssignment.delete({
        where: {
          shiftId_userId: {
            shiftId: params.id,
            userId,
          },
        },
      }),
      prisma.attendance.deleteMany({
        where: {
          shiftId: params.id,
          userId,
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Unassign shift error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
