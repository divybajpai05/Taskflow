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
  previousOnTime: number;
  previousAvgTime: number;
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

  const fetchKPI = useCallback(async () => {
    try {
      setIsLoading(true);
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
      if (response.data.success) setKpiData(response.data.data);
    } catch (error) {
      console.error("Failed to fetch KPI:", error);
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
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );

  const data = kpiData || {
    totalTasks: 0,
    completed: 0,
    overdue: 0,
    inProgress: 0,
    onTimeCompletion: 0,
    avgCompletionTime: 0,
    previousOnTime: 0,
    previousAvgTime: 0,
  };
  const completionChange = data.onTimeCompletion - data.previousOnTime;

  const cards = [
    {
      title: "Total Tasks",
      value: data.totalTasks.toLocaleString(),
      icon: Target,
      change: "+12%",
      description: "Created in selected period",
    },
    {
      title: "Completed",
      value: data.completed.toLocaleString(),
      icon: CheckCircle,
      change: "+18%",
      description: "Tasks marked as Done",
    },
    {
      title: "Overdue",
      value: data.overdue.toLocaleString(),
      icon: AlertTriangle,
      change: "-4%",
      description: "Past due date",
      highlight: data.overdue > 0,
    },
    {
      title: "On-Time Completion",
      value: `${data.onTimeCompletion}%`,
      icon: completionChange >= 0 ? TrendingUp : TrendingDown,
      change: `${completionChange >= 0 ? "+" : ""}${completionChange}%`,
      description: "vs previous period",
    },
    {
      title: "Avg. Completion Time",
      value: `${data.avgCompletionTime} days`,
      icon: Clock,
      change: `${data.avgCompletionTime < data.previousAvgTime ? "-" : "+"}${Math.abs(data.avgCompletionTime - data.previousAvgTime).toFixed(1)} days`,
      description: "From creation to Done",
    },
    {
      title: "In Progress",
      value: data.inProgress.toLocaleString(),
      icon: Target,
      change: "",
      description: "Currently active",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card
            key={index}
            className={`transition-all hover:shadow-md ${card.highlight ? "border-rose-500/50 bg-rose-50/50" : ""}`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <Icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold tracking-tight">
                  {card.value}
                </div>
                {card.change && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {card.change}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default React.memo(KPICards);
