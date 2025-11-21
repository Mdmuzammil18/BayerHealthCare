import { POST as CheckIn } from '@/app/api/attendance/check-in/route'
import { POST as CheckOut } from '@/app/api/attendance/check-out/route'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    attendance: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    shiftAssignment: {
      findFirst: jest.fn(),
    },
  },
}))

describe('Attendance API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/attendance/check-in', () => {
    it('should check in a staff member successfully', async () => {
      const mockAssignment = {
        id: '1',
        shiftId: 'shift1',
        userId: 'user1',
        shift: {
          date: new Date(),
          type: 'MORNING',
        },
      }

      ;(prisma.shiftAssignment.findFirst as jest.Mock).mockResolvedValue(mockAssignment)
      ;(prisma.attendance.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.attendance.create as jest.Mock).mockResolvedValue({
        id: 'att1',
        shiftId: 'shift1',
        userId: 'user1',
        checkIn: new Date(),
        status: 'PRESENT',
      })

      const request = new Request('http://localhost:3000/api/attendance/check-in', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user1', shiftId: 'shift1' }),
      })

      const response = await CheckIn(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.attendance.status).toBe('PRESENT')
    })

    it('should prevent duplicate check-ins', async () => {
      const mockAssignment = {
        id: '1',
        shiftId: 'shift1',
        userId: 'user1',
      }

      const existingAttendance = {
        id: 'att1',
        checkIn: new Date(),
      }

      ;(prisma.shiftAssignment.findFirst as jest.Mock).mockResolvedValue(mockAssignment)
      ;(prisma.attendance.findFirst as jest.Mock).mockResolvedValue(existingAttendance)

      const request = new Request('http://localhost:3000/api/attendance/check-in', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user1', shiftId: 'shift1' }),
      })

      const response = await CheckIn(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('already checked in')
    })
  })

  describe('POST /api/attendance/check-out', () => {
    it('should check out a staff member successfully', async () => {
      const mockAttendance = {
        id: 'att1',
        checkIn: new Date(),
        checkOut: null,
      }

      ;(prisma.attendance.findFirst as jest.Mock).mockResolvedValue(mockAttendance)
      ;(prisma.attendance.update as jest.Mock).mockResolvedValue({
        ...mockAttendance,
        checkOut: new Date(),
      })

      const request = new Request('http://localhost:3000/api/attendance/check-out', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user1', shiftId: 'shift1' }),
      })

      const response = await CheckOut(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.attendance.checkOut).toBeDefined()
    })

    it('should require check-in before check-out', async () => {
      ;(prisma.attendance.findFirst as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/attendance/check-out', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user1', shiftId: 'shift1' }),
      })

      const response = await CheckOut(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('No check-in record')
    })
  })
})
