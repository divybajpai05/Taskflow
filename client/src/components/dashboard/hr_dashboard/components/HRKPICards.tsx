import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  UserCheck,
  UserMinus,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";

interface HRKPICardsProps {
  dateRange: { from: Date; to: Date };
  selectedDepartment: string;
}

// Shape of data coming from backend (only numbers)
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
}) => {
  // Mock data simulating backend response
  const kpiNumbers: HRKPIResponse = useMemo(() => {
    const multiplier = selectedDepartment === "all" ? 1 : 0.85;

    return {
      totalEmployees: Math.floor(1248 * multiplier),
      activeEmployees: Math.floor(1189 * multiplier),
      onLeave: Math.floor(42),
      presentToday: Math.floor(1124 * multiplier),
      absentToday: Math.floor(67 * multiplier),
      newHiresThisMonth: Math.floor(28 * multiplier),
    };
  }, [selectedDepartment]);

  // Frontend configuration
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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {kpiConfig.map((config) => {
        const value = kpiNumbers[config.key];
        const subtitle =
          config.subtitle ||
          (config.key === "activeEmployees"
            ? `${((kpiNumbers.activeEmployees / kpiNumbers.totalEmployees) * 100).toFixed(1)}% of workforce`
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
