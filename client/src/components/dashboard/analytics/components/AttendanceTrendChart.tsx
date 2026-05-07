// components/analytics/components/AttendanceTrendChart.tsx
import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle } from "lucide-react";
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
  Legend,
} from "recharts";

interface AttendanceTrendChartProps {
  dateRange: { from: Date; to: Date };
  refreshKey?: number;
}

const STATUS_COLORS: Record<string, string> = {
  present: "#22c55e",
  absent: "#ef4444",
  late: "#f59e0b",
  halfDay: "#a78bfa",
  onLeave: "#3b82f6",
};

const STATUS_LABELS: Record<string, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  halfDay: "Half Day",
  onLeave: "On Leave",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce(
      (sum: number, entry: any) => sum + (entry.value || 0),
      0,
    );
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 min-w-[180px]">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">
          {format(new Date(label + "T00:00:00"), "MMM dd, yyyy")}
        </p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-600 dark:text-gray-300">
                  {STATUS_LABELS[entry.name] || entry.name}:
                </span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {entry.value}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Total: {total} employees
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const AttendanceTrendChart: React.FC<AttendanceTrendChartProps> = ({
  dateRange,
  refreshKey,
}) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (dateRange.from)
        params.append("dateFrom", format(dateRange.from, "yyyy-MM-dd"));
      if (dateRange.to)
        params.append("dateTo", format(dateRange.to, "yyyy-MM-dd"));

      console.log("Fetching attendance trend with params:", params.toString());

      const response = await apiClient.get(
        `/analytics/attendance-trend?${params.toString()}`,
      );

      if (response.data.success) {
        const apiData = response.data.data || [];
        console.log("Raw API data:", apiData);

        // FIXED: Filter out dates with all zeros (no actual attendance records)
        const filteredData = apiData.filter((d: any) => {
          const total =
            (d.present || 0) +
            (d.absent || 0) +
            (d.late || 0) +
            (d.halfDay || 0) +
            (d.onLeave || 0);
          return total > 0;
        });

        // Sort data by date
        const sortedData = [...filteredData].sort(
          (a: any, b: any) =>
            new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

        console.log("Filtered and sorted data:", sortedData);
        setData(sortedData);
      } else {
        setError("Failed to load attendance data");
        setData([]);
      }
    } catch (error) {
      console.error("Failed to fetch attendance trend:", error);
      setError("Failed to load attendance data");
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading)
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    );

  if (error)
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">{error}</p>
          <button
            onClick={fetchData}
            className="text-blue-600 hover:text-blue-700 text-sm mt-2"
          >
            Try Again
          </button>
        </CardContent>
      </Card>
    );

  // FIXED: Find today's data correctly
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayData = data.find((d) => d.date === todayStr);

  // If no data at all, show empty state
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-5xl mb-4">📅</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Attendance Data Available
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            No attendance records found for the selected period
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate today's stats
  const today = todayData || {};
  const totalToday =
    (today.present || 0) +
    (today.absent || 0) +
    (today.late || 0) +
    (today.halfDay || 0) +
    (today.onLeave || 0);

  const presentPercent =
    totalToday > 0 ? Math.round(((today.present || 0) / totalToday) * 100) : 0;

  // Calculate overall stats
  const totalAbsent = data.reduce((sum, d) => sum + (d.absent || 0), 0);
  const totalHalfDay = data.reduce((sum, d) => sum + (d.halfDay || 0), 0);
  const totalLate = data.reduce((sum, d) => sum + (d.late || 0), 0);
  const totalOnLeave = data.reduce((sum, d) => sum + (d.onLeave || 0), 0);
  const totalPresent = data.reduce((sum, d) => sum + (d.present || 0), 0);

  return (
    <Card className="">
      <CardHeader className="border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold">
              Attendance Trend
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Daily attendance over selected period
            </p>
          </div>
          {todayData && (
            <Badge
              variant="secondary"
              className={
                presentPercent > 80
                  ? "bg-green-500/10 text-green-600"
                  : "bg-amber-500/10 text-amber-600"
              }
            >
              Today: {presentPercent}% present
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickFormatter={(v) => {
                  // FIXED: Parse date correctly
                  const date = new Date(v + "T00:00:00");
                  return format(date, "MM/dd");
                }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#6b7280" }}
                allowDecimals={false}
                domain={[0, "auto"]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => (
                  <span className="text-gray-700 dark:text-gray-300 text-sm">
                    {STATUS_LABELS[value] || value}
                  </span>
                )}
              />
              {Object.entries(STATUS_COLORS).map(([key, color]) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                  name={key}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(AttendanceTrendChart);
