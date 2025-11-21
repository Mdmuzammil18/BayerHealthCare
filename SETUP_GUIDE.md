# Quick Setup Guide

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/healthcare_scheduler?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this"
ADMIN_EMAIL="admin@healthcare.com"
ADMIN_PASSWORD="admin123"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Important**: Replace `DATABASE_URL` with your actual PostgreSQL connection string.

### Free PostgreSQL Database Options:
- **Supabase**: https://supabase.com (Recommended)
- **Neon**: https://neon.tech
- **Railway**: https://railway.app
- **Render**: https://render.com

## Step 3: Initialize Database

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push
```

## Step 4: Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

## Step 5: Login

Use these credentials:
- **Email**: admin@healthcare.com
- **Password**: admin123

## Next Steps

1. **Add Staff Members**: Go to Staff Management and create staff accounts
2. **Create Shifts**: Set up shifts in Shift Management
3. **Assign Staff**: Assign staff to shifts
4. **Test Check-in/out**: Log in as staff and test attendance features

## Troubleshooting

### Database Connection Error
- Verify your `DATABASE_URL` is correct
- Make sure PostgreSQL is running
- Test connection: `npx prisma db pull`

### Module Not Found Errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Prisma Client Errors
```bash
npx prisma generate
```

## Project Structure

```
/app
  /api              # All API endpoints
  /admin            # Admin dashboard pages
  /staff            # Staff dashboard pages
  /login            # Login page
  
/components
  /ui               # shadcn/ui components
  
/lib
  auth.ts           # Authentication logic
  prisma.ts         # Database client
  attendance.ts     # Attendance calculations
  conflicts.ts      # Conflict detection
  
/prisma
  schema.prisma     # Database schema
```

## Key Features Implemented

✅ JWT Authentication with role-based access
✅ Staff Management (CRUD operations)
✅ Shift Scheduling with capacity limits
✅ Shift Assignment with conflict detection
✅ Check-in/Check-out with automatic status calculation
✅ Attendance tracking and history
✅ Admin and Staff dashboards
✅ Real-time conflict alerts
✅ Server-side timestamp validation

## API Endpoints Summary

### Authentication
- POST `/api/auth/login` - Login
- POST `/api/auth/logout` - Logout
- GET `/api/auth/me` - Get current user

### Staff (Admin only)
- GET `/api/staff` - List staff
- POST `/api/staff` - Create staff
- PUT `/api/staff/:id` - Update staff
- DELETE `/api/staff/:id` - Delete staff

### Shifts (Admin only)
- GET `/api/shifts` - List shifts
- POST `/api/shifts` - Create shift
- PUT `/api/shifts/:id` - Update shift
- DELETE `/api/shifts/:id` - Delete shift
- POST `/api/shifts/:id/assign` - Assign staff
- DELETE `/api/shifts/:id/assign` - Unassign staff

### Attendance
- POST `/api/attendance/check-in` - Check in
- POST `/api/attendance/check-out` - Check out
- GET `/api/attendance/user/:id` - Get attendance history
- PUT `/api/attendance/:id` - Update attendance (Admin)

### Dashboard
- GET `/api/dashboard/today` - Today's data
- GET `/api/conflicts` - Get conflicts (Admin)

## Deployment

### Vercel (Frontend)
1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

### Database
Use Supabase, Neon, Railway, or Render for PostgreSQL hosting.

## Support

For issues, check the main README.md or create an issue in the repository.
