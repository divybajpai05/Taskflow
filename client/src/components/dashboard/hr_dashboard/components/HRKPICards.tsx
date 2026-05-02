// components/hr/components/HRKPICards.tsx
import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  UserCheck,
  UserMinus,
  CheckCircle,
  XCircle,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import apiClient from "@/api/client";

interface HRKPICardsProps {
  dateRange: { from: Date; to: Date };
  selectedDepartment: string;
  refreshKey?: number;
}

interface HRKPIResponse {
  totalEmployees: number;
  activeEmployees: number;
  onLeave: number;
  presentToday: number;
  absentToday: number;
  newHiresThisMonth: number;
}

const HRKPICards: React.FC<HRKPICardsProps> = ({
  dateRange,
  selectedDepartment,
  refreshKey,
}) => {
  const [kpiData, setKpiData] = useState<HRKPIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchKPI = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedDepartment !== "all")
        params.append("department", selectedDepartment);
      if (dateRange.from)
        params.append("dateFrom", format(dateRange.from, "yyyy-MM-dd"));
      if (dateRange.to)
        params.append("dateTo", format(dateRange.to, "yyyy-MM-dd"));

      const response = await apiClient.get(
        `/hr-dashboard/kpi?${params.toString()}`,
      );
      if (response.data.success) {
        setKpiData(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch KPI data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDepartment, dateRange]);

  useEffect(() => {
    fetchKPI();
  }, [fetchKPI, refreshKey]);

  const kpiConfig = [
    {
      key: "totalEmployees" as const,
      title: "Total Employees",
      icon: <Users className="h-5 w-5 text-muted-foreground" />,
      subtitle: "+12 from last month",
    },
    {
      key: "activeEmployees" as const,
      title: "Active Employees",
      icon: <UserCheck className="h-5 w-5 text-green-600" />,
      valueColor: "text-blue-600",
    },
    {
      key: "onLeave" as const,
      title: "On Leave",
      icon: <UserMinus className="h-5 w-5 text-orange-600" />,
      subtitle: "Currently",
      valueColor: "text-orange-600",
    },
    {
      key: "presentToday" as const,
      title: "Present Today",
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      subtitle: "Today",
      valueColor: "text-green-600",
    },
    {
      key: "absentToday" as const,
      title: "Absent Today",
      icon: <XCircle className="h-5 w-5 text-red-600" />,
      subtitle: "Today",
      valueColor: "text-red-600",
    },
    {
      key: "newHiresThisMonth" as const,
      title: "New Hires",
      icon: <TrendingUp className="h-5 w-5 text-muted-foreground" />,
      subtitle: "This month",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {kpiConfig.map((config) => {
        const value = kpiData?.[config.key] || 0;
        const subtitle =
          config.subtitle ||
          (config.key === "activeEmployees" && kpiData
            ? `${((kpiData.activeEmployees / kpiData.totalEmployees) * 100).toFixed(1)}% of workforce`
            : "");

        return (
          <Card key={config.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {config.title}
              </CardTitle>
              {config.icon}
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${config.valueColor || ""}`}>
                {value.toLocaleString()}
              </div>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default React.memo(HRKPICards);
