// components/analytics/components/EmployeeDistributionChart.tsx
import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
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
  PieChart,
  Pie,
} from "recharts";

const EMPLOYMENT_COLORS: Record<string, string> = {
  fullTime: "#3b82f6",
  contract: "#f59e0b",
  remote: "#8b5cf6",
};

interface EmployeeDistributionChartProps {
  refreshKey?: number;
}

const EmployeeDistributionChart: React.FC<EmployeeDistributionChartProps> = ({
  refreshKey,
}) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/analytics/employee-distribution");
      if (response.data.success) setData(response.data.data);
    } catch (error) {
      console.error("Failed to fetch employee distribution:", error);
    } finally {
      setIsLoading(false);
    }
  }, [refreshKey]);

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

  // Calculate totals for pie chart
  const totals = {
    fullTime: data.reduce((s, d) => s + (d.fullTime || 0), 0),
    contract: data.reduce((s, d) => s + (d.contract || 0), 0),
    remote: data.reduce((s, d) => s + (d.remote || 0), 0),
  };
  const pieData = [
    {
      name: "Full-time",
      value: totals.fullTime,
      fill: EMPLOYMENT_COLORS.fullTime,
    },
    {
      name: "Contract",
      value: totals.contract,
      fill: EMPLOYMENT_COLORS.contract,
    },
    { name: "Remote", value: totals.remote, fill: EMPLOYMENT_COLORS.remote },
  ].filter((d) => d.value > 0);
  const grandTotal = totals.fullTime + totals.contract + totals.remote;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Employee Distribution</CardTitle>
          <Badge variant="outline">{data.length} Departments</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          By department and employment type
        </p>
      </CardHeader>
      <CardContent>
        {/* Pie Chart - Employment Type */}
        <div className="flex items-center gap-6 mb-6">
          <div className="h-52 w-52 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={pieData[i].fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-3">
            {pieData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-sm">{item.name}</span>
                </div>
                <span className="font-semibold">
                  {item.value} (
                  {grandTotal > 0
                    ? Math.round((item.value / grandTotal) * 100)
                    : 0}
                  %)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart - By Department */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="fullTime"
                name="Full-time"
                stackId="a"
                fill={EMPLOYMENT_COLORS.fullTime}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="contract"
                name="Contract"
                stackId="a"
                fill={EMPLOYMENT_COLORS.contract}
              />
              <Bar
                dataKey="remote"
                name="Remote"
                stackId="a"
                fill={EMPLOYMENT_COLORS.remote}
                radius={[0, 0, 4, 4]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(EmployeeDistributionChart);
