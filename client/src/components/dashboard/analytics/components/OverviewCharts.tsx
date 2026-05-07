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
  Area,
  AreaChart,
} from "recharts";
import TeamWorkloadChart from "./TeamWorkloadChart";
import TeamCompletionRateChart from "./TeamCompletionRateChart";
import PriorityTrendsChart from "./PriorityTrendsChart";
import AttendanceTrendChart from "./AttendanceTrendChart";
import EmployeeDistributionChart from "./EmployeeDistributionChart";
import LeaveTrendsChart from "./LeaveTrendsChart";

const STATUS_COLORS: Record<string, string> = {
  Done: "#10b981",
  "In progress": "#3b82f6",
  Todo: "#f59e0b",
  "On Hold": "#6366f1",
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600 dark:text-gray-300">
              {entry.name}:
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    // Fixed: Use proper fallback when total is 0
    const total = data.payload?.total || 0;
    const value = data.value || 0;
    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";

    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: data.payload.fill }}
          />
          <span className="font-medium text-gray-900 dark:text-white">
            {data.name}
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          {value} tasks ({percentage}%)
        </p>
      </div>
    );
  }
  return null;
};

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
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <p className="text-gray-500 dark:text-gray-400 animate-pulse">
          Loading analytics...
        </p>
      </div>
    );

  if (!chartData)
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Data Available
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Try adjusting your filters to see results
        </p>
      </div>
    );

  // FIXED: Use nullish coalescing operator (??) instead of OR (||)
  // This ensures 0 stays as 0 instead of becoming 1
  const totalStatus =
    chartData.statusDistribution?.reduce(
      (sum: number, s: any) => sum + (s.value || 0),
      0,
    ) ?? 0;

  return (
    <div className="space-y-8">
      {/* Summary Cards - Only show if there are tasks */}
      {totalStatus > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {chartData.statusDistribution?.map((item: any) => {
            const value = item.value || 0;
            const percentage =
              totalStatus > 0
                ? ((value / totalStatus) * 100).toFixed(1)
                : "0.0";

            return (
              <Card
                key={item.name}
                className="relative overflow-hidden group hover:shadow-lg transition-all duration-300"
              >
                <div
                  className="absolute top-0 left-0 w-1 h-full"
                  style={{ backgroundColor: STATUS_COLORS[item.name] }}
                />
                <div
                  className="absolute inset-0 bg-gradient-to-r opacity-5"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${STATUS_COLORS[item.name]}, transparent)`,
                  }}
                />
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {item.name}
                    </p>
                    <div
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: `${STATUS_COLORS[item.name]}15`,
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[item.name] }}
                      />
                      <span
                        className="text-sm font-semibold whitespace-nowrap"
                        style={{ color: STATUS_COLORS[item.name] }}
                      >
                        {percentage}%
                      </span>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                    {value}
                  </p>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        background: `linear-gradient(90deg, ${STATUS_COLORS[item.name]}, ${STATUS_COLORS[item.name]}aa)`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {percentage}% of total tasks
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Show empty state when no tasks */}
      {totalStatus === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Tasks Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Create tasks to see status distribution and analytics
          </p>
        </div>
      )}

      {/* Task Completion Trend */}
      <Card className="">
        <CardHeader className="border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-neutral-800">
                Task Completion Trend
              </CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Tasks created vs completed over time
              </p>
            </div>
            <Badge variant="outline" className="px-3 py-1">
              Last {chartData.trendData?.length || 10} days
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {chartData.trendData && chartData.trendData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData.trendData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorCreated"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#64748b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorCompleted"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    stroke="#6b7280"
                    fontSize={12}
                    tick={{ fill: "#6b7280" }}
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={12}
                    allowDecimals={false}
                    domain={[0, "auto"]}
                    tickCount={5}
                    tick={{ fill: "#6b7280" }}
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span className="text-gray-600 dark:text-gray-300 text-sm">
                        {value}
                      </span>
                    )}
                  />
                  <Area
                    type="monotone"
                    dataKey="created"
                    stroke="#64748b"
                    strokeWidth={2}
                    fill="url(#colorCreated)"
                    name="Created"
                    dot={{
                      r: 4,
                      fill: "#64748b",
                      strokeWidth: 2,
                      stroke: "#fff",
                    }}
                    activeDot={{
                      r: 6,
                      fill: "#64748b",
                      strokeWidth: 2,
                      stroke: "#fff",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#colorCompleted)"
                    name="Completed"
                    dot={{
                      r: 4,
                      fill: "#10b981",
                      strokeWidth: 2,
                      stroke: "#fff",
                    }}
                    activeDot={{
                      r: 6,
                      fill: "#10b981",
                      strokeWidth: 2,
                      stroke: "#fff",
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <div className="text-4xl mb-3">📈</div>
              <p className="text-sm">
                No trend data available for the selected period
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Distribution */}
        <Card className="">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800">
            <CardTitle className="text-lg font-bold">
              Status Distribution
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Breakdown by current status
            </p>
          </CardHeader>
          <CardContent className="p-6">
            {totalStatus > 0 ? (
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="h-64 w-64 flex-shrink-0 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.statusDistribution?.map(
                          (item: any) => ({
                            ...item,
                            total: totalStatus,
                            value: item.value || 0,
                          }),
                        )}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {(chartData.statusDistribution || []).map(
                          (entry: any, index: number) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={STATUS_COLORS[entry.name] || "#94a3b8"}
                              className="hover:opacity-80 transition-opacity cursor-pointer"
                            />
                          ),
                        )}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {totalStatus}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Total Tasks
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  {(chartData.statusDistribution || []).map((item: any) => {
                    const value = item.value || 0;
                    const percentage =
                      totalStatus > 0
                        ? ((value / totalStatus) * 100).toFixed(1)
                        : "0.0";

                    return (
                      <div key={item.name} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-lg shadow-md"
                              style={{
                                backgroundColor:
                                  STATUS_COLORS[item.name] || "#94a3b8",
                              }}
                            />
                            <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                              {item.name}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {value}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {percentage}%
                            </div>
                          </div>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor:
                                STATUS_COLORS[item.name] || "#94a3b8",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-3xl mb-2">🥧</div>
                <p>No tasks to display in status distribution</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Priority Breakdown */}
        <Card className="">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800">
            <CardTitle className="text-lg font-bold">
              Priority Breakdown
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Number of tasks by priority level
            </p>
          </CardHeader>
          <CardContent className="p-6">
            {chartData.priorityBreakdown &&
            chartData.priorityBreakdown.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData.priorityBreakdown}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      stroke="#6b7280"
                      fontSize={12}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={70}
                      stroke="#6b7280"
                      fontSize={12}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="tasks" radius={[0, 6, 6, 0]} barSize={32}>
                      {(chartData.priorityBreakdown || []).map(
                        (entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PRIORITY_COLORS[entry.name] || "#94a3b8"}
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                          />
                        ),
                      )}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-3xl mb-2">📊</div>
                <p>No priority data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <TeamWorkloadChart dateRange={dateRange} refreshKey={refreshKey} />
          <TeamCompletionRateChart
            dateRange={dateRange}
            refreshKey={refreshKey}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <PriorityTrendsChart dateRange={dateRange} refreshKey={refreshKey} />
          <AttendanceTrendChart dateRange={dateRange} refreshKey={refreshKey} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <EmployeeDistributionChart refreshKey={refreshKey} />
          <LeaveTrendsChart dateRange={dateRange} refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
};

export default React.memo(OverviewCharts);
