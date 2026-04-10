import React, { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface KPICardsProps {
  dateRange: { from: Date; to: Date };
  selectedMember: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedPriority: string;
}

function KPICards({
  dateRange,
  selectedMember,
  selectedTeam,
  selectedStatus,
  selectedPriority,
}: KPICardsProps) {
  console.log("KPICards Filters →", {
    selectedMember,
    selectedTeam,
    selectedStatus,
    selectedPriority,
  });

  // Compute metrics with useMemo to prevent recalculation on every render
  const metrics = useMemo(() => {
    const memberMultiplier = selectedMember === "all" ? 1 : 0.35;
    const teamMultiplier = selectedTeam === "all" ? 1 : 0.65;

    return {
      totalTasks: Math.floor(248 * memberMultiplier * teamMultiplier),
      completed: Math.floor(189 * memberMultiplier * teamMultiplier),
      overdue: Math.floor(
        selectedMember === "all" && selectedTeam === "all" ? 27 : 9,
      ),
      inProgress: Math.floor(32 * memberMultiplier * teamMultiplier),
      onTimeCompletion:
        selectedMember === "all" && selectedTeam === "all" ? 87 : 83,
      avgCompletionTime:
        selectedMember === "all" && selectedTeam === "all" ? 5.2 : 6.1,
      previousOnTime: 82,
    };
  }, [selectedMember, selectedTeam]);

  const completionChange = metrics.onTimeCompletion - metrics.previousOnTime;
  const isPositiveChange = completionChange > 0;

  // Memoize cards array to avoid recreating it on every render
  const cards = useMemo(() => {
    return [
      {
        title: "Total Tasks",
        value: metrics.totalTasks.toLocaleString(),
        icon: Target,
        change: "+12%",
        changeType: "neutral" as const,
        description: "Created in selected period",
        sparkline: true,
      },
      {
        title: "Completed",
        value: metrics.completed.toLocaleString(),
        icon: CheckCircle,
        change: "+18%",
        changeType: "positive" as const,
        description: "Tasks marked as Done",
        sparkline: true,
      },
      {
        title: "Overdue",
        value: metrics.overdue.toLocaleString(),
        icon: AlertTriangle,
        change: "-4%",
        changeType: "positive" as const,
        description: "Past due date",
        highlight: metrics.overdue > 0,
      },
      {
        title: "On-Time Completion",
        value: `${metrics.onTimeCompletion}%`,
        icon: TrendingUp,
        change: `${isPositiveChange ? "+" : ""}${completionChange}%`,
        changeType: isPositiveChange ? "positive" : "negative",
        description: "vs previous period",
      },
      {
        title: "Avg. Completion Time",
        value: `${metrics.avgCompletionTime} days`,
        icon: Clock,
        change: "-0.8 days",
        changeType: "positive" as const,
        description: "From creation to Done",
      },
      {
        title: "In Progress",
        value: metrics.inProgress.toLocaleString(),
        icon: Target,
        change: "+3",
        changeType: "neutral" as const,
        description: "Currently active",
      },
    ];
  }, [metrics, completionChange, isPositiveChange]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card
            key={index}
            className={`transition-all hover:shadow-md ${
              card.highlight
                ? "border-rose-500/50 bg-rose-50/50 dark:bg-rose-950/30"
                : ""
            }`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <Icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>

            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold tracking-tight">
                  {card.value}
                </div>

                <Badge variant="secondary" className="ml-2 text-xs">
                  {card.change}
                </Badge>
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                {card.description}
              </p>

              {card.sparkline && (
                <div className="mt-4 h-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={mockSparklineData}
                      // isAnimationActive={false}
                    >
                      <Line
                        type="natural"
                        dataKey="value"
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Mock sparkline data
const mockSparklineData = [
  { value: 12 },
  { value: 15 },
  { value: 18 },
  { value: 14 },
  { value: 22 },
  { value: 25 },
  { value: 28 },
  { value: 32 },
];

// Export as memoized component to prevent unnecessary re-renders
export default React.memo(KPICards);
