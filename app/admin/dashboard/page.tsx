"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Clock, AlertTriangle, LogOut, Heart, TrendingUp, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch today's shifts
      const today = new Date().toISOString().split("T")[0];
      const shiftsRes = await fetch(`/api/shifts?date=${today}`);
      const shiftsData = await shiftsRes.json();
      const shifts = shiftsData.shifts || [];

      // Fetch all staff to get attendance
      const staffRes = await fetch("/api/staff");
      const staffData = await staffRes.json();
      const staff = staffData.staff || [];

      // Calculate stats
      let totalAssignments = 0;
      let totalCapacity = 0;
      let presentCount = 0;
      let lateCount = 0;
      let absentCount = 0;

      // Process shifts
      const processedShifts = shifts.map((shift: any) => {
        const assignedCount = shift._count?.assignments || 0;
        totalAssignments += assignedCount;
        totalCapacity += shift.capacity;

        return {
          ...shift,
          assignments: shift.assignments || [],
          availableSlots: shift.capacity - assignedCount,
        };
      });

      // Fetch attendance for today
      for (const member of staff) {
        try {
          const attendanceRes = await fetch(`/api/attendance/user/${member.id}`);
          if (attendanceRes.ok) {
            const attendanceData = await attendanceRes.json();
            const todayAttendance = attendanceData.attendance?.find(
              (a: any) => a.shift?.date && new Date(a.shift.date).toISOString().split("T")[0] === today
            );
            
            if (todayAttendance) {
              if (todayAttendance.status === "PRESENT") presentCount++;
              else if (todayAttendance.status === "LATE") lateCount++;
              else if (todayAttendance.status === "ABSENT") absentCount++;
            }
          }
        } catch (error) {
          console.error(`Error fetching attendance for ${member.name}:`, error);
        }
      }

      setData({
        stats: {
          totalShifts: shifts.length,
          totalAssignments,
          totalCapacity,
          attendance: {
            present: presentCount,
            late: lateCount,
            absent: absentCount,
          },
        },
        shifts: processedShifts,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Fallback to empty data
      setData({
        stats: {
          totalShifts: 0,
          totalAssignments: 0,
          totalCapacity: 0,
          attendance: { present: 0, late: 0, absent: 0 },
        },
        shifts: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-xs text-gray-500">Bayer Healthcare Management</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="border-gray-300 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/90">Total Shifts Today</CardTitle>
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data?.stats?.totalShifts || 0}</div>
              <p className="text-xs text-white/80 mt-1">Scheduled shifts</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/90">Staff Assigned</CardTitle>
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data?.stats?.totalAssignments || 0}</div>
              <p className="text-xs text-white/80 mt-1">
                of {data?.stats?.totalCapacity || 0} capacity
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/90">Present</CardTitle>
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {data?.stats?.attendance?.present || 0}
              </div>
              <p className="text-xs text-white/80 mt-1">Staff checked in</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/90">Absent/Late</CardTitle>
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {(data?.stats?.attendance?.absent || 0) + (data?.stats?.attendance?.late || 0)}
              </div>
              <p className="text-xs text-white/80 mt-1">Need attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/admin/staff">
            <Card className="hover:shadow-xl transition-all cursor-pointer border-0 bg-white/80 backdrop-blur-sm hover:scale-105 group">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">Staff Management</CardTitle>
                </div>
                <CardDescription className="text-sm">Add and manage staff members</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/shifts">
            <Card className="hover:shadow-xl transition-all cursor-pointer border-0 bg-white/80 backdrop-blur-sm hover:scale-105 group">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">Shift Management</CardTitle>
                </div>
                <CardDescription className="text-sm">Create shifts and assign staff</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/attendance">
            <Card className="hover:shadow-xl transition-all cursor-pointer border-0 bg-white/80 backdrop-blur-sm hover:scale-105 group">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">Attendance</CardTitle>
                </div>
                <CardDescription className="text-sm">View and manage attendance</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Today's Shifts */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Today's Shifts</CardTitle>
                <CardDescription>Overview of all shifts scheduled for today</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {data?.shifts && data.shifts.length > 0 ? (
              <div className="space-y-3">
                {data.shifts.map((shift: any) => (
                  <div
                    key={shift.id}
                    className="flex items-center justify-between p-4 border-0 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        shift.type === 'MORNING' ? 'bg-gradient-to-br from-yellow-400 to-orange-400' :
                        shift.type === 'AFTERNOON' ? 'bg-gradient-to-br from-orange-400 to-red-400' :
                        'bg-gradient-to-br from-indigo-500 to-purple-500'
                      }`}>
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{shift.type}</h3>
                        <p className="text-sm text-gray-600">
                          {shift.startTime} - {shift.endTime}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {shift.assignments?.length || 0} / {shift.capacity} assigned
                      </p>
                      <p className="text-xs text-gray-500">
                        {shift.availableSlots} slots available
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No shifts scheduled for today</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
