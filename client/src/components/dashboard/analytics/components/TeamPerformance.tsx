import React, { useState, useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { ColumnDef, SortingState } from "@tanstack/react-table";

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
import { TrendingUp, TrendingDown, Users } from "lucide-react";

interface TeamMemberPerformance {
  id: string;
  name: string;
  initials: string;
  avatarColor?: string;
  team?: string;
  tasksAssigned: number;
  tasksCompleted: number;
  completionRate: number;
  onTimeRate: number;
  overdueCount: number;
  avgCompletionTime: number;
  workload: number;
}

interface TeamPerformanceProps {
  dateRange: { from: Date; to: Date };
  selectedMember: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedPriority: string;
}

function TeamPerformance({
  dateRange,
  selectedMember,
  selectedTeam,
  selectedStatus,
  selectedPriority,
}: TeamPerformanceProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  console.log("TeamPerformance Filters →", {
    selectedMember,
    selectedTeam,
  });

  // Stable base data
  const baseTeamData = useMemo<TeamMemberPerformance[]>(
    () => [
      {
        id: "1",
        name: "Prashant Sharma",
        initials: "PS",
        team: "Design",
        tasksAssigned: 45,
        tasksCompleted: 38,
        completionRate: 84,
        onTimeRate: 91,
        overdueCount: 3,
        avgCompletionTime: 4.8,
        workload: 92,
      },
      {
        id: "2",
        name: "Rahul Verma",
        initials: "RV",
        team: "Engineering",
        tasksAssigned: 52,
        tasksCompleted: 41,
        completionRate: 79,
        onTimeRate: 73,
        overdueCount: 8,
        avgCompletionTime: 7.2,
        workload: 105,
      },
      {
        id: "3",
        name: "Priya Singh",
        initials: "PS",
        team: "Engineering",
        tasksAssigned: 38,
        tasksCompleted: 35,
        completionRate: 92,
        onTimeRate: 88,
        overdueCount: 1,
        avgCompletionTime: 5.1,
        workload: 78,
      },
      {
        id: "4",
        name: "Aarav Patel",
        initials: "AP",
        team: "Engineering",
        tasksAssigned: 29,
        tasksCompleted: 22,
        completionRate: 76,
        onTimeRate: 82,
        overdueCount: 4,
        avgCompletionTime: 6.4,
        workload: 65,
      },
      {
        id: "5",
        name: "Neha Gupta",
        initials: "NG",
        team: "Marketing",
        tasksAssigned: 41,
        tasksCompleted: 37,
        completionRate: 90,
        onTimeRate: 95,
        overdueCount: 0,
        avgCompletionTime: 3.9,
        workload: 85,
      },
    ],
    [],
  );

  // Filtered data based on team and member
  const teamData = useMemo(() => {
    return baseTeamData.filter((member) => {
      const teamMatch =
        selectedTeam === "all" ||
        member.team?.toLowerCase() === selectedTeam.toLowerCase();

      const memberMatch =
        selectedMember === "all" ||
        member.name.toLowerCase().includes(selectedMember.toLowerCase());

      return teamMatch && memberMatch;
    });
  }, [baseTeamData, selectedTeam, selectedMember]);

  // Full columns definition
  const columns: ColumnDef<TeamMemberPerformance>[] = [
    {
      accessorKey: "name",
      header: "Team Member",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback
              className="font-medium"
              style={{ backgroundColor: row.original.avatarColor || "#e2e8f0" }}
            >
              {row.original.initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold">{row.original.name}</div>
            <div className="text-xs text-muted-foreground">Member</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "tasksAssigned",
      header: "Assigned",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.tasksAssigned}</div>
      ),
    },
    {
      accessorKey: "tasksCompleted",
      header: "Completed",
      cell: ({ row }) => (
        <div className="font-medium text-emerald-600">
          {row.original.tasksCompleted}
        </div>
      ),
    },
    {
      accessorKey: "completionRate",
      header: "Completion Rate",
      cell: ({ row }) => {
        const rate = row.original.completionRate;
        return (
          <div className="flex items-center gap-2">
            <span className="font-semibold">{rate}%</span>
            <Progress value={rate} className="h-2 w-20" />
          </div>
        );
      },
    },
    {
      accessorKey: "onTimeRate",
      header: "On-Time %",
      cell: ({ row }) => {
        const rate = row.original.onTimeRate;
        const isGood = rate >= 85;
        return (
          <div
            className={`font-medium flex items-center gap-1 ${
              isGood ? "text-emerald-600" : "text-amber-600"
            }`}
          >
            {rate}%
            {isGood ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "overdueCount",
      header: "Overdue",
      cell: ({ row }) => {
        const overdue = row.original.overdueCount;
        return overdue > 0 ? (
          <Badge variant="destructive" className="font-medium">
            {overdue} tasks
          </Badge>
        ) : (
          <span className="text-emerald-600 font-medium">None</span>
        );
      },
    },
    {
      accessorKey: "avgCompletionTime",
      header: "Avg Time",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.avgCompletionTime} days</span>
      ),
    },
    {
      accessorKey: "workload",
      header: "Workload",
      cell: ({ row }) => {
        const load = row.original.workload;
        const loadColor =
          load > 100
            ? "text-rose-600"
            : load > 85
              ? "text-amber-600"
              : "text-emerald-600";

        return (
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${loadColor}`}>{load}%</span>
            <Progress
              value={Math.min(load, 100)}
              className={`h-2 w-20 ${load > 100 ? "bg-rose-200" : ""}`}
            />
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: teamData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Performance
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Individual productivity and workload across the team
            </p>
          </div>
          <Badge variant="outline">Based on selected filters</Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="font-medium">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/50">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No team data available for selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 text-xs text-muted-foreground flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-rose-500 rounded-full"></span>
          Workload &gt; 100% indicates potential overload
        </div>
      </CardContent>
    </Card>
  );
}

export default React.memo(TeamPerformance);
