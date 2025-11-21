import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/attendance/user/[id] - Get attendance history for a user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireAuth();

    // Staff can only view their own attendance, admins can view anyone's
    if (currentUser.role !== "ADMIN" && currentUser.id !== params.id) {
      return NextResponse.json(
        { error: "Forbidden - You can only view your own attendance" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");

    const where: any = {
      userId: params.id,
    };

    // Filter by date range
    if (startDate && endDate) {
      where.shift = {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        shift: {
          select: {
            id: true,
            date: true,
            type: true,
            startTime: true,
            endTime: true,
          },
        },
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
      orderBy: {
        shift: {
          date: "desc",
        },
      },
    });

    return NextResponse.json({ attendance });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message?.includes("Forbidden")) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "Unauthorized" ? 401 : 403 }
      );
    }

    console.error("Get attendance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
