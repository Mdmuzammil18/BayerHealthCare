import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminDashboard from '@/app/admin/dashboard/page'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  it('should display loading state initially', () => {
    ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))
    
    render(<AdminDashboard />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('should display dashboard stats after loading', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          shifts: [
            {
              id: '1',
              type: 'MORNING',
              startTime: '08:00',
              endTime: '16:00',
              capacity: 5,
              _count: { assignments: 2 },
              assignments: [{}, {}],
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          staff: [
            { id: '1', name: 'Staff 1' },
            { id: '2', name: 'Staff 2' },
          ],
        }),
      })

    render(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    })

    // Check for stat cards
    expect(screen.getByText(/Total Shifts Today/i)).toBeInTheDocument()
    expect(screen.getByText(/Staff Assigned/i)).toBeInTheDocument()
    expect(screen.getByText(/Present/i)).toBeInTheDocument()
  })

  it('should display quick action cards', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ shifts: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ staff: [] }),
      })

    render(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Staff Management')).toBeInTheDocument()
      expect(screen.getByText('Shift Management')).toBeInTheDocument()
      expect(screen.getByText('Attendance')).toBeInTheDocument()
    })
  })

  it('should display today\'s shifts', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          shifts: [
            {
              id: '1',
              type: 'MORNING',
              startTime: '08:00',
              endTime: '16:00',
              capacity: 5,
              _count: { assignments: 3 },
              assignments: [{}, {}, {}],
            },
            {
              id: '2',
              type: 'AFTERNOON',
              startTime: '16:00',
              endTime: '00:00',
              capacity: 5,
              _count: { assignments: 2 },
              assignments: [{}, {}],
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ staff: [] }),
      })

    render(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('MORNING')).toBeInTheDocument()
      expect(screen.getByText('AFTERNOON')).toBeInTheDocument()
      expect(screen.getByText('08:00 - 16:00')).toBeInTheDocument()
      expect(screen.getByText('16:00 - 00:00')).toBeInTheDocument()
    })
  })

  it('should handle logout', async () => {
    const user = userEvent.setup()
    
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ shifts: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ staff: [] }),
      })

    render(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    })

    const logoutButton = screen.getByRole('button', { name: /logout/i })
    await user.click(logoutButton)

    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  it('should show empty state when no shifts', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ shifts: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ staff: [] }),
      })

    render(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/No shifts scheduled for today/i)).toBeInTheDocument()
    })
  })
})
