// components/analytics/components/TeamPerformance.tsx
import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Users, Loader2 } from "lucide-react";
import { format } from "date-fns";
import apiClient from "@/api/client";

interface TeamPerformanceProps {
  dateRange: { from: Date; to: Date };
  selectedMember: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedPriority: string;
  refreshKey?: number;
}

const TeamPerformance: React.FC<TeamPerformanceProps> = ({
  dateRange,
  selectedMember,
  selectedTeam,
  refreshKey,
}) => {
  const [teamData, setTeamData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTeam = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (dateRange.from)
        params.append("dateFrom", format(dateRange.from, "yyyy-MM-dd"));
      if (dateRange.to)
        params.append("dateTo", format(dateRange.to, "yyyy-MM-dd"));
      if (selectedMember !== "all") params.append("memberId", selectedMember);
      if (selectedTeam !== "all") params.append("teamId", selectedTeam);

      const response = await apiClient.get(
        `/analytics/team?${params.toString()}`,
      );
      if (response.data.success) setTeamData(response.data.data);
    } catch (error) {
      console.error("Failed to fetch team:", error);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, selectedMember, selectedTeam]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam, refreshKey]);

  if (isLoading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" /> Team Performance
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Individual productivity and workload across the team
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Member</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>Completion Rate</TableHead>
              <TableHead>On-Time %</TableHead>
              <TableHead>Overdue</TableHead>
              <TableHead>Avg Time</TableHead>
              <TableHead>Workload</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamData.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{member.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{member.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {member.team}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {member.tasksAssigned}
                </TableCell>
                <TableCell className="font-medium text-emerald-600">
                  {member.tasksCompleted}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {member.completionRate}%
                    </span>
                    <Progress
                      value={member.completionRate}
                      className="h-2 w-20"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`font-medium flex items-center gap-1 ${member.onTimeRate >= 85 ? "text-emerald-600" : "text-amber-600"}`}
                  >
                    {member.onTimeRate}%{" "}
                    {member.onTimeRate >= 85 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  {member.overdueCount > 0 ? (
                    <Badge variant="destructive">
                      {member.overdueCount} tasks
                    </Badge>
                  ) : (
                    <span className="text-emerald-600">None</span>
                  )}
                </TableCell>
                <TableCell>{member.avgCompletionTime} days</TableCell>
                <TableCell>
                  <span
                    className={`font-semibold ${member.workload > 100 ? "text-rose-600" : member.workload > 85 ? "text-amber-600" : "text-emerald-600"}`}
                  >
                    {member.workload}%
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {teamData.length === 0 && (
          <p className="text-center py-8 text-muted-foreground">
            No team data available
          </p>
        )}
        <div className="mt-4 text-xs text-muted-foreground">
          ⚠ Workload &gt; 100% indicates potential overload
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(TeamPerformance);
