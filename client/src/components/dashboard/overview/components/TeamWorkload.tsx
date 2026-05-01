import { useState, useEffect, useCallback } from "react";
import { Users, ChevronDown, CheckCircle2, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import apiClient from "@/api/client";

interface TeamMember {
  name: string;
  completed: number;
  total: number;
}

interface TeamWorkloadData {
  name: string;
  members: TeamMember[];
}

export function TeamWorkload() {
  const [teams, setTeams] = useState<TeamWorkloadData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTeamWorkload = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/dashboard/team-workload");
      if (response.data.success) {
        setTeams(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch team workload:", error);
      // Fallback: Build from tasks data
      await buildTeamWorkloadFromTasks();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const buildTeamWorkloadFromTasks = async () => {
    try {
      const response = await apiClient.get("/tasks");
      if (response.data.success) {
        const tasks = response.data.data;
        const teamMap = new Map<
          string,
          Map<string, { completed: number; total: number }>
        >();

        tasks.forEach((task: any) => {
          const teamName = task.teamName || "No Team";
          if (!teamMap.has(teamName)) {
            teamMap.set(teamName, new Map());
          }
          const memberMap = teamMap.get(teamName)!;

          const assignees = task.assignees || [];
          assignees.forEach((name: string) => {
            if (!memberMap.has(name)) {
              memberMap.set(name, { completed: 0, total: 0 });
            }
            const stats = memberMap.get(name)!;
            stats.total++;
            if (task.status === "DONE") {
              stats.completed++;
            }
          });
        });

        const teamData: TeamWorkloadData[] = [];
        teamMap.forEach((memberMap, teamName) => {
          const members: TeamMember[] = [];
          memberMap.forEach((stats, name) => {
            members.push({ name, ...stats });
          });
          teamData.push({ name: teamName, members });
        });

        setTeams(teamData);
      }
    } catch (error) {
      console.error("Failed to build team workload:", error);
    }
  };

  useEffect(() => {
    fetchTeamWorkload();
  }, [fetchTeamWorkload]);

  if (isLoading) {
    return (
      <Card className="border-none bg-white/50 backdrop-blur-sm text-neutral-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            Team Workload
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none bg-white/50 backdrop-blur-sm text-neutral-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          Team Workload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {teams.length === 0 ? (
          <div className="flex justify-center py-8 text-sm text-muted-foreground">
            No team data available
          </div>
        ) : (
          teams.map((team) => (
            <Collapsible
              key={team.name}
              className="group border rounded-xl overflow-hidden bg-white"
            >
              <CollapsibleTrigger className="flex items-center justify-between cursor-pointer w-full p-4 hover:bg-neutral-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <Users className="size-4" />
                  </div>
                  <span className="font-medium text-neutral-800">
                    {team.name}
                  </span>
                </div>
                <ChevronDown className="size-4 text-neutral-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>

              <CollapsibleContent className="px-4 pb-4 space-y-5 animate-in fade-in slide-in-from-top-1">
                {team.members.map((member) => {
                  const percentage =
                    member.total > 0
                      ? (member.completed / member.total) * 100
                      : 0;
                  return (
                    <div key={member.name} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-sm font-semibold text-neutral-700">
                            {member.name}
                          </p>
                          <p className="text-[11px] text-neutral-500 flex items-center gap-1">
                            <CheckCircle2 className="size-3 text-green-500" />
                            {member.completed} of {member.total} tasks finished
                          </p>
                        </div>
                        <span className="text-xs font-bold text-neutral-600">
                          {Math.round(percentage)}%
                        </span>
                      </div>
                      <Progress
                        value={percentage}
                        className="h-2 bg-neutral-100"
                        indicatorClassName={
                          percentage > 80 ? "bg-green-500" : "bg-blue-600"
                        }
                      />
                    </div>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          ))
        )}
      </CardContent>
    </Card>
  );
}
