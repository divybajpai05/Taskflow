import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  UserCheck,
  BriefcaseBusiness,
  Plane,
  UserMinus,
  XCircle,
  CheckCircle,
} from "lucide-react";

interface HRKPICardsProps {
  dateRange: { from: Date; to: Date };
  selectedDepartment: string;
  selectedStatus: string;
}

const HRKPICards: React.FC<HRKPICardsProps> = ({
  dateRange,
  selectedDepartment,
  selectedStatus,
}) => {
  // Mock data with slight variations based on filters (for realism)
  const multiplier = selectedDepartment === "all" ? 1 : 0.85;

  const kpiData = {
    totalEmployees: Math.floor(1248 * multiplier),
    activeEmployees: Math.floor(1189 * multiplier),
    onLeave: Math.floor(42 * (selectedStatus === "onleave" ? 1.8 : 1)),
    presentToday: Math.floor(28 * multiplier),
    AbsentToday: 19,
  };

  const trendColors = {
    positive: "text-green-600",
    neutral: "text-muted-foreground",
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {/* Total Employees */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
          <Users className="h-5 w-5 " />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {kpiData.totalEmployees.toLocaleString()}
          </div>
          <p className={`text-xs mt-1 ${trendColors.positive}`}>
            +12 from last month
          </p>
        </CardContent>
      </Card>

      {/* Active Employees */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Active Employees
          </CardTitle>
          <UserCheck className="h-5 w-5 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600">
            {kpiData.activeEmployees.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {((kpiData.activeEmployees / kpiData.totalEmployees) * 100).toFixed(
              1,
            )}
            % of workforce
          </p>
        </CardContent>
      </Card>

      {/* On Leave */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">On Leave</CardTitle>
          <UserMinus className="h-5 w-5 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{kpiData.onLeave}</div>
          <p className="text-xs text-muted-foreground mt-1">Total</p>
        </CardContent>
      </Card>

      {/* New Hires This Month */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Present Today</CardTitle>
          <CheckCircle className="h-5 w-5 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {kpiData.presentToday}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Today</p>
        </CardContent>
      </Card>

      {/* Open Positions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
          <XCircle className="h-5 w-5 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-orange-600">
            {kpiData.AbsentToday}
          </div>
          <p className="text-xs text-orange-600 mt-1">Today</p>
        </CardContent>
      </Card>

      {/* Average Satisfaction */}
      {/* <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Avg. Satisfaction
          </CardTitle>
          <Smile className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{kpiData.avgSatisfaction}</div>
          <p className="text-xs text-muted-foreground mt-1">
            From last engagement survey
          </p>
        </CardContent>
      </Card> */}
    </div>
  );
};

export default React.memo(HRKPICards);
