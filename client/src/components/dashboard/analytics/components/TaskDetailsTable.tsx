// components/analytics/components/TaskDetailsTable.tsx
import React, { useEffect, useState, useCallback } from "react";
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
import { Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import apiClient from "@/api/client";

const STATUS_COLORS: Record<string, string> = {
  Done: "#22c55e",
  "In progress": "#3b82f6",
  Todo: "#eab308",
  "On Hold": "#64748b",
  Cancelled: "#ef4444",
};
const PRIORITY_COLORS: Record<string, string> = {
  Low: "#86efac",
  Medium: "#fcd34d",
  High: "#fb923c",
  Urgent: "#ef4444",
};

interface TaskDetailsTableProps {
  dateRange: { from: Date; to: Date };
  selectedMember: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedPriority: string;
  refreshKey?: number;
}

const TaskDetailsTable: React.FC<TaskDetailsTableProps> = ({
  dateRange,
  selectedMember,
  selectedTeam,
  selectedStatus,
  selectedPriority,
  refreshKey,
}) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (dateRange.from)
        params.append("dateFrom", format(dateRange.from, "yyyy-MM-dd"));
      if (dateRange.to)
        params.append("dateTo", format(dateRange.to, "yyyy-MM-dd"));
      if (selectedMember !== "all") params.append("memberId", selectedMember);
      if (selectedTeam !== "all") params.append("teamId", selectedTeam);
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (selectedPriority !== "all")
        params.append("priority", selectedPriority);

      const response = await apiClient.get(
        `/analytics/tasks?${params.toString()}`,
      );
      if (response.data.success) setTasks(response.data.data);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    dateRange,
    selectedMember,
    selectedTeam,
    selectedStatus,
    selectedPriority,
  ]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, refreshKey]);

  const filteredTasks = tasks.filter((t) =>
    t.title?.toLowerCase().includes(search.toLowerCase()),
  );

  if (isLoading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Task Details</CardTitle>
            <p className="text-sm text-muted-foreground">
              Complete list of tasks with performance metrics
            </p>
          </div>
          <div className="flex gap-3">
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task Title</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>Overdue</TableHead>
              <TableHead>Time Taken</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium max-w-md truncate">
                  {task.title}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {task.assigneeInitials}
                    </div>
                    <span>{task.assignee}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    style={{
                      backgroundColor: `${STATUS_COLORS[task.status] || "#94a3b8"}20`,
                      color: STATUS_COLORS[task.status],
                    }}
                  >
                    {task.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: PRIORITY_COLORS[task.priority] || "#94a3b8",
                      color: PRIORITY_COLORS[task.priority],
                    }}
                  >
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell>{task.dueDate}</TableCell>
                <TableCell>{task.completedDate || "—"}</TableCell>
                <TableCell>
                  {task.daysOverdue > 0 ? (
                    <span className="text-rose-600 font-medium">
                      {task.daysOverdue} days
                    </span>
                  ) : (
                    <span className="text-emerald-600">On time</span>
                  )}
                </TableCell>
                <TableCell>
                  {task.timeTaken > 0 ? `${task.timeTaken} days` : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredTasks.length === 0 && (
          <p className="text-center py-8 text-muted-foreground">
            No tasks found
          </p>
        )}
        <div className="flex items-center justify-end py-4 text-sm text-muted-foreground">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(TaskDetailsTable);
