// components/hr/components/HRCharts.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users } from "lucide-react";
import { format, differenceInDays } from "date-fns";
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
  selectedMember?: string;
  refreshKey?: number;
}

interface LeaveTypeItem {
  type: string;
  count: number;
  color: string;
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
  leaveByType: LeaveTypeItem[];
  monthlyLeaveTrend: any[]; // Dynamic keys
  todayLeaveCount: number;
  todayLeaveTypes: LeaveTypeItem[];
  leaveTypeNames: string[];
  leaveTypeColors: Record<string, string>;
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

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce(
      (sum: number, entry: any) => sum + (entry.value || 0),
      0,
    );
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 text-sm">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">
          {label}
        </p>
        {payload.map(
          (entry: any, index: number) =>
            entry.value > 0 && (
              <div
                key={index}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: entry.color || entry.fill }}
                  />
                  <span className="text-gray-600 dark:text-gray-300">
                    {entry.name}:
                  </span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {entry.value}
                </span>
              </div>
            ),
        )}
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <span className="text-gray-500">Total:</span>
          <span className="font-bold text-gray-900 dark:text-white">
            {total} employees
          </span>
        </div>
      </div>
    );
  }
  return null;
};

const HRCharts: React.FC<HRChartsProps> = ({
  dateRange,
  selectedDepartment,
  selectedMember = "all",
  refreshKey,
}) => {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isDefaultDateRange = React.useMemo(() => {
    const today = new Date();
    const fromIsToday =
      format(dateRange.from, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
    const toIsToday =
      format(dateRange.to, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
    return fromIsToday && toIsToday;
  }, [dateRange]);

  const daysInRange = React.useMemo(() => {
    return differenceInDays(dateRange.to, dateRange.from) + 1;
  }, [dateRange]);

  const fetchCharts = useCallback(async () => {
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
        `/hr-dashboard/charts?${params.toString()}`,
      );
      if (response.data.success) setChartData(response.data.data);
    } catch (error) {
      console.error("Failed to fetch chart data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, selectedDepartment, selectedMember]);

  useEffect(() => {
    fetchCharts();
  }, [fetchCharts, refreshKey]);

  if (isLoading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );

  const todayLeaveTotal =
    chartData?.todayLeaveTypes?.reduce((sum, item) => sum + item.count, 0) || 0;

  // Build dynamic leave type keys from data
  const leaveTypeKeys = chartData?.leaveTypeNames || [];
  const leaveTypeColors = chartData?.leaveTypeColors || {};

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Department Breakdown */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            Department Breakdown
          </CardTitle>
          <CardDescription className="text-xs">
            Employee distribution by department
          </CardDescription>
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

      {/* Attendance Trend */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">
                Attendance Trend
              </CardTitle>
              <CardDescription className="text-xs">
                {isDefaultDateRange
                  ? `Last ${Math.min(daysInRange, 10)} days average attendance (%)`
                  : `${daysInRange} days average attendance (%)`}
              </CardDescription>
            </div>
            {!isDefaultDateRange && (
              <Badge variant="outline" className="text-xs">
                {format(dateRange.from, "dd/MM")} -{" "}
                {format(dateRange.to, "dd/MM")}
              </Badge>
            )}
          </div>
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
                  interval="preserveStartEnd"
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

      {/* Leave Distribution - DYNAMIC */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">
                Leave Distribution
              </CardTitle>
              <CardDescription className="text-xs">
                Monthly headcount by leave type
              </CardDescription>
            </div>
            {todayLeaveTotal > 0 && (
              <Badge
                variant="secondary"
                className="bg-orange-100 text-orange-700 text-xs"
              >
                <Users className="h-3 w-3 mr-1" />
                {todayLeaveTotal} today
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {chartData?.monthlyLeaveTrend &&
          chartData.monthlyLeaveTrend.length > 0 ? (
            <div className="space-y-4">
              {/* Dynamic Stacked Bar Chart */}
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={chartData.monthlyLeaveTrend}
                  margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    vertical={false}
                  />
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
                    allowDecimals={false}
                    width={25}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  {leaveTypeKeys.map((typeName, index) => (
                    <Bar
                      key={typeName}
                      dataKey={typeName}
                      stackId="a"
                      fill={
                        leaveTypeColors[typeName] ||
                        PIE_COLORS[index % PIE_COLORS.length]
                      }
                      name={typeName}
                      barSize={32}
                      radius={
                        index === leaveTypeKeys.length - 1
                          ? [4, 4, 0, 0]
                          : [0, 0, 0, 0]
                      }
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>

              {/* Dynamic Legend */}
              <div className="flex flex-wrap gap-3 justify-center">
                {leaveTypeKeys.map((typeName) => (
                  <div key={typeName} className="flex items-center gap-1.5">
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{
                        backgroundColor: leaveTypeColors[typeName] || "#94a3b8",
                      }}
                    />
                    <span className="text-xs text-gray-600">{typeName}</span>
                  </div>
                ))}
              </div>

              {/* Today's Leave Summary */}
              {chartData.todayLeaveTypes &&
                chartData.todayLeaveTypes.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      Today's Leave Summary
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {chartData.todayLeaveTypes.map((item) => (
                        <div
                          key={item.type}
                          className="flex flex-col items-left gap-1.5 justify-between"
                        >
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-xs text-gray-600 truncate">
                              {item.type}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-neutral-600 dark:text-white">
                            Today {item.count} on leave
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[250px] text-sm text-muted-foreground">
              <Users className="h-8 w-8 mb-2 text-gray-300" />
              <p>No leave data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(HRCharts);
