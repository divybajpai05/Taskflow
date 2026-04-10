import React, { useState, useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { ColumnDef, SortingState } from "@tanstack/react-table";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";

import { statusColors, priorityBorderColors } from "@/lib/constant";

interface AnalyticsTask {
  id: string;
  title: string;
  assignee: string;
  team: string;
  assigneeInitials: string;
  status: "Todo" | "In progress" | "Done" | "On Hold" | "Cancelled";
  priority: "Low" | "Medium" | "High" | "Urgent";
  dueDate: string;
  completedDate?: string;
  daysOverdue: number;
  timeTaken: number;
}

interface TaskDetailsTableProps {
  dateRange: { from: Date; to: Date };
  selectedMember: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedPriority: string;
}

function TaskDetailsTable({
  dateRange,
  selectedMember,
  selectedTeam,
  selectedStatus,
  selectedPriority,
}: TaskDetailsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // Stable base data - prevents recreation on every render
  const baseData = useMemo<AnalyticsTask[]>(
    () => [
      {
        id: "1",
        title: "Design new landing page hero section",
        assignee: "Prashant Sharma",
        team: "Design",
        assigneeInitials: "PS",
        status: "Done",
        priority: "High",
        dueDate: "2026-04-05",
        completedDate: "2026-04-03",
        daysOverdue: 0,
        timeTaken: 4,
      },
      {
        id: "2",
        title: "Implement user authentication with OAuth",
        assignee: "Rahul Verma",
        team: "Engineering",
        assigneeInitials: "RV",
        status: "In progress",
        priority: "Urgent",
        dueDate: "2026-04-10",
        completedDate: undefined,
        daysOverdue: 2,
        timeTaken: 12,
      },
      {
        id: "3",
        title: "Write API documentation for task endpoints",
        assignee: "Priya Singh",
        team: "Engineering",
        assigneeInitials: "PS",
        status: "Todo",
        priority: "Medium",
        dueDate: "2026-04-15",
        completedDate: undefined,
        daysOverdue: 0,
        timeTaken: 0,
      },
      {
        id: "4",
        title: "Fix calendar drag and drop bug",
        assignee: "Prashant Sharma",
        team: "Design",
        assigneeInitials: "PS",
        status: "Done",
        priority: "High",
        dueDate: "2026-04-02",
        completedDate: "2026-04-01",
        daysOverdue: 0,
        timeTaken: 2,
      },
      {
        id: "5",
        title: "Setup analytics backend endpoints",
        assignee: "Aarav Patel",
        team: "Engineering",
        assigneeInitials: "AP",
        status: "On Hold",
        priority: "Low",
        dueDate: "2026-04-20",
        completedDate: undefined,
        daysOverdue: 0,
        timeTaken: 0,
      },
      {
        id: "6",
        title: "Update payment integration",
        assignee: "Rahul Verma",
        team: "Engineering",
        assigneeInitials: "RV",
        status: "In progress",
        priority: "High",
        dueDate: "2026-04-12",
        completedDate: undefined,
        daysOverdue: 1,
        timeTaken: 0,
      },
    ],
    [],
  );

  // Filtered data with all filters applied
  const filteredData = useMemo(() => {
    return baseData.filter((task) => {
      const memberMatch =
        selectedMember === "all" ||
        task.assignee.toLowerCase().includes(selectedMember.toLowerCase());

      const teamMatch =
        selectedTeam === "all" ||
        task.team.toLowerCase() === selectedTeam.toLowerCase();

      const statusMatch =
        selectedStatus === "all" || task.status === selectedStatus;

      const priorityMatch =
        selectedPriority === "all" || task.priority === selectedPriority;

      return memberMatch && teamMatch && statusMatch && priorityMatch;
    });
  }, [
    baseData,
    selectedMember,
    selectedTeam,
    selectedStatus,
    selectedPriority,
  ]);

  // Table columns
  const columns: ColumnDef<AnalyticsTask>[] = [
    {
      accessorKey: "title",
      header: "Task Title",
      cell: ({ row }) => (
        <div className="font-medium max-w-md truncate">
          {row.original.title}
        </div>
      ),
    },
    {
      accessorKey: "assignee",
      header: "Assignee",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
            {row.original.assigneeInitials}
          </div>
          <span>{row.original.assignee}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            variant="secondary"
            style={{
              backgroundColor: `${statusColors[status]}20`,
              color: statusColors[status],
            }}
            className="font-medium"
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const priority = row.original.priority;
        return (
          <Badge
            variant="outline"
            style={{
              borderColor: priorityBorderColors[priority],
              color: priorityBorderColors[priority],
            }}
            className="font-medium"
          >
            {priority}
          </Badge>
        );
      },
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.dueDate}</span>
      ),
    },
    {
      accessorKey: "completedDate",
      header: "Completed",
      cell: ({ row }) =>
        row.original.completedDate ? (
          <span className="text-sm text-emerald-600">
            {row.original.completedDate}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "daysOverdue",
      header: "Overdue",
      cell: ({ row }) => {
        const days = row.original.daysOverdue;
        return days > 0 ? (
          <span className="text-rose-600 font-medium">{days} days</span>
        ) : (
          <span className="text-emerald-600">On time</span>
        );
      },
    },
    {
      accessorKey: "timeTaken",
      header: "Time Taken",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.timeTaken > 0 ? `${row.original.timeTaken} days` : "—"}
        </span>
      ),
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleExportCSV = () => {
    const rows = table.getRowModel().rows;
    if (rows.length === 0) {
      alert("No data to export");
      return;
    }

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((row) => Object.values(row.original).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `taskflow_tasks_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Task Details</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Complete list of tasks with performance metrics
            </p>
          </div>

          <div className="flex gap-3">
            <Input
              placeholder="Search tasks..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
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
                  <TableRow key={row.id}>
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
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-end space-x-2 py-4 text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of {filteredData.length}{" "}
          tasks
        </div>
      </CardContent>
    </Card>
  );
}

export default React.memo(TaskDetailsTable);
