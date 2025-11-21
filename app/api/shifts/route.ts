import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { startOfDay, endOfDay } from "date-fns";

const createShiftSchema = z.object({
  date: z.string(), // ISO date string
  type: z.enum(["MORNING", "AFTERNOON", "NIGHT"]),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:mm format
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  capacity: z.number().int().min(1).default(5),
});

// GET /api/shifts - List shifts with optional filters
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const type = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};

    // Filter by specific date
    if (dateParam) {
      const date = new Date(dateParam);
      where.date = {
        gte: startOfDay(date),
        lte: endOfDay(date),
      };
    }

    // Filter by date range
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Filter by shift type
    if (type) {
      where.type = type;
    }

    const shifts = await prisma.shift.findMany({
      where,
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
          select: {
            assignments: true,
          },
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    // Add available slots to each shift
    const shiftsWithSlots = shifts.map((shift) => ({
      ...shift,
      availableSlots: shift.capacity - shift._count.assignments,
      isFull: shift._count.assignments >= shift.capacity,
    }));

    return NextResponse.json({ shifts: shiftsWithSlots });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Get shifts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/shifts - Create new shift
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const data = createShiftSchema.parse(body);

    const shift = await prisma.shift.create({
      data: {
        date: new Date(data.date),
        type: data.type,
        startTime: data.startTime,
        endTime: data.endTime,
        capacity: data.capacity,
      },
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
          select: {
            assignments: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        shift: {
          ...shift,
          availableSlots: shift.capacity - shift._count.assignments,
          isFull: shift._count.assignments >= shift.capacity,
        },
      },
      { status: 201 }
    );
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

    console.error("Create shift error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
