
import { TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const PRIORITY_COLORS: Record<string, string> = {
  Urgent: "#ef4444",
  High: "#f97316",
  Medium: "#eab308",
  Low: "#22c55e",
};

interface PriorityBreakdown {
  priority: string;
  count: number;
}

const chartConfig = {
  value: {
    label: "Tasks",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

interface PriorityBreakdownChartProps {
  data?: PriorityBreakdown[];
}

export function PriorityBreakdownChart({
  data = [],
}: PriorityBreakdownChartProps) {
  // Transform API data to chart format with colors
  const chartData = data.map((item) => ({
    priority: item.priority,
    value: item.count,
    fill: PRIORITY_COLORS[item.priority] || "#94a3b8",
  }));

  const totalTasks = chartData.reduce((sum, item) => sum + item.value, 0);

  // Find highest priority
  const highestPriority = chartData.reduce(
    (max, item) => (item.value > max.value ? item : max),
    chartData[0] || { priority: "N/A", value: 0 },
  );

  if (chartData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Priority Breakdown</CardTitle>
          <CardDescription>
            Distribution of tasks by priority level
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[320px]">
          <p className="text-sm text-neutral-500">No priority data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Priority Breakdown</CardTitle>
        <CardDescription>
          Distribution of tasks by priority level
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[320px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{ top: 30, right: 20, left: 20, bottom: 10 }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="#f1f5f9"
            />

            <XAxis
              dataKey="priority"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              tick={{
                fill: "#64748b",
                fontSize: 13,
                fontWeight: 500,
              }}
            />

            <YAxis hide />

            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />

            <Bar dataKey="value" radius={10} barSize={55}>
              <LabelList
                dataKey="value"
                position="top"
                offset={14}
                className="fill-foreground font-semibold"
                fontSize={14}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className="flex-col items-start gap-2 text-sm border-t pt-5">
        <div className="flex items-center gap-2 font-medium leading-none text-gray-900">
          Total Tasks <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground">
          {totalTasks} tasks • Highest in {highestPriority.priority} Priority
        </div>
      </CardFooter>
    </Card>
  );
}
