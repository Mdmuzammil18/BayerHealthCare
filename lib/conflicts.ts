import { prisma } from "./prisma";
import { parse, areIntervalsOverlapping } from "date-fns";

export interface ShiftConflict {
  userId: string;
  userName: string;
  date: Date;
  shifts: Array<{
    id: string;
    type: string;
    startTime: string;
    endTime: string;
  }>;
}

/**
 * Check if two shifts overlap on the same day
 */
export function doShiftsOverlap(
  shift1Start: string,
  shift1End: string,
  shift2Start: string,
  shift2End: string,
  date: Date
): boolean {
  const start1 = parse(shift1Start, "HH:mm", date);
  const end1 = parse(shift1End, "HH:mm", date);
  const start2 = parse(shift2Start, "HH:mm", date);
  const end2 = parse(shift2End, "HH:mm", date);

  return areIntervalsOverlapping(
    { start: start1, end: end1 },
    { start: start2, end: end2 },
    { inclusive: true }
  );
}

/**
 * Find all shift conflicts for a specific date
 */
export async function findConflictsForDate(date: Date): Promise<ShiftConflict[]> {
  // Get all shifts for the date
  const shifts = await prisma.shift.findMany({
    where: {
      date: {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lt: new Date(date.setHours(23, 59, 59, 999)),
      },
    },
    include: {
      assignments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  // Group assignments by user
  const userShifts = new Map<string, Array<{
    id: string;
    type: string;
    startTime: string;
    endTime: string;
    userName: string;
  }>>();

  shifts.forEach((shift) => {
    shift.assignments.forEach((assignment) => {
      const userId = assignment.user.id;
      if (!userShifts.has(userId)) {
        userShifts.set(userId, []);
      }
      userShifts.get(userId)!.push({
        id: shift.id,
        type: shift.type,
        startTime: shift.startTime,
        endTime: shift.endTime,
        userName: assignment.user.name,
      });
    });
  });

  // Find conflicts (users with overlapping shifts)
  const conflicts: ShiftConflict[] = [];

  userShifts.forEach((shifts, userId) => {
    if (shifts.length > 1) {
      // Check for overlaps
      for (let i = 0; i < shifts.length; i++) {
        for (let j = i + 1; j < shifts.length; j++) {
          const overlap = doShiftsOverlap(
            shifts[i].startTime,
            shifts[i].endTime,
            shifts[j].startTime,
            shifts[j].endTime,
            date
          );

          if (overlap) {
            conflicts.push({
              userId,
              userName: shifts[i].userName,
              date,
              shifts: [
                {
                  id: shifts[i].id,
                  type: shifts[i].type,
                  startTime: shifts[i].startTime,
                  endTime: shifts[i].endTime,
                },
                {
                  id: shifts[j].id,
                  type: shifts[j].type,
                  startTime: shifts[j].startTime,
                  endTime: shifts[j].endTime,
                },
              ],
            });
            break; // Only report one conflict per user
          }
        }
      }
    }
  });

  return conflicts;
}

/**
 * Check if assigning a user to a shift would create a conflict
 */
export async function wouldCreateConflict(
  userId: string,
  shiftId: string
): Promise<boolean> {
  // Get the shift being assigned
  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
  });

  if (!shift) return false;

  // Get all other shifts the user is assigned to on the same date
  const userShifts = await prisma.shiftAssignment.findMany({
    where: {
      userId,
      shift: {
        date: {
          gte: new Date(shift.date.setHours(0, 0, 0, 0)),
          lt: new Date(shift.date.setHours(23, 59, 59, 999)),
        },
      },
    },
    include: {
      shift: true,
    },
  });

  // Check if any existing shift overlaps with the new shift
  for (const assignment of userShifts) {
    if (assignment.shift.id === shiftId) continue; // Skip if it's the same shift

    const overlap = doShiftsOverlap(
      shift.startTime,
      shift.endTime,
      assignment.shift.startTime,
      assignment.shift.endTime,
      shift.date
    );

    if (overlap) {
      return true;
    }
  }

  return false;
}
