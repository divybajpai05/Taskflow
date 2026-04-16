"use client";

import { TrendingUp } from "lucide-react";
import { Pie, PieChart, Cell, Label } from "recharts";

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
  { name: "In Progress", value: 50, fill: "#3b82f6" },
  { name: "Done", value: 30, fill: "#22c55e" },
  { name: "Todo", value: 10, fill: "#eab308" },
  { name: "On Hold", value: 15, fill: "#64748b" },
  { name: "Cancelled", value: 8, fill: "#ef4444" },
];

const totalTasks = chartData.reduce((sum, item) => sum + item.value, 0);

export function TaskStatusChart() {
  return (
    <Card className="w-full flex flex-col">
      <CardHeader className="items-center pb-2">
        <CardTitle>Task Status</CardTitle>
        <CardDescription>Current distribution of all tasks</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pb-0 flex items-center justify-center">
        <ChartContainer
          config={{}}
          className="mx-auto aspect-square max-h-[320px] w-full"
        >
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent hideLabel />}
              cursor={false}
            />

            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={85}
              outerRadius={130}
              strokeWidth={4}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}

              {/* Center Total Label */}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-4xl font-bold"
                        >
                          {totalTasks}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-sm"
                        >
                          Tasks
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>

      {/* Legend */}
      <CardFooter className="flex-col gap-3 pt-4 border-t">
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 w-full text-sm">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.fill }}
              />
              <div className="flex justify-between w-full">
                <span className="text-muted-foreground">{item.name}</span>
                <span className="font-medium text-foreground">
                  {item.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}
