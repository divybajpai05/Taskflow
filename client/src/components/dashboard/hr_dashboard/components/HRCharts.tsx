import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

interface HRChartsProps {
  dateRange: { from: Date; to: Date };
  selectedDepartment: string;
}

const HRCharts: React.FC<HRChartsProps> = ({ selectedDepartment }) => {
  const deptMultiplier = selectedDepartment === "all" ? 1 : 0.75;

  const departmentData = useMemo(
    () => [
      {
        name: "Engineering",
        value: Math.floor(385 * deptMultiplier),
        color: "#3b82f6",
      },
      {
        name: "Design",
        value: Math.floor(124 * deptMultiplier),
        color: "#8b5cf6",
      },
      {
        name: "Marketing",
        value: Math.floor(98 * deptMultiplier),
        color: "#ec4899",
      },
      {
        name: "Sales",
        value: Math.floor(156 * deptMultiplier),
        color: "#f59e0b",
      },
      { name: "HR", value: Math.floor(67 * deptMultiplier), color: "#10b981" },
      {
        name: "Finance",
        value: Math.floor(89 * deptMultiplier),
        color: "#ef4444",
      },
    ],
    [deptMultiplier],
  );

  const attendanceTrend = useMemo(
    () => [
      { date: "Mar 8", attendance: 94 },
      { date: "Mar 9", attendance: 91 },
      { date: "Mar 10", attendance: 96 },
      { date: "Mar 11", attendance: 89 },
      { date: "Mar 12", attendance: 93 },
      { date: "Mar 13", attendance: 95 },
      { date: "Mar 14", attendance: 92 },
      { date: "Mar 15", attendance: 97 },
      { date: "Mar 16", attendance: 88 },
      { date: "Mar 17", attendance: 94 },
    ],
    [],
  );

  const leaveTrendData = useMemo(
    () => [
      {
        name: "Vacation",
        count: Math.floor(124 * deptMultiplier),
        fill: "#22c55e",
      },
      { name: "Sick", count: Math.floor(67 * deptMultiplier), fill: "#ef4444" },
      {
        name: "Personal",
        count: Math.floor(45 * deptMultiplier),
        fill: "#eab308",
      },
      {
        name: "Maternity",
        count: Math.floor(12 * deptMultiplier),
        fill: "#8b5cf6",
      },
    ],
    [deptMultiplier],
  );

  const recruitmentData = useMemo(
    () => [
      { stage: "Applied", count: 342, fill: "#64748b" },
      { stage: "Screened", count: 189, fill: "#3b82f6" },
      { stage: "Interview", count: 87, fill: "#8b5cf6" },
      { stage: "Offered", count: 34, fill: "#22c55e" },
      { stage: "Hired", count: 19, fill: "#10b981" },
    ],
    [],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Department Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Department Breakdown</CardTitle>
          <p className="text-sm text-muted-foreground">
            Employee distribution by department
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={120}
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Trend */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Attendance Trend</CardTitle>
              <p className="text-sm text-muted-foreground">
                Last 10 days average attendance (%)
              </p>
            </div>
            <Badge variant="outline">Today: 93%</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[85, 100]} />
                <Tooltip />
                <Line
                  type="natural"
                  dataKey="attendance"
                  stroke="#22c55e"
                  strokeWidth={4}
                  dot={{ r: 5, fill: "#22c55e" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Leave Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Trends</CardTitle>
          <p className="text-sm text-muted-foreground">
            Leave requests by type (This quarter)
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leaveTrendData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={90} />
                <Tooltip />
                <Bar dataKey="count" radius={6}>
                  {leaveTrendData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recruitment Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>Recruitment Pipeline</CardTitle>
          <p className="text-sm text-muted-foreground">Current hiring funnel</p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recruitmentData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" radius={6}>
                  {recruitmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(HRCharts);
