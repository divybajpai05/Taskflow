import { Users, ChevronDown, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TeamData = [
  {
    name: "Design Team",
    members: [
      { name: "Prashant Thakur", completed: 8, total: 12 },
      { name: "Siddharth", completed: 5, total: 6 },
    ],
  },
  {
    name: "Development",
    members: [
      { name: "Amit", completed: 10, total: 15 },
      { name: "Shiva", completed: 9, total: 10 },
    ],
  },
];

export function TeamWorkload() {
  return (
    <Card className="shadow-md border-none bg-white/50 backdrop-blur-sm text-neutral-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          Team Workload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {TeamData.map((team) => (
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
                const percentage = (member.completed / member.total) * 100;
                return (
                  <div key={member.name} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-sm font-semibold text-neutral-700">
                          {member.name}
                        </p>
                        <p className="text-[11px] text-neutral-500 flex items-center gap-1">
                          <CheckCircle2 className="size-3 text-green-500" />
                          {member.completed} tasks finished
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
        ))}
      </CardContent>
    </Card>
  );
}
