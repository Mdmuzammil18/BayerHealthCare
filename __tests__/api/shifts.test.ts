import { GET, POST } from '@/app/api/shifts/route'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    shift: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

describe('Shifts API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/shifts', () => {
    it('should return shifts for a specific date', async () => {
      const mockShifts = [
        {
          id: '1',
          date: new Date('2025-11-21'),
          type: 'MORNING',
          startTime: '08:00',
          endTime: '16:00',
          capacity: 5,
          assignments: [],
          _count: { assignments: 0 },
        },
      ]

      ;(prisma.shift.findMany as jest.Mock).mockResolvedValue(mockShifts)

      const request = new Request('http://localhost:3000/api/shifts?date=2025-11-21')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.shifts).toHaveLength(1)
      expect(data.shifts[0].type).toBe('MORNING')
    })

    it('should return all shifts when no date is provided', async () => {
      const mockShifts = [
        {
          id: '1',
          type: 'MORNING',
          startTime: '08:00',
          endTime: '16:00',
          capacity: 5,
        },
        {
          id: '2',
          type: 'AFTERNOON',
          startTime: '16:00',
          endTime: '00:00',
          capacity: 5,
        },
      ]

      ;(prisma.shift.findMany as jest.Mock).mockResolvedValue(mockShifts)

      const request = new Request('http://localhost:3000/api/shifts')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.shifts).toHaveLength(2)
    })
  })

  describe('POST /api/shifts', () => {
    it('should create a new shift', async () => {
      const newShift = {
        date: '2025-11-21',
        type: 'MORNING',
        startTime: '08:00',
        endTime: '16:00',
        capacity: 5,
      }

      const createdShift = { id: '1', ...newShift, date: new Date(newShift.date) }
      ;(prisma.shift.create as jest.Mock).mockResolvedValue(createdShift)

      const request = new Request('http://localhost:3000/api/shifts', {
        method: 'POST',
        body: JSON.stringify(newShift),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.shift.type).toBe('MORNING')
    })

    it('should validate shift capacity', async () => {
      const invalidShift = {
        date: '2025-11-21',
        type: 'MORNING',
        startTime: '08:00',
        endTime: '16:00',
        capacity: -1, // Invalid capacity
      }

      const request = new Request('http://localhost:3000/api/shifts', {
        method: 'POST',
        body: JSON.stringify(invalidShift),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })
  })
})
