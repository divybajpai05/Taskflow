// components/analytics/components/KPICards.tsx
import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  Target,
  Loader2,
  ListTodo,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { format } from "date-fns";
import apiClient from "@/api/client";

interface KPICardsProps {
  dateRange: { from: Date; to: Date };
  selectedMember: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedPriority: string;
  refreshKey?: number;
}

interface KPIData {
  totalTasks: number;
  completed: number;
  overdue: number;
  inProgress: number;
  onTimeCompletion: number;
  avgCompletionTime: number;
  previousTotalTasks: number;
  previousCompleted: number;
  previousOverdue: number;
  previousOnTime: number;
  previousAvgTime: number;
  tasksCreatedChange: number;
  tasksCompletedChange: number;
  overdueChange: number;
}

const KPICards: React.FC<KPICardsProps> = ({
  dateRange,
  selectedMember,
  selectedTeam,
  selectedStatus,
  selectedPriority,
  refreshKey,
}) => {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKPI = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

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

      const response = await apiClient.get(
        `/analytics/kpi?${params.toString()}`,
      );

      if (response.data.success) {
        const data = response.data.data;

        // Validate and normalize data to prevent inconsistencies
        const normalizedData: KPIData = {
          totalTasks: Math.max(0, data.totalTasks || 0),
          completed: Math.max(0, data.completed || 0),
          overdue: Math.max(0, data.overdue || 0),
          inProgress: Math.max(0, data.inProgress || 0),
          onTimeCompletion: Math.max(
            0,
            Math.min(100, data.onTimeCompletion || 0),
          ),
          avgCompletionTime: Math.max(0, data.avgCompletionTime || 0),
          previousTotalTasks: Math.max(0, data.previousTotalTasks || 0),
          previousCompleted: Math.max(0, data.previousCompleted || 0),
          previousOverdue: Math.max(0, data.previousOverdue || 0),
          previousOnTime: Math.max(0, Math.min(100, data.previousOnTime || 0)),
          previousAvgTime: Math.max(0, data.previousAvgTime || 0),
          tasksCreatedChange: data.tasksCreatedChange || 0,
          tasksCompletedChange: data.tasksCompletedChange || 0,
          overdueChange: data.overdueChange || 0,
        };

        // Additional validation: completed can't exceed total
        if (normalizedData.completed > normalizedData.totalTasks) {
          normalizedData.completed = normalizedData.totalTasks;
        }

        // Overdue can't exceed (total - completed)
        const maxOverdue = normalizedData.totalTasks - normalizedData.completed;
        if (normalizedData.overdue > maxOverdue) {
          normalizedData.overdue = maxOverdue;
        }

        // In progress can't exceed (total - completed)
        if (normalizedData.inProgress > maxOverdue) {
          normalizedData.inProgress = maxOverdue;
        }

        // Recalculate on-time completion rate if total tasks is 0
        if (normalizedData.totalTasks === 0) {
          normalizedData.onTimeCompletion = 0;
          normalizedData.completed = 0;
          normalizedData.overdue = 0;
          normalizedData.inProgress = 0;
        } else {
          // Actually calculate on-time completion based on real data
          normalizedData.onTimeCompletion = Math.round(
            (normalizedData.completed / normalizedData.totalTasks) * 100,
          );
        }

        // Calculate actual changes based on current vs previous
        if (normalizedData.previousTotalTasks > 0) {
          normalizedData.tasksCreatedChange = Math.round(
            ((normalizedData.totalTasks - normalizedData.previousTotalTasks) /
              normalizedData.previousTotalTasks) *
              100,
          );
        }

        if (normalizedData.previousCompleted > 0) {
          normalizedData.tasksCompletedChange = Math.round(
            ((normalizedData.completed - normalizedData.previousCompleted) /
              normalizedData.previousCompleted) *
              100,
          );
        } else if (normalizedData.completed > 0) {
          normalizedData.tasksCompletedChange = 100; // 100% increase from 0
        }

        if (normalizedData.previousOverdue > 0) {
          normalizedData.overdueChange = Math.round(
            ((normalizedData.overdue - normalizedData.previousOverdue) /
              normalizedData.previousOverdue) *
              100,
          );
        }

        setKpiData(normalizedData);
      } else {
        setError("Failed to load KPI data");
        // Set default data
        setKpiData({
          totalTasks: 0,
          completed: 0,
          overdue: 0,
          inProgress: 0,
          onTimeCompletion: 0,
          avgCompletionTime: 0,
          previousTotalTasks: 0,
          previousCompleted: 0,
          previousOverdue: 0,
          previousOnTime: 0,
          previousAvgTime: 0,
          tasksCreatedChange: 0,
          tasksCompletedChange: 0,
          overdueChange: 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch KPI:", error);
      setError("Failed to load KPI data");
      // Set default data on error
      setKpiData({
        totalTasks: 0,
        completed: 0,
        overdue: 0,
        inProgress: 0,
        onTimeCompletion: 0,
        avgCompletionTime: 0,
        previousTotalTasks: 0,
        previousCompleted: 0,
        previousOverdue: 0,
        previousOnTime: 0,
        previousAvgTime: 0,
        tasksCreatedChange: 0,
        tasksCompletedChange: 0,
        overdueChange: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    dateRange,
    selectedMember,
    selectedTeam,
    selectedStatus,
    selectedPriority,
  ]);

  useEffect(() => {
    fetchKPI();
  }, [fetchKPI, refreshKey]);

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm text-gray-500">Loading analytics data...</p>
      </div>
    );

  if (error && !kpiData)
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
        <p className="text-gray-500">{error}</p>
      </div>
    );

  const data = kpiData!;
  const completionChange = data.onTimeCompletion - data.previousOnTime;

  // Helper function to format change percentage
  const formatChange = (change: number) => {
    if (change === 0) return null;
    return change;
  };

  // Helper function to get change icon and color
  const getChangeIndicator = (change: number) => {
    if (change > 0)
      return {
        icon: ArrowUpRight,
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-50 dark:bg-green-900/20",
      };
    if (change < 0)
      return {
        icon: ArrowDownRight,
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-50 dark:bg-red-900/20",
      };
    return {
      icon: Minus,
      color: "text-gray-600 dark:text-gray-400",
      bgColor: "bg-gray-50 dark:bg-gray-900/20",
    };
  };

  const cards = [
    {
      title: "Total Tasks",
      value: data.totalTasks.toLocaleString(),
      icon: ListTodo,
      iconColor: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      change: formatChange(data.tasksCreatedChange),
      description:
        data.totalTasks === 0
          ? "No tasks created"
          : `Created in selected period`,
      highlight: false,
    },
    {
      title: "Completed",
      value: data.completed.toLocaleString(),
      icon: CheckCircle,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
      change: formatChange(data.tasksCompletedChange),
      description:
        data.completed === 0 ? "No tasks completed" : `Tasks marked as Done`,
      highlight: false,
    },
    {
      title: "Overdue",
      value: data.overdue.toLocaleString(),
      icon: AlertTriangle,
      iconColor:
        data.overdue > 0
          ? "text-red-600 dark:text-red-400"
          : "text-gray-600 dark:text-gray-400",
      iconBg:
        data.overdue > 0
          ? "bg-red-100 dark:bg-red-900/30"
          : "bg-gray-100 dark:bg-gray-900/30",
      change: formatChange(data.overdueChange),
      description: data.overdue === 0 ? "No overdue tasks" : "Past due date",
      highlight: data.overdue > 0,
    },
    {
      title: "On-Time Completion",
      value: data.totalTasks === 0 ? "0%" : `${data.onTimeCompletion}%`,
      icon: completionChange >= 0 ? TrendingUp : TrendingDown,
      iconColor:
        completionChange >= 0
          ? "text-green-600 dark:text-green-400"
          : "text-red-600 dark:text-red-400",
      iconBg:
        completionChange >= 0
          ? "bg-green-100 dark:bg-green-900/30"
          : "bg-red-100 dark:bg-red-900/30",
      change:
        completionChange !== 0
          ? `${completionChange >= 0 ? "+" : ""}${completionChange}%`
          : null,
      description:
        data.totalTasks === 0 ? "No tasks to measure" : "vs previous period",
      highlight: false,
    },
    {
      title: "Avg. Completion Time",
      value:
        data.totalTasks === 0 ? "0 days" : `${data.avgCompletionTime} days`,
      icon: Clock,
      iconColor: "text-purple-600 dark:text-purple-400",
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      change:
        data.totalTasks === 0
          ? null
          : `${data.avgCompletionTime < data.previousAvgTime ? "-" : "+"}${Math.abs(data.avgCompletionTime - data.previousAvgTime).toFixed(1)} days`,
      description: "From creation to Done",
      highlight: false,
    },
    {
      title: "In Progress",
      value: data.inProgress.toLocaleString(),
      icon: Target,
      iconColor: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-100 dark:bg-amber-900/30",
      change: null,
      description:
        data.inProgress === 0 ? "No active tasks" : "Currently active",
      highlight: false,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const changeIndicator = card.change
          ? getChangeIndicator(
              typeof card.change === "string"
                ? card.change.startsWith("+")
                  ? 1
                  : card.change.startsWith("-")
                    ? -1
                    : 0
                : card.change,
            )
          : null;
        const ChangeIcon = changeIndicator?.icon;

        return (
          <Card
            key={index}
            className={`transition-all hover:shadow-lg ${
              card.highlight
                ? "border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20"
                : "bg-white dark:bg-gray-800"
            }`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.iconBg}`}>
                <Icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div
                  className={`text-2xl font-bold tracking-tight ${
                    card.highlight
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  {card.value}
                  {card.title === "Completed" && data.totalTasks > 0 && (
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">
                      / {data.totalTasks}
                    </span>
                  )}
                </div>
                {card.change && ChangeIcon && (
                  <Badge
                    variant="secondary"
                    className={`ml-2 text-xs font-medium ${changeIndicator?.bgColor} ${changeIndicator?.color}`}
                  >
                    <ChangeIcon className="h-3 w-3 mr-0.5" />
                    {card.change}
                  </Badge>
                )}
              </div>
              <p
                className={`mt-2 text-xs ${
                  card.highlight
                    ? "text-red-600/70 dark:text-red-400/70"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {card.description}
              </p>
              {card.title === "Completed" && data.totalTasks > 0 && (
                <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${(data.completed / data.totalTasks) * 100}%`,
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default React.memo(KPICards);
