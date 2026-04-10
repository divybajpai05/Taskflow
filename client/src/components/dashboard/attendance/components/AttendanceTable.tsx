import React, { useState, useMemo } from "react";
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

interface AttendanceTableProps {
  selectedDate: Date;
  selectedDepartment: string;
  searchQuery: string;
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({
  selectedDate,
  selectedDepartment,
  searchQuery,
}) => {
  const [attendanceData, setAttendanceData] = useState([
    {
      id: 1,
      name: "Ananya Sharma",
      dept: "Engineering",
      role: "Senior Developer",
      status: "",
      time: "09:12 AM",
      avatar: "AS",
    },
    {
      id: 2,
      name: "Rohan Mehta",
      dept: "Design",
      role: "UI/UX Designer",
      status: "",
      time: "08:55 AM",
      avatar: "RM",
    },
    {
      id: 3,
      name: "Priya Kapoor",
      dept: "Marketing",
      role: "Content Strategist",
      status: "",
      time: "-",
      avatar: "PK",
    },
    {
      id: 4,
      name: "Arjun Rao",
      dept: "Sales",
      role: "Account Manager",
      status: "",
      time: "10:05 AM",
      avatar: "AR",
    },
    {
      id: 5,
      name: "Sneha Verma",
      dept: "HR",
      role: "Talent Acquisition",
      status: "",
      time: "09:00 AM",
      avatar: "SV",
    },
    {
      id: 6,
      name: "Vikram Singh",
      dept: "Engineering",
      role: "Backend Engineer",
      status: "",
      time: "-",
      avatar: "VS",
    },
    {
      id: 7,
      name: "Meera Joshi",
      dept: "Finance",
      role: "Accountant",
      status: "",
      time: "09:30 AM",
      avatar: "MJ",
    },
  ]);

  const filteredData = useMemo(() => {
    return attendanceData.filter((emp) => {
      const matchesDept =
        selectedDepartment === "all" ||
        emp.dept.toLowerCase() === selectedDepartment;
      const matchesSearch = emp.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesDept && matchesSearch;
    });
  }, [attendanceData, selectedDepartment, searchQuery]);

  const markAttendance = (
    id: number,
    newStatus: "present" | "absent" | "late" | "halfDay" | "onLeave",
  ) => {
    setAttendanceData((prev) =>
      prev.map((emp) =>
        emp.id === id
          ? {
              ...emp,
              status: newStatus,
              time: newStatus === "present" ? "09:15 AM" : "-",
            }
          : emp,
      ),
    );
    toast.success(
      `Marked as ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
    );
  };

  const getStatusBadge = (status: string) => {
    if (status === "present")
      return <Badge className="bg-green-100 text-green-700">Present</Badge>;
    if (status === "absent")
      return <Badge className="bg-red-100 text-red-700">Absent</Badge>;
    if (status === "late")
      return <Badge className="bg-orange-100 text-orange-700">Late</Badge>;
    if (status === "halfDay")
      return <Badge className="bg-yellow-100 text-yellow-700">Half Day</Badge>;
    if (status === "onLeave")
      return <Badge className="bg-neutral-800 text-white">On Leave</Badge>;
    return <Badge variant="outline">Not Marked</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Attendance Sheet - {format(selectedDate, "dd MMMM yyyy")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Check-in Time</TableHead>
                <TableHead className="">Status</TableHead>
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
                filteredData.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{emp.avatar}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{emp.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{emp.dept}</TableCell>
                    <TableCell>{emp.role}</TableCell>
                    <TableCell className="font-mono">{emp.time}</TableCell>
                    <TableCell>{getStatusBadge(emp.status)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:bg-green-50 cursor-pointer"
                        onClick={() => markAttendance(emp.id, "present")}
                      >
                        Present
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-yellow-600 hover:bg-yellow-50 cursor-pointer"
                        onClick={() => markAttendance(emp.id, "halfDay")}
                      >
                        Half Day
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-orange-600 hover:bg-orange-50 cursor-pointer"
                        onClick={() => markAttendance(emp.id, "late")}
                      >
                        Late
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50 cursor-pointer"
                        onClick={() => markAttendance(emp.id, "absent")}
                      >
                        Absent
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                        onClick={() => markAttendance(emp.id, "onLeave")}
                      >
                        On Leave
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 text-xs text-muted-foreground flex justify-between">
          <span>Total Employees: {filteredData.length}</span>
          <span>
            Mark attendance for selected date • Changes saved automatically in
            real UI
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceTable;
