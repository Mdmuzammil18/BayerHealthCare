import { NextRequest, NextResponse } from "next/server";
import { findConflictsForDate } from "@/lib/conflicts";
import { startOfDay, addDays } from "date-fns";

export const dynamic = 'force-dynamic';

// GET /api/conflicts - Find shift conflicts
export async function GET(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const daysParam = searchParams.get("days");

    const startDate = dateParam ? new Date(dateParam) : new Date();
    const days = daysParam ? parseInt(daysParam) : 7; // Default to 7 days

    const allConflicts = [];

    // Check for conflicts over the specified number of days
    for (let i = 0; i < days; i++) {
      const checkDate = addDays(startOfDay(startDate), i);
      const conflicts = await findConflictsForDate(checkDate);
      allConflicts.push(...conflicts);
    }

    return NextResponse.json({
      conflicts: allConflicts,
      count: allConflicts.length,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Conflicts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
