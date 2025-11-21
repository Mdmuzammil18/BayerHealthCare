"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Clock, Filter, Edit, Save, X } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function AttendancePage() {
  const { toast } = useToast();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    status: "",
    remarks: "",
  });

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      // Fetch all staff to get their attendance
      const staffRes = await fetch("/api/staff");
      if (!staffRes.ok) return;
      
      const staffData = await staffRes.json();
      const allAttendance: any[] = [];

      // Fetch attendance for each staff member
      for (const staff of staffData.staff || []) {
        const attRes = await fetch(`/api/attendance/user/${staff.id}`);
        if (attRes.ok) {
          const attData = await attRes.json();
          const records = (attData.attendance || []).map((record: any) => ({
            ...record,
            userName: staff.name,
            userEmail: staff.email,
          }));
          allAttendance.push(...records);
        }
      }

      // Sort by date (newest first)
      allAttendance.sort((a, b) => 
        new Date(b.shift.date).getTime() - new Date(a.shift.date).getTime()
      );

      setAttendance(allAttendance);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast({
        title: "Error",
        description: "Failed to load attendance records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "bg-green-100 text-green-800";
      case "LATE":
        return "bg-yellow-100 text-yellow-800";
      case "ABSENT":
        return "bg-red-100 text-red-800";
      case "EARLY_EXIT":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleEditClick = (record: any) => {
    setEditingId(record.id);
    setEditForm({
      status: record.status,
      remarks: record.remarks || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ status: "", remarks: "" });
  };

  const handleSaveEdit = async (recordId: string) => {
    try {
      const res = await fetch(`/api/attendance/${recordId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) {
        throw new Error("Failed to update attendance");
      }

      toast({
        title: "Attendance Updated",
        description: "The attendance record has been updated successfully.",
      });

      setEditingId(null);
      setEditForm({ status: "", remarks: "" });
      fetchAttendance();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Filter attendance
  const filteredAttendance = attendance.filter((record) => {
    const matchesStatus = filterStatus === "all" || record.status === filterStatus;
    const matchesDate = !filterDate || 
      format(new Date(record.shift.date), "yyyy-MM-dd") === filterDate;
    return matchesStatus && matchesDate;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="sm" className="hover:bg-purple-50">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Attendance Management
                  </h1>
                  <p className="text-sm text-gray-500">View and manually mark staff attendance</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg px-4 py-2 shadow-sm">
              <p className="text-xs text-purple-800 font-medium">💡 Tip: Click Edit to mark attendance manually</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-lg">Filter Attendance</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filterDate">Filter by Date</Label>
                <Input
                  id="filterDate"
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filterStatus">Filter by Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PRESENT">Present</SelectItem>
                    <SelectItem value="LATE">Late</SelectItem>
                    <SelectItem value="ABSENT">Absent</SelectItem>
                    <SelectItem value="EARLY_EXIT">Early Exit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFilterDate("");
                    setFilterStatus("all");
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Table */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Attendance Records</CardTitle>
                <p className="text-sm text-gray-500">{filteredAttendance.length} records found</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading...</p>
            ) : filteredAttendance.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendance.map((record) => {
                    const isEditing = editingId === record.id;
                    
                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{record.userName}</div>
                            <div className="text-xs text-gray-500">{record.userEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(record.shift.date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {record.shift.type}
                          </span>
                        </TableCell>
                        <TableCell>
                          {record.checkIn 
                            ? format(new Date(record.checkIn), "HH:mm")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {record.checkOut 
                            ? format(new Date(record.checkOut), "HH:mm")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Select
                              value={editForm.status}
                              onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PRESENT">Present</SelectItem>
                                <SelectItem value="LATE">Late</SelectItem>
                                <SelectItem value="ABSENT">Absent</SelectItem>
                                <SelectItem value="EARLY_EXIT">Early Exit</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                              {record.status}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={editForm.remarks}
                              onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                              placeholder="Add remarks (e.g., sick leave)"
                              className="w-48"
                            />
                          ) : (
                            <span className="text-sm">{record.remarks || "-"}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <div className="flex gap-1 justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSaveEdit(record.id)}
                              >
                                <Save className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEdit}
                              >
                                <X className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditClick(record)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No attendance records found
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
