const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyDatabase() {
  try {
    console.log('🔍 Verifying database connection...\n');

    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful!\n');

    // Count records in each table
    const userCount = await prisma.user.count();
    const shiftCount = await prisma.shift.count();
    const assignmentCount = await prisma.shiftAssignment.count();
    const attendanceCount = await prisma.attendance.count();

    console.log('📊 Database Tables and Record Counts:');
    console.log('=====================================');
    console.log(`1. User              : ${userCount} records`);
    console.log(`2. Shift             : ${shiftCount} records`);
    console.log(`3. ShiftAssignment   : ${assignmentCount} records`);
    console.log(`4. Attendance        : ${attendanceCount} records`);
    console.log('=====================================\n');

    console.log('✨ Database is ready to use!');
    console.log('\nYou can now:');
    console.log('- Run "npm run dev" to start the application');
    console.log('- Run "npx prisma studio" to view/edit data in a GUI');

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check your .env file has correct DATABASE_URL');
    console.log('2. Make sure PostgreSQL is running');
    console.log('3. Verify database credentials are correct');
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase();
