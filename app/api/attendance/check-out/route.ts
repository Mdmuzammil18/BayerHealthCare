import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calculateAttendanceStatus } from "@/lib/attendance";

const checkOutSchema = z.object({
  shiftId: z.string(),
  userId: z.string().optional(), // For demo purposes
});

// POST /api/attendance/check-out - Staff checks out from shift
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shiftId, userId } = checkOutSchema.parse(body);
    
    // For demo, use provided userId or a default
    const actualUserId = userId || "demo-user-id";

    // Find attendance record
    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_shiftId: {
          userId: actualUserId,
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
          userId: actualUserId,
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
