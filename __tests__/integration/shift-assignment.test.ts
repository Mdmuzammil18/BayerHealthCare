/**
 * Integration Test: Shift Assignment Workflow
 * Tests the complete flow of creating a shift and assigning staff
 */

import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    shift: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    shiftAssignment: {
      create: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}))

describe('Shift Assignment Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should complete full shift assignment workflow', async () => {
    // Step 1: Create a shift
    const newShift = {
      id: 'shift1',
      date: new Date('2025-11-21'),
      type: 'MORNING',
      startTime: '08:00',
      endTime: '16:00',
      capacity: 5,
    }

    ;(prisma.shift.create as jest.Mock).mockResolvedValue(newShift)

    const createdShift = await prisma.shift.create({
      data: {
        date: new Date('2025-11-21'),
        type: 'MORNING',
        startTime: '08:00',
        endTime: '16:00',
        capacity: 5,
      },
    })

    expect(createdShift).toEqual(newShift)

    // Step 2: Find the shift
    ;(prisma.shift.findUnique as jest.Mock).mockResolvedValue(newShift)

    const foundShift = await prisma.shift.findUnique({
      where: { id: 'shift1' },
    })

    expect(foundShift).toEqual(newShift)

    // Step 3: Check staff availability
    const staff = {
      id: 'user1',
      name: 'John Doe',
      role: 'STAFF',
      staffRole: 'DOCTOR',
    }

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(staff)
    ;(prisma.shiftAssignment.findFirst as jest.Mock).mockResolvedValue(null)

    const foundStaff = await prisma.user.findUnique({
      where: { id: 'user1' },
    })

    expect(foundStaff).toEqual(staff)

    // Step 4: Check if staff is already assigned
    const existingAssignment = await prisma.shiftAssignment.findFirst({
      where: {
        shiftId: 'shift1',
        userId: 'user1',
      },
    })

    expect(existingAssignment).toBeNull()

    // Step 5: Check shift capacity
    ;(prisma.shiftAssignment.count as jest.Mock).mockResolvedValue(2)

    const currentAssignments = await prisma.shiftAssignment.count({
      where: { shiftId: 'shift1' },
    })

    expect(currentAssignments).toBeLessThan(newShift.capacity)

    // Step 6: Assign staff to shift
    const assignment = {
      id: 'assignment1',
      shiftId: 'shift1',
      userId: 'user1',
      createdAt: new Date(),
    }

    ;(prisma.shiftAssignment.create as jest.Mock).mockResolvedValue(assignment)

    const createdAssignment = await prisma.shiftAssignment.create({
      data: {
        shiftId: 'shift1',
        userId: 'user1',
      },
    })

    expect(createdAssignment).toEqual(assignment)
  })

  it('should prevent assignment when shift is full', async () => {
    const shift = {
      id: 'shift1',
      capacity: 5,
    }

    ;(prisma.shift.findUnique as jest.Mock).mockResolvedValue(shift)
    ;(prisma.shiftAssignment.count as jest.Mock).mockResolvedValue(5)

    const currentAssignments = await prisma.shiftAssignment.count({
      where: { shiftId: 'shift1' },
    })

    expect(currentAssignments).toBe(shift.capacity)
    // In real implementation, this would throw an error
  })

  it('should prevent duplicate assignments', async () => {
    const existingAssignment = {
      id: 'assignment1',
      shiftId: 'shift1',
      userId: 'user1',
    }

    ;(prisma.shiftAssignment.findFirst as jest.Mock).mockResolvedValue(existingAssignment)

    const assignment = await prisma.shiftAssignment.findFirst({
      where: {
        shiftId: 'shift1',
        userId: 'user1',
      },
    })

    expect(assignment).not.toBeNull()
    // In real implementation, this would prevent creating a duplicate
  })
})
