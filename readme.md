# Healthcare Staff Shift Scheduler & Attendance Tracker

A complete MVP for managing healthcare staff shifts and tracking attendance with role-based access control.

## Features

### Admin Features
- **Staff Management**: Add, edit, and manage staff members with roles (Nurse, Doctor, Technician)
- **Shift Scheduling**: Create and manage shifts (Morning, Afternoon, Night) with capacity limits
- **Shift Assignment**: Assign staff to shifts with automatic conflict detection
- **Daily Schedule View**: Calendar-like view of all shifts and assignments
- **Attendance Management**: View and manually update attendance records
- **Conflict Alerts**: Automatic detection of overlapping shift assignments
- **Dashboard**: Real-time overview of today's shifts and attendance statistics

### Staff Features
- **Personal Dashboard**: View assigned shifts for today and upcoming days
- **Check-in/Check-out**: Clock in and out of shifts with automatic status calculation
- **Attendance History**: View personal attendance records with filters
- **My Schedule**: See all upcoming shift assignments

### System Features
- **Automatic Attendance Calculation**:
  - Late if check-in is >5 minutes after shift start
  - Early exit if check-out is before shift end
  - Absent if no check-in
  - Present if on time
- **Conflict Prevention**: Prevents double-booking staff on overlapping shifts
- **Server-side Timestamps**: Uses server time to prevent manipulation
- **JWT Authentication**: Secure role-based authentication
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: TailwindCSS, shadcn/ui components
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with httpOnly cookies
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or cloud)
- Git


## Default Login Credentials

### Admin Account
- **Email**: admin@healthcare.com
- **Password**: admin123

The admin account is automatically created on first login.

### Creating Staff Accounts

1. Log in as admin
2. Navigate to "Staff Management"
3. Click "Add Staff Member"
4. Fill in the details including email and password
5. Staff can then log in with their credentials

## Database Schema

### User
- Stores both admin and staff users
- Fields: name, email, role, staffRole, department, shiftPreference, contactNumber

### Shift
- Represents a work shift
- Fields: date, type (MORNING/AFTERNOON/NIGHT), startTime, endTime, capacity

### ShiftAssignment
- Links users to shifts
- Prevents duplicate assignments

### Attendance
- Tracks check-in/check-out times
- Auto-calculates status (PRESENT, LATE, ABSENT, EARLY_EXIT)
- Supports admin remarks

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Staff Management (Admin only)
- `GET /api/staff` - List all staff (with filters)
- `POST /api/staff` - Create staff member
- `PUT /api/staff/:id` - Update staff member
- `DELETE /api/staff/:id` - Delete staff member

### Shifts (Admin only)
- `GET /api/shifts` - List shifts (with filters)
- `POST /api/shifts` - Create shift
- `PUT /api/shifts/:id` - Update shift
- `DELETE /api/shifts/:id` - Delete shift
- `POST /api/shifts/:id/assign` - Assign staff to shift
- `DELETE /api/shifts/:id/assign?userId=xxx` - Unassign staff

### Attendance
- `POST /api/attendance/check-in` - Staff check-in
- `POST /api/attendance/check-out` - Staff check-out
- `GET /api/attendance/user/:id` - Get user attendance history
- `PUT /api/attendance/:id` - Admin update attendance

### Dashboard
- `GET /api/dashboard/today` - Get today's data (role-specific)
- `GET /api/conflicts` - Get shift conflicts (Admin only)

## Project Structure

```
/app
  /api              # API routes
    /auth           # Authentication endpoints
    /staff          # Staff management
    /shifts         # Shift management
    /attendance     # Attendance tracking
    /dashboard      # Dashboard data
    /conflicts      # Conflict detection
  /admin            # Admin pages
  /staff            # Staff pages
  /login            # Login page
  layout.tsx        # Root layout
  page.tsx          # Home page (redirects)
  globals.css       # Global styles

/components
  /ui               # shadcn/ui components

/lib
  auth.ts           # Authentication utilities
  prisma.ts         # Prisma client
  attendance.ts     # Attendance calculation logic
  conflicts.ts      # Conflict detection logic
  utils.ts          # Utility functions

/prisma
  schema.prisma     # Database schema
```

## Deployment

### Vercel (Recommended for Frontend)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Database Hosting

Use any of these PostgreSQL hosting providers:
- **Supabase** (Free tier available)
- **Railway** (Free tier available)
- **Neon** (Free tier available)
- **Render** (Free tier available)

### Environment Variables for Production

Make sure to set these in your deployment platform:
- `DATABASE_URL`
- `JWT_SECRET` (use a strong random string)
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_APP_URL`

## Usage Guide

### For Administrators

1. **Add Staff Members**
   - Go to Staff Management
   - Click "Add Staff Member"
   - Enter details and create account

2. **Create Shifts**
   - Go to Shift Management
   - Click "Create Shift"
   - Set date, time, type, and capacity

3. **Assign Staff to Shifts**
   - Go to Shift Assignments
   - Select a shift
   - Choose staff members to assign
   - System prevents conflicts automatically

4. **Monitor Attendance**
   - View today's attendance on dashboard
   - Check attendance history
   - Manually update records if needed

5. **Check for Conflicts**
   - View Conflicts page
   - See any overlapping shift assignments
   - Resolve by reassigning staff

### For Staff

1. **View Schedule**
   - Dashboard shows today's shifts
   - My Schedule shows all upcoming shifts

2. **Check In**
   - On shift day, click "Check In"
   - System records time and calculates status

3. **Check Out**
   - At end of shift, click "Check Out"
   - Final status is calculated

4. **View Attendance**
   - See your attendance history
   - Filter by date range or status

## Attendance Rules

- **On Time**: Check-in within 5 minutes of shift start
- **Late**: Check-in more than 5 minutes after shift start
- **Early Exit**: Check-out before shift end time
- **Absent**: No check-in recorded

## Security Features

- JWT tokens stored in httpOnly cookies
- Password hashing with bcrypt
- Role-based access control
- Server-side timestamp validation
- Input validation with Zod
- SQL injection protection via Prisma

## Troubleshooting

### Database Connection Issues
```bash
# Test database connection
npx prisma db pull
```

### Reset Database
```bash
# Warning: This deletes all data
npx prisma db push --force-reset
```

### Clear Node Modules
```bash
rm -rf node_modules package-lock.json
npm install
```

## Future Enhancements

- Email notifications for shift assignments
- SMS reminders for upcoming shifts
- Shift swap requests
- Leave management
- Reporting and analytics
- Export attendance to CSV/PDF
- Mobile app
- Push notifications
- Shift templates
- Recurring shifts

## License

MIT

## Support

For issues and questions, please create an issue in the repository.
