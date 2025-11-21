import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { calculateAttendanceStatus } from "@/lib/attendance";

const checkOutSchema = z.object({
  shiftId: z.string(),
});

// POST /api/attendance/check-out - Staff checks out from shift
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { shiftId } = checkOutSchema.parse(body);

    // Find attendance record
    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_shiftId: {
          userId: user.id,
          shiftId,
        },
      },
      include: {
        shift: true,
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
      );
    }

    // Check if checked in
    if (!attendance.checkIn) {
      return NextResponse.json(
        { error: "You must check in before checking out" },
        { status: 400 }
      );
    }

    // Check if already checked out
    if (attendance.checkOut) {
      return NextResponse.json(
        { error: "Already checked out from this shift" },
        { status: 400 }
      );
    }

    // Record check-out time (server timestamp)
    const checkOutTime = new Date();

    // Recalculate status with check-out time
    const status = calculateAttendanceStatus(
      attendance.checkIn,
      checkOutTime,
      attendance.shift.startTime,
      attendance.shift.endTime,
      attendance.shift.date
    );

    // Update attendance
    const updated = await prisma.attendance.update({
      where: {
        userId_shiftId: {
          userId: user.id,
          shiftId,
        },
      },
      data: {
        checkOut: checkOutTime,
        status,
      },
      include: {
        shift: true,
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

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error("Check-out error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
