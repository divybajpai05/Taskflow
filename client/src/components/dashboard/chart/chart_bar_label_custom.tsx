"use client";

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

const chartData = [
  { department: "Engineering", employees: 124 },
  { department: "Marketing", employees: 68 },
  { department: "Design", employees: 45 },
  { department: "Finance", employees: 32 },
  { department: "HR", employees: 18 },
  { department: "Sales", employees: 57 },
];

const COLORS = [
  "#111827",
  "#1f2937",
  "#374151",
  "#4b5563",
  "#6b7280",
  "#111827",
];

export function DepartmentHeadcountChart() {
  const totalEmployees = chartData.reduce(
    (sum, item) => sum + item.employees,
    0,
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Department Headcount</CardTitle>
        <CardDescription>
          Number of employees across departments (as of April 2026)
        </CardDescription>
      </CardHeader>
      <CardContent className="">
        <ChartContainer config={{}} className="h-[350px] w-full">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 20, right: 20, left: 90, bottom: 20 }} // Increased left margin for better alignment
          >
            <CartesianGrid
              horizontal={false}
              strokeDasharray="3 3"
              stroke="#f1f5f9"
            />

            {/* Left-aligned Department Names */}
            <YAxis
              dataKey="department"
              type="category"
              tickLine={false}
              axisLine={false}
              tickMargin={90} // Extra space between text and bars
              width={10} // Wider area for department names
              tick={{
                fill: "#475569",
                fontSize: 14.5,
                fontWeight: 500,
                textAnchor: "start", // Forces left alignment
              }}
            />

            <XAxis type="number" />

            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />

            {/* Thicker & Nicer Bars */}
            <Bar
              dataKey="employees"
              radius={10}
              barSize={48} // Thicker bars
            >
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
          {totalEmployees} employees across 6 departments
        </div>
      </CardFooter>
    </Card>
  );
}
