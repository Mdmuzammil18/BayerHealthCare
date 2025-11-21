import { GET, POST } from '@/app/api/staff/route'
import { prisma } from '@/lib/prisma'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

describe('Staff API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/staff', () => {
    it('should return all staff members', async () => {
      const mockStaff = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          staffRole: 'DOCTOR',
          department: 'SURGERY',
          shiftPreference: 'MORNING',
          contactNumber: '1234567890',
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          staffRole: 'NURSE',
          department: 'EMERGENCY',
          shiftPreference: 'AFTERNOON',
          contactNumber: '0987654321',
        },
      ]

      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockStaff)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.staff).toEqual(mockStaff)
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { role: 'STAFF' },
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should handle errors gracefully', async () => {
      ;(prisma.user.findMany as jest.Mock).mockRejectedValue(new Error('Database error'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch staff')
    })
  })

  describe('POST /api/staff', () => {
    it('should create a new staff member', async () => {
      const newStaff = {
        name: 'New Staff',
        email: 'newstaff@example.com',
        staffRole: 'TECHNICIAN',
        department: 'RADIOLOGY',
        shiftPreference: 'NIGHT',
        contactNumber: '1111111111',
      }

      const createdStaff = { id: '3', ...newStaff }
      ;(prisma.user.create as jest.Mock).mockResolvedValue(createdStaff)

      const request = new Request('http://localhost:3000/api/staff', {
        method: 'POST',
        body: JSON.stringify(newStaff),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.staff).toEqual(createdStaff)
    })

    it('should validate required fields', async () => {
      const invalidStaff = {
        name: 'Test',
        // missing required fields
      }

      const request = new Request('http://localhost:3000/api/staff', {
        method: 'POST',
        body: JSON.stringify(invalidStaff),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })
  })
})
