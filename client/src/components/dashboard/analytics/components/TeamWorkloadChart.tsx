// components/analytics/components/TeamWorkloadChart.tsx
import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Cell,
} from "recharts";

const COLORS = ["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#8b5cf6"];

interface TeamWorkloadChartProps {
  dateRange: { from: Date; to: Date };
  refreshKey?: number;
}

const TeamWorkloadChart: React.FC<TeamWorkloadChartProps> = ({
  dateRange,
  refreshKey,
}) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (dateRange.from)
        params.append("dateFrom", format(dateRange.from, "yyyy-MM-dd"));
      if (dateRange.to)
        params.append("dateTo", format(dateRange.to, "yyyy-MM-dd"));
      const response = await apiClient.get(
        `/analytics/team-workload?${params.toString()}`,
      );
      if (response.data.success) setData(response.data.data);
    } catch (error) {
      console.error("Failed to fetch team workload:", error);
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
  if (!data.length)
    return (
      <div className="text-center py-12 text-muted-foreground">
        No data available
      </div>
    );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Team Workload</CardTitle>
          <Badge variant="outline">All Teams</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Task distribution across teams
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis
                dataKey="name"
                type="category"
                width={80}
                tick={{ fontSize: 12 }}
              />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="completedTasks"
                name="Completed"
                stackId="a"
                fill="#22c55e"
                radius={[0, 0, 4, 4]}
              />
              <Bar
                dataKey="activeTasks"
                name="Active"
                stackId="a"
                fill="#3b82f6"
              />
              <Bar
                dataKey="overdueTasks"
                name="Overdue"
                stackId="a"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(TeamWorkloadChart);
