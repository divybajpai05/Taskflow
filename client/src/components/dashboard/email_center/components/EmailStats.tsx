// components/email/EmailStats.tsx
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import apiClient from "@/api/client";

interface EmailStatsData {
  totalSent: number;
  scheduled: number;
  delivered: number;
  bounced: number;
  thisMonth?: {
    totalSent: number;
    scheduled: number;
    delivered: number;
    bounced: number;
  };
}

export const EmailStats: React.FC = () => {
  const [stats, setStats] = useState<EmailStatsData>({
    totalSent: 0,
    scheduled: 0,
    delivered: 0,
    bounced: 0,
    thisMonth: { totalSent: 0, scheduled: 0, delivered: 0, bounced: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/email/stats");
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch email stats:", error);
      // Keep default zeros on error
    } finally {
      setIsLoading(false);
    }
  };

  const statsData = [
    {
      title: "Total Sent",
      value: stats.totalSent,
      thisMonth: stats.thisMonth?.totalSent || 0,
      icon: Mail,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-950",
    },
    {
      title: "Scheduled",
      value: stats.scheduled,
      thisMonth: stats.thisMonth?.scheduled || 0,
      icon: Clock,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-950",
    },
    {
      title: "Delivered",
      value: stats.delivered,
      thisMonth: stats.thisMonth?.delivered || 0,
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-950",
    },
    {
      title: "Bounced",
      value: stats.bounced,
      thisMonth: stats.thisMonth?.bounced || 0,
      icon: XCircle,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-950",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-full p-2 ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="text-2xl font-bold">
                  {stat.value.toLocaleString()}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                This month:{" "}
                <span className="font-medium">
                  {stat.thisMonth.toLocaleString()}
                </span>
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
