"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, LogOut, CheckCircle, Heart, User, Activity, XCircle } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

export default function StaffDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Mock data for demo
    setData({
      shifts: [
        {
          id: "1",
          shift: {
            id: "1",
            type: "MORNING",
            startTime: "08:00",
            endTime: "16:00",
          },
        },
        {
          id: "2",
          shift: {
            id: "2",
            type: "AFTERNOON",
            startTime: "16:00",
            endTime: "00:00",
          },
        },
      ],
      attendance: [
        {
          shiftId: "1",
          checkIn: new Date().toISOString(),
          checkOut: null,
          status: "PRESENT",
        },
      ],
    });
    setLoading(false);
  };

  const handleCheckIn = async (shiftId: string) => {
    toast({
      title: "Check-in Demo",
      description: "This is a UI-only demo. No actual check-in performed.",
    });
  };

  const handleCheckOut = async (shiftId: string) => {
    toast({
      title: "Check-out Demo",
      description: "This is a UI-only demo. No actual check-out performed.",
    });
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
          <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Today's Shifts */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Today's Shifts</CardTitle>
            <CardDescription>Your assigned shifts for today</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.shifts && data.shifts.length > 0 ? (
              <div className="space-y-4">
                {data.shifts.map((assignment: any) => {
                  const attendance = data.attendance?.find(
                    (a: any) => a.shiftId === assignment.shift.id
                  );

                  return (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <h3 className="font-semibold">{assignment.shift.type}</h3>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>
                            {assignment.shift.startTime} - {assignment.shift.endTime}
                          </span>
                        </div>
                        {attendance && (
                          <div className="mt-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                attendance.status === "PRESENT"
                                  ? "bg-green-100 text-green-800"
                                  : attendance.status === "LATE"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : attendance.status === "ABSENT"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-orange-100 text-orange-800"
                              }`}
                            >
                              {attendance.status}
                            </span>
                            {attendance.checkIn && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                In: {format(new Date(attendance.checkIn), "HH:mm")}
                              </span>
                            )}
                            {attendance.checkOut && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                Out: {format(new Date(attendance.checkOut), "HH:mm")}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!attendance?.checkIn ? (
                          <Button
                            onClick={() => handleCheckIn(assignment.shift.id)}
                            size="sm"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Check In
                          </Button>
                        ) : !attendance?.checkOut ? (
                          <Button
                            onClick={() => handleCheckOut(assignment.shift.id)}
                            variant="outline"
                            size="sm"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Check Out
                          </Button>
                        ) : (
                          <div className="text-sm text-green-600 font-medium">Completed</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No shifts assigned for today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attendance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Shifts Today:</span>
                  <span className="font-medium">{data?.shifts?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Checked In:</span>
                  <span className="font-medium">
                    {data?.attendance?.filter((a: any) => a.checkIn).length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Completed:</span>
                  <span className="font-medium">
                    {data?.attendance?.filter((a: any) => a.checkOut).length || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/staff/schedule">
                  <Calendar className="w-4 h-4 mr-2" />
                  View My Schedule
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/staff/attendance">
                  <Clock className="w-4 h-4 mr-2" />
                  Attendance History
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
