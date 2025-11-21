"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Clock, AlertTriangle, LogOut } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Mock data for demo
    setData({
      stats: {
        totalShifts: 3,
        totalAssignments: 8,
        totalCapacity: 15,
        attendance: {
          present: 5,
          late: 2,
          absent: 1,
        },
      },
      shifts: [
        {
          id: "1",
          type: "MORNING",
          startTime: "08:00",
          endTime: "16:00",
          capacity: 5,
          assignments: [{}, {}, {}],
          availableSlots: 2,
        },
        {
          id: "2",
          type: "AFTERNOON",
          startTime: "16:00",
          endTime: "00:00",
          capacity: 5,
          assignments: [{}, {}, {}, {}],
          availableSlots: 1,
        },
        {
          id: "3",
          type: "NIGHT",
          startTime: "00:00",
          endTime: "08:00",
          capacity: 5,
          assignments: [{}],
          availableSlots: 4,
        },
      ],
    });
    setLoading(false);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shifts Today</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.stats?.totalShifts || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Staff Assigned</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.stats?.totalAssignments || 0}</div>
              <p className="text-xs text-muted-foreground">
                of {data?.stats?.totalCapacity || 0} capacity
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present</CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {data?.stats?.attendance?.present || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent/Late</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {(data?.stats?.attendance?.absent || 0) + (data?.stats?.attendance?.late || 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/admin/staff">
              <CardHeader>
                <CardTitle>Staff Management</CardTitle>
                <CardDescription>Add and manage staff members</CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/admin/shifts">
              <CardHeader>
                <CardTitle>Shift Management</CardTitle>
                <CardDescription>Create shifts and assign staff</CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/admin/attendance">
              <CardHeader>
                <CardTitle>Attendance</CardTitle>
                <CardDescription>View and manage attendance</CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </div>

        {/* Today's Shifts */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Shifts</CardTitle>
            <CardDescription>Overview of all shifts scheduled for today</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.shifts && data.shifts.length > 0 ? (
              <div className="space-y-4">
                {data.shifts.map((shift: any) => (
                  <div
                    key={shift.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold">{shift.type}</h3>
                      <p className="text-sm text-muted-foreground">
                        {shift.startTime} - {shift.endTime}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {shift.assignments?.length || 0} / {shift.capacity} assigned
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {shift.availableSlots} slots available
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No shifts scheduled for today
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
