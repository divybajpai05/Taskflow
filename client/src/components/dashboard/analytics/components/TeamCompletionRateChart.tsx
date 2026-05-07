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
  Cell,
} from "recharts";

interface TeamCompletionRateChartProps {
  dateRange: { from: Date; to: Date };
  refreshKey?: number;
}

const TeamCompletionRateChart: React.FC<TeamCompletionRateChartProps> = ({
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
        `/analytics/team-completion-rate?${params.toString()}`,
      );
      if (response.data.success) setData(response.data.data);
    } catch (error) {
      console.error("Failed to fetch completion rate:", error);
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
        <CardTitle>Team Task Completion Rate</CardTitle>
        <p className="text-sm text-muted-foreground">
          Completion and on-time delivery by team
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar
                dataKey="completionRate"
                name="Completion %"
                fill="#22c55e"
                radius={[6, 6, 0, 0]}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={i % 2 === 0 ? "#22c55e" : "#3b82f6"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
      </CardContent>
    </Card>
  );
};

export default React.memo(TeamCompletionRateChart);
