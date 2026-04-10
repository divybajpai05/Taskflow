import { useState } from "react";
import { format } from "date-fns";
import {
  Download,
  RefreshCw,
  Users,
  UserCheck,
  Calendar,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import HRKPICards from "./components/HRKPICards";
import HRCharts from "./components/HRCharts";
import EmployeeLists from "./components/EmployeeLists";

// Import your existing KPICards if you want to reuse, but we'll create HR-specific ones
// For now, we'll create dedicated HR KPI cards inline for better control

const departmentColors: Record<string, string> = {
  Engineering: "#3b82f6",
  Design: "#8b5cf6",
  Marketing: "#ec4899",
  Sales: "#f59e0b",
  HR: "#10b981",
  Finance: "#ef4444",
};

const leaveTypeColors: Record<string, string> = {
  Vacation: "#22c55e",
  Sick: "#ef4444",
  Personal: "#eab308",
  Maternity: "#8b5cf6",
};

export default function HRDashboard() {
  // ==================== FILTER STATES ====================
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ==================== HANDLERS ====================
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleExport = () => {
    // Will connect to backend later
    alert("Export HR Report functionality will be connected to backend soon!");
  };

  // ==================== MOCK DATA ====================
  const kpiData = {
    totalEmployees: 1248,
    activeEmployees: 1189,
    onLeave: 42,
    newHires: 28,
    openPositions: 19,
    avgSatisfaction: 4.6,
  };

  // Department Breakdown
  const departmentData = [
    { name: "Engineering", value: 385, color: departmentColors.Engineering },
    { name: "Design", value: 124, color: departmentColors.Design },
    { name: "Marketing", value: 98, color: departmentColors.Marketing },
    { name: "Sales", value: 156, color: departmentColors.Sales },
    { name: "HR", value: 67, color: departmentColors.HR },
    { name: "Finance", value: 89, color: departmentColors.Finance },
  ];

  // Attendance Trend (Last 30 days)
  const attendanceTrend = [
    { date: "Mar 8", attendance: 94 },
    { date: "Mar 9", attendance: 91 },
    { date: "Mar 10", attendance: 96 },
    { date: "Mar 11", attendance: 89 },
    { date: "Mar 12", attendance: 93 },
    { date: "Mar 13", attendance: 95 },
    { date: "Mar 14", attendance: 92 },
    { date: "Mar 15", attendance: 97 },
    { date: "Mar 16", attendance: 88 },
    { date: "Mar 17", attendance: 94 },
  ];

  // Leave Trends by Type
  const leaveTrendData = [
    { name: "Vacation", count: 124, fill: leaveTypeColors.Vacation },
    { name: "Sick", count: 67, fill: leaveTypeColors.Sick },
    { name: "Personal", count: 45, fill: leaveTypeColors.Personal },
    { name: "Maternity", count: 12, fill: leaveTypeColors.Maternity },
  ];

  // Recruitment Pipeline
  const recruitmentData = [
    { stage: "Applied", count: 342, fill: "#64748b" },
    { stage: "Screened", count: 189, fill: "#3b82f6" },
    { stage: "Interview", count: 87, fill: "#8b5cf6" },
    { stage: "Offered", count: 34, fill: "#22c55e" },
    { stage: "Hired", count: 19, fill: "#10b981" },
  ];

  // Top Performers (Mock)
  const topPerformers = [
    { name: "Ananya Sharma", dept: "Engineering", rating: 4.9, avatar: "👩‍💻" },
    { name: "Rohan Mehta", dept: "Design", rating: 4.8, avatar: "👨‍🎨" },
    { name: "Priya Kapoor", dept: "Marketing", rating: 4.7, avatar: "👩‍💼" },
    { name: "Arjun Rao", dept: "Sales", rating: 4.9, avatar: "👨‍💼" },
    { name: "Sneha Verma", dept: "HR", rating: 4.6, avatar: "👩‍💼" },
  ];

  // Recent Activities
  const recentActivities = [
    {
      time: "2h ago",
      action: "New employee onboarded",
      details: "Rahul Sharma - Engineering",
    },
    {
      time: "5h ago",
      action: "Leave request approved",
      details: "Sonia Patel - 5 days vacation",
    },
    {
      time: "Yesterday",
      action: "Performance review completed",
      details: "Marketing Team Q1",
    },
    {
      time: "Yesterday",
      action: "Job posting closed",
      details: "Senior Product Manager",
    },
  ];

  return (
    <div className="flex-1 space-y-6 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Dashboard</h1>
          <p className="text-muted-foreground">
            Workforce overview and HR insights
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Date Range */}
          <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-background">
            <input
              type="date"
              value={format(dateRange.from, "yyyy-MM-dd")}
              onChange={(e) =>
                setDateRange((prev) => ({
                  ...prev,
                  from: new Date(e.target.value),
                }))
              }
              className="bg-transparent outline-none text-sm w-32"
            />
            <span className="text-muted-foreground">→</span>
            <input
              type="date"
              value={format(dateRange.to, "yyyy-MM-dd")}
              onChange={(e) =>
                setDateRange((prev) => ({
                  ...prev,
                  to: new Date(e.target.value),
                }))
              }
              className="bg-transparent outline-none text-sm w-32"
            />
          </div>

          <Select
            value={selectedDepartment}
            onValueChange={setSelectedDepartment}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="engineering">Engineering</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="hr">HR</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="onleave">On Leave</SelectItem>
              <SelectItem value="new">New Hires</SelectItem>
            </SelectContent>
          </Select>

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

          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Live Indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="secondary" className="bg-green-500/10 text-green-600">
          ● Live
        </Badge>
        Last updated moments ago
      </div>

      {/* KPI Cards */}

      <HRKPICards
        dateRange={dateRange}
        selectedDepartment={selectedDepartment}
        selectedStatus={selectedStatus}
      />

      {/* Charts Grid */}
      <HRCharts
        dateRange={dateRange}
        selectedDepartment={selectedDepartment}
        selectedStatus={selectedStatus}
      />

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">
          Employee Lists
        </h2>
        <EmployeeLists
          selectedDepartment={selectedDepartment}
          selectedStatus={selectedStatus}
        />
      </div>

      {/* Bottom Section: Top Performers + Recent Activities */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Top Performers */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <p className="text-sm text-muted-foreground">
              This quarter • Based on performance score
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.map((person, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{person.avatar}</div>
                    <div>
                      <div className="font-semibold">{person.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {person.dept}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{person.rating}</div>
                    <div className="text-xs text-emerald-600">★★★★★</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent HR Activities */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex gap-4">
                  <div className="text-xs text-muted-foreground whitespace-nowrap pt-1">
                    {activity.time}
                  </div>
                  <div>
                    <div className="font-medium">{activity.action}</div>
                    <div className="text-sm text-muted-foreground">
                      {activity.details}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
