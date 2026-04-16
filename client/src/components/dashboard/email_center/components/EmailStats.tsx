// components/email/EmailStats.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Clock, CheckCircle, XCircle, Send } from "lucide-react";

interface EmailStatsProps {
  // Optional: Make it dynamic with props
  totalSent?: number;
  scheduled?: number;
  delivered?: number;
  bounced?: number;
}

export const EmailStats: React.FC<EmailStatsProps> = ({
  totalSent = 0,
  scheduled = 0,
  delivered = 0,
  bounced = 0,
}) => {
  const stats = [
    {
      title: "Total Sent",
      value: totalSent,
      thisMonth: 24,
      icon: Mail,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Scheduled",
      value: scheduled,
      thisMonth: 3,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Delivered",
      value: delivered,
      thisMonth: 21,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Bounced",
      value: bounced,
      thisMonth: 0,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  // Mock data for demo - in real app, fetch from API
  const mockData = {
    totalSent: 156,
    scheduled: 2,
    delivered: 154,
    bounced: 0,
  };

  const displayData =
    totalSent > 0 ? { totalSent, scheduled, delivered, bounced } : mockData;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const value =
          displayData[
            stat.title
              .toLowerCase()
              .replace(" ", "") as keyof typeof displayData
          ];

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
              <div className="text-2xl font-bold">{value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                This month:{" "}
                <span className="font-medium">{stat.thisMonth}</span>
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
