import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calculateAttendanceStatus } from "@/lib/attendance";

const checkInSchema = z.object({
  shiftId: z.string(),
  userId: z.string().optional(), // For demo purposes
});

// POST /api/attendance/check-in - Staff checks in for shift
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shiftId, userId } = checkInSchema.parse(body);
    
    // For demo, use provided userId or a default
    const actualUserId = userId || "demo-user-id";

    // Verify shift exists and user is assigned
    const assignment = await prisma.shiftAssignment.findUnique({
      where: {
        shiftId_userId: {
          shiftId,
          userId: actualUserId,
        },
      },
      include: {
        shift: true,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "You are not assigned to this shift" },
        { status: 400 }
      );
    }

    // Find or create attendance record
    let attendance = await prisma.attendance.findUnique({
      where: {
        userId_shiftId: {
          userId: actualUserId,
          shiftId,
        },
      },
    });

    if (!attendance) {
      attendance = await prisma.attendance.create({
        data: {
          userId: actualUserId,
          shiftId,
          status: "ABSENT",
        },
      });
    }

    // Check if already checked in
    if (attendance.checkIn) {
      return NextResponse.json(
        { error: "Already checked in for this shift" },
        { status: 400 }
      );
    }

    // Record check-in time (server timestamp)
    const checkInTime = new Date();

    // Calculate status
    const status = calculateAttendanceStatus(
      checkInTime,
      null,
      assignment.shift.startTime,
      assignment.shift.endTime,
      assignment.shift.date
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
        checkIn: checkInTime,
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

    console.error("Check-in error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
