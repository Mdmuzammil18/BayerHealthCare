import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { startOfDay, endOfDay } from "date-fns";

// GET /api/dashboard/today - Get today's dashboard data
export async function GET() {
  try {
    const user = await requireAuth();
    const today = new Date();

    if (user.role === "ADMIN") {
      // Admin dashboard - overview of today's shifts
      const todayShifts = await prisma.shift.findMany({
        where: {
          date: {
            gte: startOfDay(today),
            lte: endOfDay(today),
          },
        },
        include: {
          assignments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  staffRole: true,
                  department: true,
                },
              },
            },
          },
          attendances: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              assignments: true,
            },
          },
        },
        orderBy: { startTime: "asc" },
      });

      // Calculate stats
      const totalShifts = todayShifts.length;
      const totalAssignments = todayShifts.reduce(
        (sum, shift) => sum + shift._count.assignments,
        0
      );
      const totalCapacity = todayShifts.reduce(
        (sum, shift) => sum + shift.capacity,
        0
      );

      const attendanceStats = {
        present: 0,
        late: 0,
        absent: 0,
        earlyExit: 0,
      };

      todayShifts.forEach((shift) => {
        shift.attendances.forEach((att) => {
          if (att.status === "PRESENT") attendanceStats.present++;
          else if (att.status === "LATE") attendanceStats.late++;
          else if (att.status === "ABSENT") attendanceStats.absent++;
          else if (att.status === "EARLY_EXIT") attendanceStats.earlyExit++;
        });
      });

      return NextResponse.json({
        shifts: todayShifts.map((shift) => ({
          ...shift,
          availableSlots: shift.capacity - shift._count.assignments,
          isFull: shift._count.assignments >= shift.capacity,
        })),
        stats: {
          totalShifts,
          totalAssignments,
          totalCapacity,
          availableSlots: totalCapacity - totalAssignments,
          attendance: attendanceStats,
        },
      });
    } else {
      // Staff dashboard - their shifts for today
      const myShifts = await prisma.shiftAssignment.findMany({
        where: {
          userId: user.id,
          shift: {
            date: {
              gte: startOfDay(today),
              lte: endOfDay(today),
            },
          },
        },
        include: {
          shift: true,
        },
      });

      const myAttendance = await prisma.attendance.findMany({
        where: {
          userId: user.id,
          shift: {
            date: {
              gte: startOfDay(today),
              lte: endOfDay(today),
            },
          },
        },
        include: {
          shift: true,
        },
      });

      return NextResponse.json({
        shifts: myShifts,
        attendance: myAttendance,
      });
    }
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
