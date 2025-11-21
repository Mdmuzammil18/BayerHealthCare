"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, Plus, ArrowLeft, Trash2, Users, X, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { format, addDays, startOfWeek, endOfWeek, isWeekend } from "date-fns";

export default function ShiftManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"manage" | "schedule">("schedule");
  const [view, setView] = useState<"daily" | "weekly" | "staff">("daily");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [shifts, setShifts] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "MORNING",
    startTime: "08:00",
    endTime: "16:00",
    capacity: "5",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date(formData.date).toISOString(),
          type: formData.type,
          startTime: formData.startTime,
          endTime: formData.endTime,
          capacity: parseInt(formData.capacity),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create shift");
      }

      toast({
        title: "Shift Created",
        description: `${formData.type} shift on ${formData.date} has been created.`,
      });

      setFormData({
        date: new Date().toISOString().split("T")[0],
        type: "MORNING",
        startTime: "08:00",
        endTime: "16:00",
        capacity: "5",
      });
      setShowAddForm(false);
      fetchShifts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this shift?")) {
      try {
        const res = await fetch(`/api/shifts/${id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          throw new Error("Failed to delete shift");
        }

        toast({
          title: "Shift Deleted",
          description: "The shift has been removed.",
        });

        fetchShifts();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
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

  const navigateDate = (direction: "prev" | "next") => {
    if (view === "daily") {
      setSelectedDate(addDays(selectedDate, direction === "next" ? 1 : -1));
    } else {
      setSelectedDate(addDays(selectedDate, direction === "next" ? 7 : -7));
    }
  };

  const getStaffSchedule = (staffId: string) => {
    const weekDates = getWeekDates();
    const schedule: any = {};
    
    weekDates.forEach(date => {
      const dateStr = format(date, "yyyy-MM-dd");
      const dayShifts = shifts.filter(s => 
        format(new Date(s.date), "yyyy-MM-dd") === dateStr &&
        s.assignments?.some((a: any) => a.userId === staffId)
      );
      schedule[dateStr] = dayShifts;
    });
    
    return schedule;
  };

  const getWeekDates = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
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

  return (
    <div className="min-h-screen bg-gray-50">
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
                <h1 className="text-2xl font-bold text-gray-900">Shift Management</h1>
                <p className="text-sm text-gray-500">Create shifts and assign staff</p>
              </div>
            </div>
            {activeTab === "manage" && (
              <Button onClick={() => setShowAddForm(!showAddForm)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Shift
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "schedule" ? "default" : "outline"}
            onClick={() => setActiveTab("schedule")}
            className="flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Schedule Staff
          </Button>
          <Button
            variant={activeTab === "manage" ? "default" : "outline"}
            onClick={() => setActiveTab("manage")}
            className="flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Manage Shifts
          </Button>
        </div>

        {activeTab === "schedule" ? renderScheduler() : renderManageShifts()}
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

  function renderScheduler() {
    return (
      <div className="space-y-4">
        {/* View Toggle and Date Navigation */}
        <Card>
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
                  <Button
                    variant={view === "staff" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setView("staff")}
                  >
                    Staff Schedule
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                >
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {view === "daily" ? renderDailyView() : view === "weekly" ? renderWeeklyView() : renderStaffScheduleView()}
      </div>
    );
  }

  function renderDailyView() {
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
          <div className="text-sm text-muted-foreground">
            {dateShifts.length} shifts scheduled
          </div>
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
                        {available > 0 && (
                          <span className="ml-2 text-orange-600 font-medium">
                            ({available} unassigned)
                          </span>
                        )}
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
  }

  function renderStaffScheduleView() {
    const weekDates = getWeekDates();

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Staff Weekly Schedule: {format(weekDates[0], "MMM d")} - {format(weekDates[6], "MMM d, yyyy")}
          </h3>
        </div>

        {staff.length > 0 ? (
          <div className="space-y-4">
            {staff.map((member) => {
              const schedule = getStaffSchedule(member.id);
              const totalShifts = Object.values(schedule).flat().length;

              return (
                <Card key={member.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-gray-400" />
                        <div>
                          <CardTitle className="text-base">{member.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(member.staffRole)}`}>
                              {member.staffRole}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {member.department?.replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="font-semibold">{totalShifts}</span>
                        <span className="text-muted-foreground ml-1">shifts this week</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-7 gap-2">
                      {weekDates.map((date) => {
                        const dateStr = format(date, "yyyy-MM-dd");
                        const dayShifts = schedule[dateStr] || [];
                        const isWeekendDay = isWeekend(date);

                        return (
                          <div
                            key={dateStr}
                            className={`border rounded p-2 ${
                              isWeekendDay ? "bg-purple-50 border-purple-200" : "bg-gray-50"
                            }`}
                          >
                            <div className="text-xs font-semibold text-center mb-1">
                              {format(date, "EEE")}
                            </div>
                            <div className="text-xs text-center text-muted-foreground mb-2">
                              {format(date, "MMM d")}
                            </div>
                            {dayShifts.length > 0 ? (
                              <div className="space-y-1">
                                {dayShifts.map((shift: any) => (
                                  <div
                                    key={shift.id}
                                    className={`text-xs px-2 py-1 rounded text-center ${getShiftTypeColor(shift.type)}`}
                                  >
                                    {shift.type}
                                    <div className="text-[10px] mt-0.5">
                                      {shift.startTime}-{shift.endTime}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-center text-muted-foreground py-2">
                                Off
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">
                No staff members found. Add staff to see their schedules.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  function renderWeeklyView() {
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
  }

  function renderManageShifts() {
    return (
      <>
        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Shift</CardTitle>
              <CardDescription>Define shift details and capacity</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Shift Type *</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MORNING">Morning</SelectItem>
                        <SelectItem value="AFTERNOON">Afternoon</SelectItem>
                        <SelectItem value="NIGHT">Night</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time *</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity *</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Shift</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              All Shifts ({shifts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {shifts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shifts.map((shift) => (
                    <TableRow key={shift.id}>
                      <TableCell className="font-medium">
                        {format(new Date(shift.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {shift.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        {shift.startTime} - {shift.endTime}
                      </TableCell>
                      <TableCell>{shift.capacity}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>{shift._count?.assignments || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(shift.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No shifts created yet. Create your first shift using the form above.
              </p>
            )}
          </CardContent>
        </Card>
      </>
    );
  }
}
