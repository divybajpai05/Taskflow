// components/analytics/components/LeaveTrendsChart.tsx
import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import apiClient from "@/api/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface LeaveTrendsChartProps {
  dateRange: { from: Date; to: Date };
  refreshKey?: number;
}

const FALLBACK_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
];

type ViewMode = "team" | "monthly";

const LeaveTrendsChart: React.FC<LeaveTrendsChartProps> = ({
  dateRange,
  refreshKey,
}) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [leaveTypeKeys, setLeaveTypeKeys] = useState<string[]>([]);
  const [leaveTypeLabels, setLeaveTypeLabels] = useState<
    Record<string, string>
  >({});
  const [leaveTypeColors, setLeaveTypeColors] = useState<
    Record<string, string>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("team");

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (dateRange.from)
        params.append("dateFrom", format(dateRange.from, "yyyy-MM-dd"));
      if (dateRange.to)
        params.append("dateTo", format(dateRange.to, "yyyy-MM-dd"));
      const response = await apiClient.get(
        `/analytics/leave-trends?${params.toString()}`,
      );
      if (response.data.success) {
        const resData = response.data.data;
        if (resData.data) {
          setChartData(resData.data || []);
          setMonthlyData(resData.monthlyData || []);
          setLeaveTypeKeys(resData.leaveTypeKeys || []);
          setLeaveTypeLabels(resData.leaveTypeLabels || {});
          setLeaveTypeColors(resData.leaveTypeColors || {});
        } else {
          // Fallback
          setChartData(resData);
          setMonthlyData([]);
          setLeaveTypeKeys(["casual", "sick", "earned", "unpaid"]);
          setLeaveTypeLabels({
            casual: "Casual",
            sick: "Sick",
            earned: "Earned",
            unpaid: "Unpaid",
          });
          setLeaveTypeColors({
            casual: "#3b82f6",
            sick: "#ef4444",
            earned: "#22c55e",
            unpaid: "#f59e0b",
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch leave trends:", error);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );

  const hasData =
    viewMode === "team" ? chartData.length > 0 : monthlyData.length > 0;

  if (!hasData)
    return (
      <Card>
        <CardContent className="text-center py-12 text-muted-foreground">
          No data available
        </CardContent>
      </Card>
    );

  const activeData = viewMode === "team" ? chartData : monthlyData;
  const xAxisKey = viewMode === "team" ? "team" : "month";
  const totalLeaves = activeData.reduce((s, d) => s + (d.total || 0), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle>Leave Trends</CardTitle>
            <p className="text-sm text-muted-foreground">
              {viewMode === "team"
                ? "Leave distribution by type and team"
                : "Monthly leave distribution by type"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{totalLeaves} Total Leaves</Badge>
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "team" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("team")}
                className="rounded-none text-xs h-7"
              >
                By Team
              </Button>
              <Button
                variant={viewMode === "monthly" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("monthly")}
                className="rounded-none text-xs h-7"
              >
                By Month
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey={xAxisKey}
                tick={{ fontSize: 11, fill: "#6b7280" }}
                angle={viewMode === "monthly" ? 0 : -45}
                textAnchor={viewMode === "monthly" ? "middle" : "end"}
                height={viewMode === "team" ? 60 : 30}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#6b7280" }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                }}
              />
              <Legend
                formatter={(value: string) => (
                  <span className="text-sm">
                    {leaveTypeLabels[value] || value}
                  </span>
                )}
              />
              {leaveTypeKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="a"
                  fill={
                    leaveTypeColors[key] ||
                    FALLBACK_COLORS[index % FALLBACK_COLORS.length]
                  }
                  name={key}
                  radius={
                    index === leaveTypeKeys.length - 1
                      ? [4, 4, 0, 0]
                      : index === 0
                        ? [0, 0, 4, 4]
                        : [0, 0, 0, 0]
                  }
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Cards */}
        <div
          className="grid gap-3 mt-6"
          style={{
            gridTemplateColumns: `repeat(${Math.min(leaveTypeKeys.length, 4)}, 1fr)`,
          }}
        >
          {leaveTypeKeys.map((key) => {
            const total = activeData.reduce((s, d) => s + (d[key] || 0), 0);
            return (
              <div key={key} className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground">
                  {leaveTypeLabels[key] || key}
                </div>
                <div
                  className="text-lg font-bold"
                  style={{ color: leaveTypeColors[key] || "#94a3b8" }}
                >
                  {total}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(LeaveTrendsChart);
