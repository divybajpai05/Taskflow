// components/hr/Attendance.tsx
import { useCallback, useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Download,
  RefreshCw,
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  Clock,
  UserMinus,
  ClockFading,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import AttendanceTable from "./components/AttendanceTable";
import apiClient from "@/api/client";

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  onLeave: number;
  notMarked: number;
  presentPercentage: number;
  absentPercentage: number;
}

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState<AttendanceStats>({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    halfDay: 0,
    onLeave: 0,
    notMarked: 0,
    presentPercentage: 0,
    absentPercentage: 0,
  });
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [monthlyAvg, setMonthlyAvg] = useState(0);

  // ==================== DATA FETCHING ====================

  const fetchStats = useCallback(async () => {
    try {
      setIsStatsLoading(true);
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const response = await apiClient.get(`/attendance/stats?date=${dateStr}`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch attendance stats:", error);
    } finally {
      setIsStatsLoading(false);
    }
  }, [selectedDate]);

  const fetchMonthlyAvg = useCallback(async () => {
    try {
      const month = selectedDate.getMonth() + 1;
      const year = selectedDate.getFullYear();
      const response = await apiClient.get(
        `/attendance/monthly?month=${month}&year=${year}`,
      );
      if (response.data.success) {
        setMonthlyAvg(response.data.data.averageAttendance || 0);
      }
    } catch (error) {
      console.error("Failed to fetch monthly stats:", error);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchStats();
    fetchMonthlyAvg();
  }, [fetchStats, fetchMonthlyAvg]);

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchStats(), fetchMonthlyAvg()]);
    setRefreshKey((prev) => prev + 1); // Trigger table refresh
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Export handler
  const handleExport = () => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    alert(`Attendance report for ${dateStr} will be exported.`);
  };

  // Quick date selectors
  const setQuickDate = (type: string) => {
    const today = new Date();
    if (type === "today") setSelectedDate(today);
    if (type === "yesterday") {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      setSelectedDate(yesterday);
    }
    if (type === "week") {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      setSelectedDate(startOfWeek);
    }
  };

  // Dynamic departments from actual data
  const departments = useMemo(
    () => [
      { value: "all", label: "All Departments" },
      { value: "Engineering", label: "Engineering" },
      { value: "Marketing", label: "Marketing" },
      { value: "HR & People", label: "HR & People" },
      { value: "Sales", label: "Sales" },
      { value: "Product", label: "Product" },
      { value: "Design", label: "Design" },
    ],
    [],
  );

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Attendance Management
          </h1>
          <p className="text-muted-foreground">
            Mark and track daily employee attendance
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Date Selector */}
          <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-background">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={format(selectedDate, "yyyy-MM-dd")}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="bg-transparent outline-none text-sm"
            />
          </div>

          {/* Quick Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDate("today")}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDate("yesterday")}
            >
              Yesterday
            </Button>
          </div>

          {/* Department Filter */}
          <Select
            value={selectedDepartment}
            onValueChange={setSelectedDepartment}
          >
            <SelectTrigger className="w-45">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.value} value={dept.value}>
                  {dept.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Refresh */}
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          {/* Export */}
          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search employee by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* KPI Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Present */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-3xl font-bold text-green-600">
                  {stats.present}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.presentPercentage}% of total strength
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Absent */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <XCircle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-3xl font-bold text-red-600">
                  {stats.absent}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.absentPercentage}% today
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* On Leave */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
            <UserMinus className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-3xl font-bold text-orange-600">
                  {stats.onLeave}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Approved leaves
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Avg. Attendance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Attendance
            </CardTitle>
            <Clock className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-3xl font-bold">{monthlyAvg}%</div>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Half Day */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Half Day</CardTitle>
            <ClockFading className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-3xl font-bold text-yellow-600">
                  {stats.halfDay}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.total > 0
                    ? Math.round((stats.halfDay / stats.total) * 100)
                    : 0}
                  % today
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Attendance Table */}
      <AttendanceTable
        key={refreshKey}
        selectedDate={selectedDate}
        selectedDepartment={selectedDepartment}
        searchQuery={searchQuery}
        onStatsUpdate={fetchStats}
      />
    </div>
  );
}
