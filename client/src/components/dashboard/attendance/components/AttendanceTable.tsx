// components/hr/AttendanceTable.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import apiClient from "@/api/client";

interface AttendanceRecord {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  initials: string;
  team: string;
  department: string;
  role: string;
  status: string | null;
  checkInTime: string;
  notes: string | null;
  attendanceId: string | null;
}

interface AttendanceTableProps {
  selectedDate: Date;
  selectedDepartment: string;
  searchQuery: string;
  onStatsUpdate?: () => void;
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({
  selectedDate,
  selectedDepartment,
  searchQuery,
  onStatsUpdate,
}) => {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // ✅ Track both userId and status
  const [submittingInfo, setSubmittingInfo] = useState<{
    userId: string;
    status: string;
  } | null>(null);

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const fetchAttendance = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/attendance?date=${dateStr}`);
      if (response.data.success) {
        setAttendanceData(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to load attendance data");
    } finally {
      setIsLoading(false);
    }
  }, [dateStr]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const filteredData = attendanceData.filter((emp) => {
    const matchesDept =
      selectedDepartment === "all" ||
      emp.team?.toLowerCase() === selectedDepartment;
    const matchesSearch = emp.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const markAttendance = async (userId: string, status: string) => {
    // ✅ Set both userId and status
    setSubmittingInfo({ userId, status });
    try {
      const statusMap: Record<string, string> = {
        Present: "PRESENT",
        "Half Day": "HALF_DAY",
        Late: "LATE",
        Absent: "ABSENT",
        "On Leave": "ON_LEAVE",
      };

      const dbStatus = statusMap[status] || status.toUpperCase();

      const response = await apiClient.post("/attendance", {
        userId,
        date: dateStr,
        status: dbStatus,
      });

      if (response.data.success) {
        toast.success(`Marked as ${status}`);
        fetchAttendance();
        onStatsUpdate?.();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to mark attendance");
    } finally {
      setSubmittingInfo(null);
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">Not Marked</Badge>;

    const statusMap: Record<string, { label: string; className: string }> = {
      PRESENT: {
        label: "Present",
        className:
          "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
      },
      ABSENT: {
        label: "Absent",
        className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
      },
      LATE: {
        label: "Late",
        className:
          "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
      },
      HALF_DAY: {
        label: "Half Day",
        className:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
      },
      ON_LEAVE: {
        label: "On Leave",
        className:
          "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
      },
    };

    const config = statusMap[status] || { label: status, className: "" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // ✅ Helper: Check if a specific button is the one being submitted
  const isButtonSubmitting = (userId: string, status: string) => {
    return (
      submittingInfo?.userId === userId && submittingInfo?.status === status
    );
  };

  // ✅ Helper: Check if this row is being submitted (any button)
  const isRowSubmitting = (userId: string) => {
    return submittingInfo?.userId === userId;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Attendance Sheet - {format(selectedDate, "dd MMMM yyyy")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Check-in Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No employees found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((emp) => {
                    const rowDisabled = isRowSubmitting(emp.id);

                    return (
                      <TableRow key={emp.id}>
                        <TableCell className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback>{emp.initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{emp.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>{emp.department}</TableCell>
                        <TableCell>{emp.role}</TableCell>
                        <TableCell className="font-mono">
                          {emp.checkInTime}
                        </TableCell>
                        <TableCell>{getStatusBadge(emp.status)}</TableCell>
                        <TableCell className="text-right space-x-1">
                          {/* Present */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:bg-green-50 cursor-pointer min-w-[70px]"
                            onClick={() => markAttendance(emp.id, "Present")}
                            disabled={rowDisabled}
                          >
                            {isButtonSubmitting(emp.id, "Present") ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Present"
                            )}
                          </Button>

                          {/* Half Day */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-yellow-600 hover:bg-yellow-50 cursor-pointer min-w-[70px]"
                            onClick={() => markAttendance(emp.id, "Half Day")}
                            disabled={rowDisabled}
                          >
                            {isButtonSubmitting(emp.id, "Half Day") ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Half Day"
                            )}
                          </Button>

                          {/* Late */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-orange-600 hover:bg-orange-50 cursor-pointer min-w-[70px]"
                            onClick={() => markAttendance(emp.id, "Late")}
                            disabled={rowDisabled}
                          >
                            {isButtonSubmitting(emp.id, "Late") ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Late"
                            )}
                          </Button>

                          {/* Absent */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50 cursor-pointer min-w-[70px]"
                            onClick={() => markAttendance(emp.id, "Absent")}
                            disabled={rowDisabled}
                          >
                            {isButtonSubmitting(emp.id, "Absent") ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Absent"
                            )}
                          </Button>

                          {/* On Leave */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-purple-600 hover:bg-purple-50 cursor-pointer min-w-[70px]"
                            onClick={() => markAttendance(emp.id, "On Leave")}
                            disabled={rowDisabled}
                          >
                            {isButtonSubmitting(emp.id, "On Leave") ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "On Leave"
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-4 text-xs text-muted-foreground flex justify-between">
          <span>Total Employees: {filteredData.length}</span>
          <span>
            Mark attendance for selected date • Changes saved automatically
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceTable;
