import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Clock,
  TrendingUp,
  Users,
  Target,
  Award,
} from "lucide-react";

interface Insight {
  id: number;
  type: "positive" | "warning" | "critical" | "info";
  title: string;
  description: string;
  impact: string;
  icon: React.ReactNode;
  color: string;
}

interface InsightsSectionProps {
  dateRange: { from: Date; to: Date };
  selectedMember: string;
  selectedTeam: string; // ← NEW
  selectedStatus: string;
  selectedPriority: string;
}

export default function InsightsSection({
  dateRange,
  selectedMember,
  selectedTeam,
  selectedStatus,
  selectedPriority,
}: InsightsSectionProps) {
  console.log("InsightsSection Filters →", {
    selectedMember,
    selectedTeam,
    selectedStatus,
    selectedPriority,
  });

  const insights: Insight[] = [
    {
      id: 1,
      type: "positive",
      title: "Strong On-Time Performance",
      description:
        "Your team completed 87% of tasks on time this period — 5% better than last month.",
      impact: "+12 tasks completed on time",
      icon: <Award className="h-5 w-5" />,
      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950",
    },
    {
      id: 2,
      type: "warning",
      title: "Tasks Stuck in 'In Progress'",
      description:
        selectedStatus === "In progress" || selectedStatus === "all"
          ? "18 tasks have been in 'In Progress' for more than 10 days. Consider reviewing blockers."
          : "Some tasks are taking longer than expected in certain statuses.",
      impact: "Potential bottleneck detected",
      icon: <Clock className="h-5 w-5" />,
      color: "text-amber-600 bg-amber-100 dark:bg-amber-950",
    },
    {
      id: 3,
      type: "critical",
      title:
        selectedMember === "all"
          ? "High Overdue Rate for Rahul Verma"
          : `High Overdue Tasks for ${selectedMember}`,
      description:
        "Rahul has 8 overdue tasks — the highest in the team. His average completion time is 7.2 days.",
      impact: "Team velocity may be affected",
      icon: <AlertTriangle className="h-5 w-5" />,
      color: "text-rose-600 bg-rose-100 dark:bg-rose-950",
    },
    {
      id: 4,
      type: "positive",
      title: "Excellent Work by Priya Singh",
      description:
        "Priya achieved 92% completion rate with zero overdue tasks this period.",
      impact: "Top performer this month",
      icon: <TrendingUp className="h-5 w-5" />,
      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950",
    },
    {
      id: 5,
      type: "info",
      title: "Workload Distribution",
      description:
        "Rahul is currently overloaded (105% workload) while Aarav has capacity.",
      impact: "Consider rebalancing tasks",
      icon: <Users className="h-5 w-5" />,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-950",
    },
    {
      id: 6,
      type: "positive",
      title: "Fastest Average Completion",
      description:
        selectedPriority === "Low" || selectedPriority === "all"
          ? "Tasks with 'Low' priority are being completed 40% faster than 'Urgent' ones."
          : "Good prioritization is helping maintain momentum.",
      impact: "Good prioritization observed",
      icon: <Target className="h-5 w-5" />,
      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950",
    },
  ];

  // Rest of the component remains the same
  const getBadgeVariant = (type: Insight["type"]) => {
    switch (type) {
      case "positive":
        return "default";
      case "warning":
        return "secondary";
      case "critical":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and grid - same as your original */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Key Insights
          </h2>
          <p className="text-muted-foreground">
            AI-powered observations based on your team's performance
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          Coming soon
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {insights.map((insight) => (
          <Card
            key={insight.id}
            className="transition-all hover:shadow-md border-l-4"
            style={{
              borderLeftColor:
                insight.type === "critical"
                  ? "#ef4444"
                  : insight.type === "warning"
                    ? "#f59e0b"
                    : insight.type === "positive"
                      ? "#22c55e"
                      : "#3b82f6",
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className={`p-2 rounded-lg ${insight.color}`}>
                  {insight.icon}
                </div>
                <Badge variant={getBadgeVariant(insight.type)}>
                  {insight.type.toUpperCase()}
                </Badge>
              </div>
              <CardTitle className="text-lg mt-3">{insight.title}</CardTitle>
            </CardHeader>

            <CardContent className="pt-0 space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                {insight.description}
              </p>

              <div className="pt-3 border-t border-border">
                <div className="text-sm font-medium text-foreground">
                  Impact:
                </div>
                <p className="text-sm text-muted-foreground">
                  {insight.impact}
                </p>
              </div>

              {/* Actionable Suggestion */}
              {(insight.type === "warning" || insight.type === "critical") && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
                  💡 <span className="font-medium">Recommendation:</span> Review
                  these tasks in the Kanban board or assign additional support.
                </div>
              )}

              {insight.type === "positive" && (
                <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg text-sm text-emerald-700 dark:text-emerald-400">
                  🎉 Great work! Keep maintaining this momentum.
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Footer - same */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex-1">
              <span className="font-medium">Overall Team Health:</span>{" "}
              <span className="text-emerald-600 font-semibold">Good ↑</span>
            </div>
            <div className="flex-1 text-muted-foreground">
              3 positive insights • 2 areas needing attention
            </div>
            <div className="text-xs text-muted-foreground">
              Insights are auto-generated based on your selected filters
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}