"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, Users, Plus, X, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { format, addDays, startOfWeek, endOfWeek, isWeekend } from "date-fns";

export default function ShiftSchedulerPage() {
  const { toast } = useToast();
  const [view, setView] = useState<"daily" | "weekly">("daily");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [shifts, setShifts] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [selectedStaffId, setSelectedStaffId] = useState("");

  useEffect(() => {
    fetchShifts();
    fetchStaff();
  }, [selectedDate, view]);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const res = await fetch(`/api/shifts?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        setShifts(data.shifts || []);
      }
    } catch (error) {
      console.error("Error fetching shifts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/staff");
      if (res.ok) {
        const data = await res.json();
        setStaff(data.staff || []);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedStaffId || !selectedShift) return;

    try {
      const res = await fetch(`/api/shifts/${selectedShift.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedStaffId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to assign staff");
      }

      toast({
        title: "Staff Assigned",
        description: "Staff member has been assigned to the shift.",
      });

      setShowAssignModal(false);
      setSelectedStaffId("");
      setSelectedShift(null);
      fetchShifts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUnassignStaff = async (shiftId: string, userId: string) => {
    if (!confirm("Are you sure you want to unassign this staff member?")) return;

    try {
      const res = await fetch(`/api/shifts/${shiftId}/assign`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        throw new Error("Failed to unassign staff");
      }

      toast({
        title: "Staff Unassigned",
        description: "Staff member has been removed from the shift.",
      });

      fetchShifts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getWeekDates = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const navigateDate = (direction: "prev" | "next") => {
    if (view === "daily") {
      setSelectedDate(addDays(selectedDate, direction === "next" ? 1 : -1));
    } else {
      setSelectedDate(addDays(selectedDate, direction === "next" ? 7 : -7));
    }
  };

  const getShiftTypeColor = (type: string) => {
    switch (type) {
      case "MORNING":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "AFTERNOON":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "NIGHT":
        return "bg-indigo-100 text-indigo-800 border-indigo-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "DOCTOR":
        return "bg-blue-100 text-blue-800";
      case "NURSE":
        return "bg-green-100 text-green-800";
      case "TECHNICIAN":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAvailableStaff = (shift: any) => {
    const assignedIds = shift.assignments?.map((a: any) => a.userId) || [];
    return staff.filter((s) => !assignedIds.includes(s.id));
  };

  const renderDailyView = () => {
    const dateShifts = shifts.filter(
      (shift) =>
        format(new Date(shift.date), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
    );

    const shiftTypes = ["MORNING", "AFTERNOON", "NIGHT"];
    const isWeekendDay = isWeekend(selectedDate);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {format(selectedDate, "EEEE, MMMM d, yyyy")}
            {isWeekendDay && (
              <span className="text-sm px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                Weekend
              </span>
            )}
          </h3>
        </div>

        {shiftTypes.map((type) => {
          const shift = dateShifts.find((s) => s.type === type);
          const assigned = shift?.assignments?.length || 0;
          const capacity = shift?.capacity || 0;
          const available = capacity - assigned;

          return (
            <Card key={type} className={`border-2 ${shift ? getShiftTypeColor(type) : ""}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{type} Shift</CardTitle>
                    {shift && (
                      <span className="text-sm text-muted-foreground">
                        {shift.startTime} - {shift.endTime}
                      </span>
                    )}
                  </div>
                  {shift && (
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <span className="font-semibold">{assigned}/{capacity}</span>
                        <span className="text-muted-foreground ml-1">assigned</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedShift(shift);
                          setShowAssignModal(true);
                        }}
                        disabled={available === 0}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Assign Staff
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!shift ? (
                  <p className="text-sm text-muted-foreground">No shift created for this time slot</p>
                ) : (
                  <div className="space-y-2">
                    {/* Slot Tracking */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${(assigned / capacity) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {available} slot{available !== 1 ? "s" : ""} available
                      </span>
                    </div>

                    {/* Assigned Staff */}
                    {shift.assignments && shift.assignments.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {shift.assignments.map((assignment: any) => (
                          <div
                            key={assignment.id}
                            className="flex items-center justify-between p-2 bg-white rounded border"
                          >
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium">{assignment.user.name}</p>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(
                                      assignment.user.staffRole
                                    )}`}
                                  >
                                    {assignment.user.staffRole}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {assignment.user.department?.replace(/_/g, " ")}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnassignStaff(shift.id, assignment.user.id)}
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No staff assigned yet</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderWeeklyView = () => {
    const weekDates = getWeekDates();

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2 bg-gray-50 text-left w-32">Shift Type</th>
              {weekDates.map((date) => (
                <th
                  key={date.toISOString()}
                  className={`border p-2 text-center ${
                    isWeekend(date) ? "bg-purple-50" : "bg-gray-50"
                  }`}
                >
                  <div className="text-sm font-semibold">{format(date, "EEE")}</div>
                  <div className="text-xs text-muted-foreground">{format(date, "MMM d")}</div>
                  {isWeekend(date) && (
                    <div className="text-xs text-purple-600 font-medium">Weekend</div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {["MORNING", "AFTERNOON", "NIGHT"].map((type) => (
              <tr key={type}>
                <td className="border p-2 font-medium bg-gray-50">
                  <div className={`px-2 py-1 rounded text-sm ${getShiftTypeColor(type)}`}>
                    {type}
                  </div>
                </td>
                {weekDates.map((date) => {
                  const dateStr = format(date, "yyyy-MM-dd");
                  const shift = shifts.find(
                    (s) => format(new Date(s.date), "yyyy-MM-dd") === dateStr && s.type === type
                  );
                  const assigned = shift?.assignments?.length || 0;
                  const capacity = shift?.capacity || 0;

                  return (
                    <td
                      key={date.toISOString()}
                      className={`border p-2 ${isWeekend(date) ? "bg-purple-50" : ""}`}
                    >
                      {shift ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold">
                              {assigned}/{capacity}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2"
                              onClick={() => {
                                setSelectedShift(shift);
                                setShowAssignModal(true);
                              }}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-1">
                            <div
                              className="bg-green-500 h-1 rounded-full"
                              style={{ width: `${(assigned / capacity) * 100}%` }}
                            />
                          </div>
                          {shift.assignments && shift.assignments.length > 0 && (
                            <div className="text-xs space-y-0.5">
                              {shift.assignments.slice(0, 2).map((a: any) => (
                                <div key={a.id} className="truncate">
                                  {a.user.name}
                                </div>
                              ))}
                              {shift.assignments.length > 2 && (
                                <div className="text-muted-foreground">
                                  +{shift.assignments.length - 2} more
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground text-center">-</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Shift Scheduler</h1>
                <p className="text-sm text-gray-500">Assign staff to shifts and manage capacity</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* View Toggle */}
              <div className="flex items-center gap-2">
                <Label>View:</Label>
                <div className="flex gap-2">
                  <Button
                    variant={view === "daily" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setView("daily")}
                  >
                    Daily
                  </Button>
                  <Button
                    variant={view === "weekly" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setView("weekly")}
                  >
                    Weekly
                  </Button>
                </div>
              </div>

              {/* Date Navigation */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Input
                  type="date"
                  value={format(selectedDate, "yyyy-MM-dd")}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="w-40"
                />
                <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                >
                  Today
                </Button>
              </div>

              {/* Quick Links */}
              <div className="flex gap-2">
                <Link href="/admin/shifts">
                  <Button variant="outline" size="sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    Manage Shifts
                  </Button>
                </Link>
                <Link href="/admin/staff">
                  <Button variant="outline" size="sm">
                    <Users className="w-4 h-4 mr-2" />
                    Manage Staff
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule View */}
        {loading ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">Loading schedule...</p>
            </CardContent>
          </Card>
        ) : (
          <>{view === "daily" ? renderDailyView() : renderWeeklyView()}</>
        )}
      </main>

      {/* Assign Staff Modal */}
      {showAssignModal && selectedShift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Assign Staff to Shift</CardTitle>
              <p className="text-sm text-muted-foreground">
                {selectedShift.type} - {format(new Date(selectedShift.date), "MMM d, yyyy")}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Staff Member</Label>
                <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableStaff(selectedShift).map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <span>{member.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({member.staffRole})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedStaffId("");
                    setSelectedShift(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleAssignStaff} disabled={!selectedStaffId}>
                  Assign
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
