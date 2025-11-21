import { AttendanceStatus } from "@prisma/client";
import { parse, differenceInMinutes } from "date-fns";

/**
 * Calculate attendance status based on check-in/check-out times
 * Rules:
 * - Late if check-in is >5 minutes after shift start
 * - Early exit if check-out is before shift end
 * - Present if checked in on time and checked out on time
 */
export function calculateAttendanceStatus(
  checkIn: Date | null,
  checkOut: Date | null,
  shiftStartTime: string, // Format: "HH:mm"
  shiftEndTime: string, // Format: "HH:mm"
  shiftDate: Date
): AttendanceStatus {
  // If no check-in, mark as absent
  if (!checkIn) {
    return AttendanceStatus.ABSENT;
  }

  // Parse shift start time
  const shiftStart = parse(shiftStartTime, "HH:mm", shiftDate);
  
  // Calculate minutes late
  const minutesLate = differenceInMinutes(checkIn, shiftStart);

  // Check if late (>5 minutes after shift start)
  const isLate = minutesLate > 5;

  // If checked out, check for early exit
  if (checkOut) {
    const shiftEnd = parse(shiftEndTime, "HH:mm", shiftDate);
    const leftEarly = checkOut < shiftEnd;

    if (leftEarly) {
      return AttendanceStatus.EARLY_EXIT;
    }
  }

  // If late but didn't leave early
  if (isLate) {
    return AttendanceStatus.LATE;
  }

  // Present if on time and didn't leave early
  return AttendanceStatus.PRESENT;
}

/**
 * Format time for display
 */
export function formatTime(date: Date | null): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * Get status badge color
 */
export function getStatusColor(status: AttendanceStatus): string {
  switch (status) {
    case AttendanceStatus.PRESENT:
      return "bg-green-100 text-green-800";
    case AttendanceStatus.LATE:
      return "bg-yellow-100 text-yellow-800";
    case AttendanceStatus.ABSENT:
      return "bg-red-100 text-red-800";
    case AttendanceStatus.EARLY_EXIT:
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
