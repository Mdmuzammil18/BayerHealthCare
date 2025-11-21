import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Simple mock function for getting current user (no real auth)
export async function getCurrentUser() {
  return null;
}
