// components/hr/components/HRCharts.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import apiClient from "@/api/client";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

interface HRChartsProps {
  dateRange: { from: Date; to: Date };
  selectedDepartment: string;
  refreshKey?: number;
}

interface ChartData {
  departmentDistribution: { department: string; count: number }[];
  attendanceTrend: {
    date: string;
    present: number;
    absent: number;
    total: number;
    percentage: number;
  }[];
  leaveTrend: { month: string; count: number }[];
}

const PIE_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
];
const LEAVE_COLORS = ["#f97316", "#ef4444", "#8b5cf6", "#ec4899"];

const HRCharts: React.FC<HRChartsProps> = ({
  dateRange,
  selectedDepartment,
  refreshKey,
}) => {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCharts = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedDepartment !== "all")
        params.append("department", selectedDepartment);
      if (dateRange.from)
        params.append("dateFrom", format(dateRange.from, "yyyy-MM-dd"));
      if (dateRange.to)
        params.append("dateTo", format(dateRange.to, "yyyy-MM-dd"));

      const response = await apiClient.get(
        `/hr-dashboard/charts?${params.toString()}`,
      );
      if (response.data.success) {
        setChartData(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch chart data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, selectedDepartment]);

  useEffect(() => {
    fetchCharts();
  }, [fetchCharts, refreshKey]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Department Breakdown - Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Department Breakdown
          </CardTitle>
          <CardDescription>Employee distribution by department</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData?.departmentDistribution &&
          chartData.departmentDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData.departmentDistribution}
                  dataKey="count"
                  nameKey="department"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  paddingAngle={3}
                >
                  {chartData.departmentDistribution.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span className="text-xs text-slate-600">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">
              No department data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance Trend - Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Attendance Trend
          </CardTitle>
          <CardDescription>Last 10 days average attendance (%)</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData?.attendanceTrend &&
          chartData.attendanceTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData.attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                  formatter={(value: any) => [`${value}%`, "Attendance"]}
                />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#3b82f6" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">
              No attendance data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leave Distribution - Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Leave Distribution
          </CardTitle>
          <CardDescription>Leave types breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData?.leaveTrend && chartData.leaveTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData.leaveTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#f97316"
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                >
                  {chartData.leaveTrend.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={LEAVE_COLORS[index % LEAVE_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">
              No leave data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(HRCharts);
