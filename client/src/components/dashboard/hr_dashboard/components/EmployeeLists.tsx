// components/hr/components/EmployeeLists.tsx
import React, { useEffect, useState, useCallback } from "react";
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
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import apiClient from "@/api/client";

interface EmployeeListsProps {
  dateRange: { from: Date; to: Date };
  selectedDepartment: string;
  selectedMember: string;
  refreshKey?: number;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  status: string;
  initials: string;
}

interface EmployeeData {
  present: Employee[];
  absent: Employee[];
  onLeave: Employee[];
  halfDay: Employee[];
  notMarked: Employee[];
}

const EmployeeLists: React.FC<EmployeeListsProps> = ({
  dateRange,
  selectedDepartment,
  selectedMember,
  refreshKey,
}) => {
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEmployees = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedDepartment !== "all")
        params.append("department", selectedDepartment);
      if (selectedMember !== "all") params.append("memberId", selectedMember);
      if (dateRange.from)
        params.append("dateFrom", format(dateRange.from, "yyyy-MM-dd"));
      if (dateRange.to)
        params.append("dateTo", format(dateRange.to, "yyyy-MM-dd"));

      const response = await apiClient.get(
        `/hr-dashboard/employees?${params.toString()}`,
      );
      if (response.data.success) setEmployeeData(response.data.data);
    } catch (error) {
      console.error("Failed to fetch employee data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDepartment, selectedMember, dateRange]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees, refreshKey]);

  const EmployeeTable = ({
    title,
    employees,
    badgeColor,
  }: {
    title: string;
    employees: Employee[];
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
                        <AvatarFallback>{emp.initials}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{emp.name}</span>
                    </TableCell>
                    <TableCell>{emp.department}</TableCell>
                    <TableCell>{emp.role}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {emp.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`capitalize ${badgeColor}`}
                      >
                        {emp.status === "onleave"
                          ? "On Leave"
                          : emp.status === "halfDay"
                            ? "Half Day"
                            : emp.status}
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

  if (isLoading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );

  return (
    <div className="grid gap-6 lg:grid-cols-1">
      <EmployeeTable
        title="Present Employees"
        employees={employeeData?.present || []}
        badgeColor="bg-green-100 text-green-700"
      />
      <EmployeeTable
        title="Absent Employees"
        employees={employeeData?.absent || []}
        badgeColor="bg-red-100 text-red-700"
      />
      <EmployeeTable
        title="On Leave Employees"
        employees={employeeData?.onLeave || []}
        badgeColor="bg-orange-100 text-orange-700"
      />
      <EmployeeTable
        title="Half Day Employees"
        employees={employeeData?.halfDay || []}
        badgeColor="bg-yellow-100 text-yellow-700"
      />
      <EmployeeTable
        title="Not Marked"
        employees={employeeData?.notMarked || []}
        badgeColor="bg-gray-100 text-gray-700"
      />
    </div>
  );
};

export default React.memo(EmployeeLists);
