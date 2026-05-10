// components/analytics/Analytics.tsx
import { useState, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { Download, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import apiClient from "@/api/client";

import KPICards from "./components/KPICards";
import OverviewCharts from "./components/OverviewCharts";
import TaskDetailsTable from "./components/TaskDetailsTable";
import TeamPerformance from "./components/TeamPerformance";
import InsightsSection from "./components/InsightsSection";
import ExportPdfService from "@/services/exportPdf.service";

export default function AnalyticsReport() {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  const [selectedMember, setSelectedMember] = useState<string>("all");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // ✅ Fetch workspace members for filter
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [membersRes, teamsRes] = await Promise.all([
          apiClient.get("/users/workspace-members"),
          apiClient.get("/teams"),
        ]);
        if (membersRes.data.success) setMembers(membersRes.data.data || []);
        if (teamsRes.data.success) setTeams(teamsRes.data.data || []);
      } catch (error) {
        console.error("Failed to fetch filters:", error);
      }
    };
    fetchFilters();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setLastUpdated(new Date());
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleExport = () => {
    toast.info("Export functionality coming soon");
  };

  const filterProps = {
    dateRange,
    selectedMember,
    selectedTeam,
    selectedStatus,
    selectedPriority,
    refreshKey: lastUpdated.getTime(),
  };

  const handleExportPDF = async () => {
    const loadingToast = toast.loading("Generating PDF report...");

    try {
      const { default: ExportPdfService } =
        await import("@/services/exportPdf.service");
      const exporter = new ExportPdfService();

      // Build filter params
      const getFilterParams = () => {
        const params = new URLSearchParams();
        if (dateRange.from)
          params.append("dateFrom", format(dateRange.from, "yyyy-MM-dd"));
        if (dateRange.to)
          params.append("dateTo", format(dateRange.to, "yyyy-MM-dd"));
        if (selectedMember !== "all") params.append("memberId", selectedMember);
        if (selectedTeam !== "all") params.append("teamId", selectedTeam);
        if (selectedStatus !== "all") params.append("status", selectedStatus);
        if (selectedPriority !== "all")
          params.append("priority", selectedPriority);
        return params.toString();
      };

      const filterParams = getFilterParams();

      // Fetch all data using CORRECT API routes
      const [
        kpiRes,
        chartsRes,
        taskRes,
        performanceRes, // ✅ /analytics/team
        workloadRes, // ✅ /analytics/team-workload
        completionRes, // ✅ /analytics/team-completion-rate
        attendanceRes, // ✅ /analytics/attendance-trend
        employeeDistRes, // ✅ /analytics/employee-distribution
        leaveTrendsRes, // ✅ /analytics/leave-trends
      ] = await Promise.all([
        apiClient.get(`/analytics/kpi?${filterParams}`),
        apiClient.get(`/analytics/charts?${filterParams}`),
        apiClient.get(`/analytics/tasks?${filterParams}`),
        apiClient.get(`/analytics/team?${filterParams}`),
        apiClient.get(`/analytics/team-workload?${filterParams}`),
        apiClient.get(`/analytics/team-completion-rate?${filterParams}`),
        apiClient.get(`/analytics/attendance-trend?${filterParams}`),
        apiClient.get(`/analytics/employee-distribution`),
        apiClient.get(`/analytics/leave-trends?${filterParams}`),
      ]);

      // Add report header
      exporter.addReportHeader(
        format(dateRange.from, "dd/MM/yyyy"),
        format(dateRange.to, "dd/MM/yyyy"),
      );

      // Section 1: KPI Summary
      if (kpiRes.data.success) {
        exporter.addKPISection(kpiRes.data.data);
      }

      // Section 2: Status Distribution
      if (chartsRes.data.success && chartsRes.data.data.statusDistribution) {
        exporter.addStatusDistribution(chartsRes.data.data.statusDistribution);
      }

      // Section 3: Priority Breakdown
      if (chartsRes.data.success && chartsRes.data.data.priorityBreakdown) {
        exporter.addPriorityBreakdown(chartsRes.data.data.priorityBreakdown);
      }

      // Section 4: Task Details
      if (taskRes.data.success) {
        exporter.addTaskDetailsSection(taskRes.data.data);
      }

      // Section 5: Team Performance
      if (performanceRes.data.success) {
        exporter.addTeamPerformanceSection(performanceRes.data.data);
      }

      // Section 6: Team Workload
      if (workloadRes.data.success) {
        exporter.addTeamWorkloadSection(workloadRes.data.data);
      }

      // Section 7: Attendance Trend
      if (attendanceRes.data.success) {
        exporter.addAttendanceSection(attendanceRes.data.data);
      }

      // Section 8: Employee Distribution
      if (employeeDistRes.data.success) {
        exporter.addEmployeeDistributionSection(employeeDistRes.data.data);
      }

      // Section 9: Leave Trends
      if (leaveTrendsRes.data.success) {
        const leaveRes = leaveTrendsRes.data.data;
        exporter.addLeaveTrendsSection(
          leaveRes.data || [],
          leaveRes.leaveTypeKeys || [],
          leaveRes.leaveTypeLabels || {},
        );
      }

      // Save PDF
      exporter.save();

      toast.dismiss(loadingToast);
      toast.success("PDF report downloaded successfully!");
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("PDF export failed:", error);
      toast.error("Failed to generate PDF report. Please try again.");
    }
  };

  return (
    <div className="flex-1 space-y-6 md:p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Real-time insights and performance reports
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

          {/* Member Filter */}
          <Select value={selectedMember} onValueChange={setSelectedMember}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Team Filter */}
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Todo">Todo</SelectItem>
              <SelectItem value="In progress">In Progress</SelectItem>
              <SelectItem value="Done">Done</SelectItem>
              <SelectItem value="On Hold">On Hold</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />{" "}
            Refresh
          </Button>
          <Button onClick={handleExportPDF} className="gap-2 cursor-pointer">
            <Download className="h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>

      {/* Live Indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="secondary" className="bg-green-500/10 text-green-600">
          ● Live
        </Badge>
        Last updated {format(lastUpdated, "HH:mm:ss")}
      </div>

      {/* KPI Cards */}
      <KPICards {...filterProps} />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="md:grid w-full md:grid-cols-4">
          <TabsTrigger className="cursor-pointer" value="overview">
            Overview
          </TabsTrigger>
          <TabsTrigger className="cursor-pointer" value="team">
            Team Performance
          </TabsTrigger>
          <TabsTrigger className="cursor-pointer" value="tasks">
            Task Details
          </TabsTrigger>
          <TabsTrigger className="cursor-pointer" value="insights">
            Insights
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <OverviewCharts {...filterProps} />
        </TabsContent>
        <TabsContent value="team">
          <TeamPerformance {...filterProps} />
        </TabsContent>
        <TabsContent value="tasks">
          <TaskDetailsTable {...filterProps} />
        </TabsContent>
        <TabsContent value="insights">
          <InsightsSection {...filterProps} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
