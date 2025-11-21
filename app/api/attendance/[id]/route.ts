import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { calculateAttendanceStatus } from "@/lib/attendance";

const updateAttendanceSchema = z.object({
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  status: z.enum(["PRESENT", "LATE", "ABSENT", "EARLY_EXIT"]).optional(),
  remarks: z.string().optional(),
});

// PUT /api/attendance/[id] - Admin updates attendance manually
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const body = await request.json();
    const data = updateAttendanceSchema.parse(body);

    const attendance = await prisma.attendance.findUnique({
      where: { id: params.id },
      include: { shift: true },
    });

    if (!attendance) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (data.checkIn) {
      updateData.checkIn = new Date(data.checkIn);
    }

    if (data.checkOut) {
      updateData.checkOut = new Date(data.checkOut);
    }

    if (data.remarks !== undefined) {
      updateData.remarks = data.remarks;
    }

    // If status is explicitly provided, use it
    // Otherwise, recalculate based on check-in/out times
    if (data.status) {
      updateData.status = data.status;
    } else if (data.checkIn || data.checkOut) {
      const checkIn = data.checkIn
        ? new Date(data.checkIn)
        : attendance.checkIn;
      const checkOut = data.checkOut
        ? new Date(data.checkOut)
        : attendance.checkOut;

      updateData.status = calculateAttendanceStatus(
        checkIn,
        checkOut,
        attendance.shift.startTime,
        attendance.shift.endTime,
        attendance.shift.date
      );
    }

    const updated = await prisma.attendance.update({
      where: { id: params.id },
      data: updateData,
      include: {
        shift: true,
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
    });

    return NextResponse.json({ attendance: updated });
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

    console.error("Update attendance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
