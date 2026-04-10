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
  selectedStatus: string;
}

const departmentColors = {
  Engineering: "#3b82f6",
  Design: "#8b5cf6",
  Marketing: "#ec4899",
  Sales: "#f59e0b",
  HR: "#10b981",
  Finance: "#ef4444",
};

const leaveTypeColors = {
  Vacation: "#22c55e",
  Sick: "#ef4444",
  Personal: "#eab308",
  Maternity: "#8b5cf6",
};

const HRCharts: React.FC<HRChartsProps> = ({
  dateRange,
  selectedDepartment,
  selectedStatus,
}) => {
  const deptMultiplier = selectedDepartment === "all" ? 1 : 0.75;

  // Department Breakdown Data
  const departmentData = useMemo(
    () => [
      {
        name: "Engineering",
        value: Math.floor(385 * deptMultiplier),
        color: departmentColors.Engineering,
      },
      {
        name: "Design",
        value: Math.floor(124 * deptMultiplier),
        color: departmentColors.Design,
      },
      {
        name: "Marketing",
        value: Math.floor(98 * deptMultiplier),
        color: departmentColors.Marketing,
      },
      {
        name: "Sales",
        value: Math.floor(156 * deptMultiplier),
        color: departmentColors.Sales,
      },
      {
        name: "HR",
        value: Math.floor(67 * deptMultiplier),
        color: departmentColors.HR,
      },
      {
        name: "Finance",
        value: Math.floor(89 * deptMultiplier),
        color: departmentColors.Finance,
      },
    ],
    [deptMultiplier],
  );

  // Attendance Trend (Last 10 days)
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

  // Leave Trends by Type
  const leaveTrendData = useMemo(
    () => [
      {
        name: "Vacation",
        count: Math.floor(124 * deptMultiplier),
        fill: leaveTypeColors.Vacation,
      },
      {
        name: "Sick",
        count: Math.floor(67 * deptMultiplier),
        fill: leaveTypeColors.Sick,
      },
      {
        name: "Personal",
        count: Math.floor(45 * deptMultiplier),
        fill: leaveTypeColors.Personal,
      },
      {
        name: "Maternity",
        count: Math.floor(12 * deptMultiplier),
        fill: leaveTypeColors.Maternity,
      },
    ],
    [deptMultiplier],
  );

  // Recruitment Pipeline
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

  // Top Performers (for a simple list card)
  const topPerformers = [
    { name: "Ananya Sharma", dept: "Engineering", rating: 4.9, avatar: "👩‍💻" },
    { name: "Rohan Mehta", dept: "Design", rating: 4.8, avatar: "👨‍🎨" },
    { name: "Priya Kapoor", dept: "Marketing", rating: 4.7, avatar: "👩‍💼" },
    { name: "Arjun Rao", dept: "Sales", rating: 4.9, avatar: "👨‍💼" },
    { name: "Sneha Verma", dept: "HR", rating: 4.6, avatar: "👩‍💼" },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Department Breakdown */}
      <Card className="col-span-1">
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
                  isAnimationActive={false}
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
                  isAnimationActive={false}
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
                <Bar dataKey="count" radius={6} isAnimationActive={false}>
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
                <Bar dataKey="count" radius={6} isAnimationActive={false}>
                  {recruitmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      {/* <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
          <p className="text-sm text-muted-foreground">
            This quarter • Based on performance score
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {topPerformers.map((person, index) => (
              <div
                key={index}
                className="flex flex-col items-center p-4 border rounded-xl hover:shadow-sm transition-all"
              >
                <div className="text-4xl mb-3">{person.avatar}</div>
                <div className="font-semibold text-center">{person.name}</div>
                <div className="text-sm text-muted-foreground text-center">
                  {person.dept}
                </div>
                <div className="mt-2 flex items-center gap-1">
                  <span className="font-bold text-lg">{person.rating}</span>
                  <span className="text-amber-500">★</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
};

export default React.memo(HRCharts);
