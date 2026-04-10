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

import { statusColors } from "@/lib/constant";

const priorityColors: Record<string, string> = {
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
}

function OverviewCharts({
  dateRange,
  selectedMember,
  selectedTeam,
  selectedStatus,
  selectedPriority,
}: OverviewChartsProps) {
  console.log("OverviewCharts Filters →", {
    selectedTeam,
    selectedStatus,
    selectedPriority,
  });

  const teamMultiplier = selectedTeam === "all" ? 1 : 0.6;

  // Trend Data
  const trendData = useMemo(
    () => [
      {
        name: "Mar 29",
        created: Math.floor(18 * teamMultiplier),
        completed: Math.floor(12 * teamMultiplier),
      },
      {
        name: "Mar 30",
        created: Math.floor(24 * teamMultiplier),
        completed: Math.floor(19 * teamMultiplier),
      },
      {
        name: "Mar 31",
        created: Math.floor(15 * teamMultiplier),
        completed: Math.floor(22 * teamMultiplier),
      },
      {
        name: "Apr 1",
        created: Math.floor(28 * teamMultiplier),
        completed: Math.floor(25 * teamMultiplier),
      },
      {
        name: "Apr 2",
        created: Math.floor(22 * teamMultiplier),
        completed: Math.floor(18 * teamMultiplier),
      },
      {
        name: "Apr 3",
        created: Math.floor(19 * teamMultiplier),
        completed: Math.floor(27 * teamMultiplier),
      },
      {
        name: "Apr 4",
        created: Math.floor(26 * teamMultiplier),
        completed: Math.floor(24 * teamMultiplier),
      },
      {
        name: "Apr 5",
        created: Math.floor(31 * teamMultiplier),
        completed: Math.floor(29 * teamMultiplier),
      },
      {
        name: "Apr 6",
        created: Math.floor(23 * teamMultiplier),
        completed: Math.floor(21 * teamMultiplier),
      },
    ],
    [teamMultiplier],
  );

  // Status Distribution Data
  const statusData = useMemo(
    () => [
      {
        name: "Done",
        value: Math.floor(
          selectedStatus === "all" || selectedStatus === "Done"
            ? 142 * teamMultiplier
            : 45,
        ),
        color: statusColors["Done"],
      },
      {
        name: "In progress",
        value: Math.floor(
          selectedStatus === "all" || selectedStatus === "In progress"
            ? 38 * teamMultiplier
            : 12,
        ),
        color: statusColors["In progress"],
      },
      {
        name: "Todo",
        value: Math.floor(
          selectedStatus === "all" || selectedStatus === "Todo"
            ? 45 * teamMultiplier
            : 8,
        ),
        color: statusColors["Todo"],
      },
      {
        name: "On Hold",
        value: Math.floor(
          selectedStatus === "all" || selectedStatus === "On Hold"
            ? 12 * teamMultiplier
            : 3,
        ),
        color: statusColors["On Hold"],
      },
      {
        name: "Cancelled",
        value: Math.floor(
          selectedStatus === "all" || selectedStatus === "Cancelled"
            ? 8 * teamMultiplier
            : 2,
        ),
        color: statusColors["Cancelled"],
      },
    ],
    [selectedStatus, teamMultiplier],
  );

  // Priority Breakdown Data
  const priorityData = useMemo(
    () => [
      {
        name: "Low",
        tasks: Math.floor(
          selectedPriority === "all" || selectedPriority === "Low"
            ? 67 * teamMultiplier
            : 20,
        ),
        fill: priorityColors["Low"],
      },
      {
        name: "Medium",
        tasks: Math.floor(
          selectedPriority === "all" || selectedPriority === "Medium"
            ? 89 * teamMultiplier
            : 30,
        ),
        fill: priorityColors["Medium"],
      },
      {
        name: "High",
        tasks: Math.floor(
          selectedPriority === "all" || selectedPriority === "High"
            ? 54 * teamMultiplier
            : 15,
        ),
        fill: priorityColors["High"],
      },
      {
        name: "Urgent",
        tasks: Math.floor(
          selectedPriority === "all" || selectedPriority === "Urgent"
            ? 35 * teamMultiplier
            : 10,
        ),
        fill: priorityColors["Urgent"],
      },
    ],
    [selectedPriority, teamMultiplier],
  );

  const totalTasks = useMemo(
    () => statusData.reduce((sum, item) => sum + item.value, 0),
    [statusData],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Task Completion Trend */}
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Task Completion Trend</CardTitle>
            <Badge variant="outline">Last 9 days</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Tasks created vs completed over time
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="natural"
                  dataKey="created"
                  stroke="#64748b"
                  strokeWidth={3}
                  name="Created"
                  dot={{ r: 4 }}
                  isAnimationActive={false}
                />
                <Line
                  type="natural"
                  dataKey="completed"
                  stroke="#22c55e"
                  strokeWidth={3}
                  name="Completed"
                  dot={{ r: 4 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Status Distribution</CardTitle>
          <p className="text-sm text-muted-foreground">
            Breakdown by current status
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="h-64 w-64 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1 space-y-4">
              {statusData.map((item) => {
                const percentage =
                  totalTasks > 0
                    ? ((item.value / totalTasks) * 100).toFixed(1)
                    : "0";
                return (
                  <div
                    key={item.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{item.value}</div>
                      <div className="text-xs text-muted-foreground">
                        {percentage}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Priority Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Breakdown</CardTitle>
          <p className="text-sm text-muted-foreground">
            Number of tasks by priority
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={priorityData}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={70} />
                <Tooltip />
                <Bar dataKey="tasks" radius={6} isAnimationActive={false}>
                  {priorityData.map((entry, index) => (
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
}

// Export as memoized component to prevent unnecessary re-renders
export default React.memo(OverviewCharts);
