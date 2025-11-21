import { hashPassword, verifyPassword } from '@/lib/auth'
import bcrypt from 'bcryptjs'

jest.mock('bcryptjs')

describe('Auth Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testpassword123'
      const hashedPassword = 'hashedpassword'
      
      ;(bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword)

      const result = await hashPassword(password)

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10)
      expect(result).toBe(hashedPassword)
    })
  })

  describe('verifyPassword', () => {
    it('should return true for matching passwords', async () => {
      const password = 'testpassword123'
      const hashedPassword = 'hashedpassword'
      
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      const result = await verifyPassword(password, hashedPassword)

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword)
      expect(result).toBe(true)
    })

    it('should return false for non-matching passwords', async () => {
      const password = 'testpassword123'
      const hashedPassword = 'hashedpassword'
      
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      const result = await verifyPassword(password, hashedPassword)

      expect(result).toBe(false)
    })
  })
})
