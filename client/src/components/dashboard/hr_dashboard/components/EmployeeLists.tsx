import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface EmployeeListsProps {
  selectedDepartment: string;
  // selectedStatus: string;
}

const EmployeeLists: React.FC<EmployeeListsProps> = ({
  selectedDepartment,
}) => {
  const deptFilter = selectedDepartment === "all" ? null : selectedDepartment;

  // Mock Data
  const allEmployees = [
    {
      id: 1,
      name: "Ananya Sharma",
      dept: "Engineering",
      role: "Senior Developer",
      status: "present",
      email: "ananya@taskflow.com",
    },
    {
      id: 2,
      name: "Rohan Mehta",
      dept: "Design",
      role: "UI/UX Designer",
      status: "present",
      email: "rohan@taskflow.com",
    },
    {
      id: 3,
      name: "Priya Kapoor",
      dept: "Marketing",
      role: "Content Strategist",
      status: "onleave",
      email: "priya@taskflow.com",
    },
    {
      id: 4,
      name: "Arjun Rao",
      dept: "Sales",
      role: "Account Manager",
      status: "present",
      email: "arjun@taskflow.com",
    },
    {
      id: 5,
      name: "Sneha Verma",
      dept: "HR",
      role: "Talent Acquisition",
      status: "present",
      email: "sneha@taskflow.com",
    },
    {
      id: 6,
      name: "Vikram Singh",
      dept: "Engineering",
      role: "Backend Engineer",
      status: "absent",
      email: "vikram@taskflow.com",
    },
    {
      id: 7,
      name: "Meera Joshi",
      dept: "Finance",
      role: "Accountant",
      status: "onleave",
      email: "meera@taskflow.com",
    },
    {
      id: 8,
      name: "Karan Patel",
      dept: "Marketing",
      role: "Digital Marketer",
      status: "present",
      email: "karan@taskflow.com",
    },
    {
      id: 8,
      name: "Karan Patel",
      dept: "finance",
      role: "Digital Marketer",
      status: "halfDay",
      email: "karan@taskflow.com",
    },
    {
      id: 8,
      name: "Karan Patel",
      dept: "Marketing",
      role: "Digital Marketer",
      status: "halfDay",
      email: "karan@taskflow.com",
    },
  ];

  const filteredEmployees = useMemo(() => {
    let data = [...allEmployees];

    if (deptFilter) {
      data = data.filter((emp) => emp.dept.toLowerCase() === deptFilter);
    }

    return data;
  }, [deptFilter]);

  const presentEmployees = filteredEmployees.filter(
    (e) => e.status === "present",
  );
  const absentEmployees = filteredEmployees.filter(
    (e) => e.status === "absent",
  );
  const onLeaveEmployees = filteredEmployees.filter(
    (e) => e.status === "onleave",
  );

  const halfDayEmployees = filteredEmployees.filter(
    (e) => e.status === "halfDay",
  );

  const EmployeeTable = ({
    title,
    employees,
    badgeColor,
  }: {
    title: string;
    employees: typeof allEmployees;
    badgeColor: string;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          <Badge variant="secondary" className={badgeColor}>
            {employees.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {employees.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            No employees found in this category.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {emp.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{emp.name}</span>
                    </TableCell>
                    <TableCell>{emp.dept}</TableCell>
                    <TableCell>{emp.role}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {emp.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize ${badgeColor}`}>
                        {emp.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-1">
      <EmployeeTable
        title="Present Employees"
        employees={presentEmployees}
        badgeColor="bg-green-100 text-green-700"
      />

      <EmployeeTable
        title="Absent Employees"
        employees={absentEmployees}
        badgeColor="bg-red-100 text-red-700"
      />

      <EmployeeTable
        title="On Leave Employees"
        employees={onLeaveEmployees}
        badgeColor="bg-orange-100 text-orange-700"
      />

      <EmployeeTable
        title="Half Day Employees"
        employees={halfDayEmployees}
        badgeColor="bg-yellow-100 text-yellow-700"
      />
    </div>
  );
};

export default React.memo(EmployeeLists);
