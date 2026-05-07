// components/dashboard/overview/DashboardOverview.tsx
import { useEffect, useState, useCallback } from "react";
import { PriorityBreakdownChart } from "../chart/chart_bar_label";
import { DepartmentHeadcountChart } from "../chart/chart_bar_label_custom";
import { TaskStatusChart } from "../chart/chart_pie_label_list";
import { ActiveTaskQueue } from "./components/ActiveTaskQueue";
import { LiveActivity } from "./components/LiveActivity";
import OverDueList from "./components/OverDueList";
import { TeamWorkload } from "./components/TeamWorkload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Users, AlertCircle } from "lucide-react";
import apiClient from "@/api/client";
import DashboardOverviewLoader from "@/components/loaders/DashboardOverviewLoader";

interface OverviewStats {
  totalTasks: number;
  taskStatuses: { status: string; count: number }[];
  taskPriorities: { priority: string; count: number }[];
  departmentHeadcount: { team: string; count: number }[];
  totalWorkforce: number;
  highestPriority: string;
  highestPriorityCount: number;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get("/dashboard/overview");
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error: any) {
      console.error("Failed to fetch dashboard overview:", error);
      setError("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  if (isLoading) {
    return (
        <DashboardOverviewLoader />
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="text-muted-foreground">{error || "No data available"}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tasks
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Highest in {stats.highestPriority} Priority
            </p>
          </CardContent>
        </Card>

        {/* Total Workforce */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Workforce
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalWorkforce}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {stats.departmentHeadcount.length} departments
            </p>
          </CardContent>
        </Card>

        {/* Highest Priority */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top Priority
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.highestPriority}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.highestPriorityCount} tasks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="flex flex-col gap-4">
        <p className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
          Performance Overview
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <TaskStatusChart data={stats.taskStatuses} />
          <PriorityBreakdownChart data={stats.taskPriorities} />
          <DepartmentHeadcountChart data={stats.departmentHeadcount} />
        </div>
      </div>

      {/* Active Task Queue */}
      <div className="flex flex-col gap-4">
        <ActiveTaskQueue />
      </div>

      {/* Bottom Section */}
      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
        <OverDueList />
        <TeamWorkload />
        <LiveActivity />
      </div>
    </div>
  );
}
