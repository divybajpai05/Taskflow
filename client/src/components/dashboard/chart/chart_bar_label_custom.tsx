import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

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
} from "@/components/ui/chart";

const COLORS = [
  "#111827",
  "#1f2937",
  "#374151",
  "#4b5563",
  "#6b7280",
  "#111827",
];

interface DepartmentHeadcountChartProps {
  data?: { department?: string; team?: string; count: number }[];
}

export function DepartmentHeadcountChart({
  data = [],
}: DepartmentHeadcountChartProps) {
  // Transform API data to chart format
   const chartData = data.map((item) => ({
     department: item.department || item.team || "Unknown",
     employees: item.count,
   }));

  const totalEmployees = chartData.reduce(
    (sum, item) => sum + item.employees,
    0,
  );

  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  if (chartData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Department Headcount</CardTitle>
          <CardDescription>
            Number of employees across departments
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[350px]">
          <p className="text-sm text-neutral-500">
            No department data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full flex flex-col justify-between">
      <CardHeader>
        <CardTitle>Department Headcount</CardTitle>
        <CardDescription>
          Number of employees across departments (as of {currentDate})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}} className="h-[350px] w-full">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 20, right: 20, left: 90, bottom: 20 }}
          >
            <CartesianGrid
              horizontal={false}
              strokeDasharray="3 3"
              stroke="#f1f5f9"
            />

            <YAxis
              dataKey="department"
              type="category"
              tickLine={false}
              axisLine={false}
              tickMargin={90}
              width={10}
              tick={{
                fill: "#475569",
                fontSize: 14.5,
                fontWeight: 500,
                textAnchor: "start",
              }}
            />

            <XAxis type="number" />

            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />

            <Bar dataKey="employees" radius={10} barSize={48}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className="flex-col items-start gap-2 text-sm border-t pt-6">
        <div className="flex items-center gap-2 font-medium leading-none text-gray-900">
          Total Workforce <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground">
          {totalEmployees} employees across {chartData.length} departments
        </div>
      </CardFooter>
    </Card>
  );
}
