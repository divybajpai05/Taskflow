// components/analytics/components/OverviewCharts.tsx
import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import apiClient from "@/api/client";
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

const STATUS_COLORS: Record<string, string> = {
  Done: "#22c55e",
  "In progress": "#3b82f6",
  Todo: "#eab308",
  "On Hold": "#64748b",
  Cancelled: "#ef4444",
};
const PRIORITY_COLORS: Record<string, string> = {
  Low: "#86efac",
  Medium: "#fcd34d",
  High: "#fb923c",
  Urgent: "#ef4444",
};

interface OverviewChartsProps {
  dateRange: { from: Date; to: Date };
  selectedMember: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedPriority: string;
  refreshKey?: number;
}

const OverviewCharts: React.FC<OverviewChartsProps> = ({
  dateRange,
  selectedMember,
  selectedTeam,
  selectedStatus,
  selectedPriority,
  refreshKey,
}) => {
  const [chartData, setChartData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCharts = useCallback(async () => {
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
        `/analytics/charts?${params.toString()}`,
      );
      if (response.data.success) setChartData(response.data.data);
    } catch (error) {
      console.error("Failed to fetch charts:", error);
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
    fetchCharts();
  }, [fetchCharts, refreshKey]);

  if (isLoading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  if (!chartData)
    return (
      <div className="text-center py-12 text-muted-foreground">
        No data available
      </div>
    );

  const totalStatus =
    chartData.statusDistribution?.reduce(
      (sum: number, s: any) => sum + s.value,
      0,
    ) || 1;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Task Completion Trend */}
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Task Completion Trend</CardTitle>
            <Badge variant="outline">Last 10 days</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Tasks created vs completed over time
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.trendData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="natural"
                  dataKey="created"
                  stroke="#64748b"
                  strokeWidth={3}
                  name="Created"
                  dot={{ r: 4 }}
                />
                <Line
                  type="natural"
                  dataKey="completed"
                  stroke="#22c55e"
                  strokeWidth={3}
                  name="Completed"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Status Distribution</CardTitle>
          <p className="text-sm text-muted-foreground">
            Breakdown by current status
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="h-64 w-64 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.statusDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    dataKey="value"
                  >
                    {(chartData.statusDistribution || []).map(
                      (entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={STATUS_COLORS[entry.name] || "#94a3b8"}
                        />
                      ),
                    )}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-4">
              {(chartData.statusDistribution || []).map((item: any) => {
                const percentage = ((item.value / totalStatus) * 100).toFixed(
                  1,
                );
                return (
                  <div
                    key={item.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            STATUS_COLORS[item.name] || "#94a3b8",
                        }}
                      />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{item.value}</div>
                      <div className="text-xs text-muted-foreground">
                        {percentage}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Priority Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Breakdown</CardTitle>
          <p className="text-sm text-muted-foreground">
            Number of tasks by priority
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData.priorityBreakdown || []}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={70} />
                <Tooltip />
                <Bar dataKey="tasks" radius={6}>
                  {(chartData.priorityBreakdown || []).map(
                    (entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PRIORITY_COLORS[entry.name] || "#94a3b8"}
                      />
                    ),
                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(OverviewCharts);
