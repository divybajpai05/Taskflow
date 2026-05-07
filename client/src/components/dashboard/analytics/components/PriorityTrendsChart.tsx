// components/analytics/components/PriorityTrendsChart.tsx
import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle } from "lucide-react";
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
  Cell,
} from "recharts";

const PRIORITY_COLORS: Record<string, string> = {
  Low: "#86efac",
  Medium: "#fcd34d",
  High: "#fb923c",
  Urgent: "#ef4444",
};

const TEAM_COLORS: Record<string, string> = {
  Engineering: "#3b82f6",
  Admin: "#8b5cf6",
  Marketing: "#f59e0b",
  "HR & People": "#10b981",
  Sales: "#ef4444",
  Product: "#06b6d4",
  Design: "#ec4899",
};

interface PriorityTrendsChartProps {
  dateRange: { from: Date; to: Date };
  refreshKey?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce(
      (sum: number, entry: any) => sum + (entry.value || 0),
      0,
    );
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 min-w-[200px]">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">
          {label}
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
                  {entry.name}:
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
            Total: {total} tasks
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const PriorityTrendsChart: React.FC<PriorityTrendsChartProps> = ({
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

      const response = await apiClient.get(
        `/analytics/priority-trends?${params.toString()}`,
      );

      if (response.data.success) {
        const apiData = response.data.data || [];

        // If no data from API, check if it's empty array or missing data
        if (Array.isArray(apiData) && apiData.length > 0) {
          // Validate data structure
          const hasValidData = apiData.some(
            (team: any) =>
              team.priorities && team.priorities.some((p: any) => p.value > 0),
          );

          if (!hasValidData) {
            console.log("API returned data but all priority values are 0");
          }
        } else {
          console.log("API returned empty priority trends data");
        }

        setData(apiData);
      } else {
        setError("Failed to load priority trends data");
        setData([]);
      }
    } catch (error) {
      console.error("Failed to fetch priority trends:", error);
      setError("Failed to load priority trends data");
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

  // Transform for stacked bar chart - ensure all priorities exist
  const allPriorities = ["Urgent", "High", "Medium", "Low"];

  const chartData = data.map((team: any) => {
    const entry: any = {
      name: team.team || team.name || "Unknown",
    };

    // Initialize all priorities to 0
    allPriorities.forEach((p) => {
      entry[p] = 0;
    });

    // Fill in actual values
    (team.priorities || []).forEach((p: any) => {
      if (p && p.name && allPriorities.includes(p.name)) {
        entry[p.name] = p.value || 0;
      }
    });

    return entry;
  });

  // Calculate if there's any data to display
  const hasData = chartData.some((team: any) =>
    allPriorities.some((priority) => team[priority] > 0),
  );

  return (
    <Card className="">
      <CardHeader className="border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold">
              Priority Trends by Team
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Task priority distribution across teams
            </p>
          </div>
          <Badge variant="outline">Team-wise</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {hasData ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(value) => (
                    <span className="text-gray-700 dark:text-gray-300 text-sm">
                      {value}
                    </span>
                  )}
                />
                {allPriorities.map((priority) => (
                  <Bar
                    key={priority}
                    dataKey={priority}
                    stackId="a"
                    fill={PRIORITY_COLORS[priority] || "#94a3b8"}
                    radius={priority === "Low" ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    maxBarSize={50}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Priority Data Available
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              {data.length > 0
                ? "Tasks exist but priority distribution data is not available. This may be due to filtering or data processing."
                : "No task priority data found for the selected period. Try adjusting your date range or filters."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(PriorityTrendsChart);
