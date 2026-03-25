"use client";

import { TrendingUp } from "lucide-react";
import { LabelList, Pie, PieChart } from "recharts";

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

export const description = "A pie chart with a label list";

const chartData = [
  { tasks: "Todo", value: 10, fill: "#eab308" },
  { tasks: "Done", value: 30, fill: "#16a34a" },
  { tasks: "Progress", value: 50, fill: "#1e40af" },
];

const chartConfig = {
  tasks: {
    label: "tasks",
  },
  Todo: {
    label: "Todo",
    color: "#eab308",
  },

  Done: {
    label: "Done",
    color: "#22c55e",
  },

  Progress: {
    label: "Progress",
    color: "#1e40af",
  },
} satisfies ChartConfig;

export function ChartPieLabelList() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Tasks status</CardTitle>
        <CardDescription></CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-87.5 [&_.recharts-text]:fill-background"
        >
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent nameKey="tasks" hideLabel />}
            />
            <Pie data={chartData} dataKey="value">
              <LabelList
                dataKey="tasks"
                className="fill-background"
                stroke="none"
                fontSize={12}
                formatter={(value) =>
                  chartConfig[value as keyof typeof chartConfig]?.label
                }
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      {/* <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter> */}
    </Card>
  );
}
