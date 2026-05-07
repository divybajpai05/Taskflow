// components/analytics/components/TaskDetailsTable.tsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
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
import {
  Download,
  Loader2,
  Search,
  Clock,
  AlertCircle,
  CheckCircle2,
  Building2,
  Calendar,
  Timer,
  Users,
} from "lucide-react";
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

const TEAM_COLORS: Record<string, string> = {
  Engineering: "#3b82f6",
  Admin: "#8b5cf6",
  Marketing: "#f59e0b",
  "HR & People": "#10b981",
  Sales: "#ef4444",
  Product: "#06b6d4",
  Design: "#ec4899",
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

      if (response.data.success) {
        const apiData = response.data.data || [];

        // Deduplicate tasks by ID - merge assignees
        const taskMap = new Map<string, any>();

        apiData.forEach((task: any) => {
          const taskId = task.id || task.taskId;

          if (taskMap.has(taskId)) {
            // Task already exists, merge assignees
            const existingTask = taskMap.get(taskId);

            // Merge assignee arrays
            if (task.assignees && Array.isArray(task.assignees)) {
              task.assignees.forEach((a: string) => {
                if (!existingTask.assignees.includes(a)) {
                  existingTask.assignees.push(a);
                }
              });
            } else if (
              task.assignee &&
              !existingTask.assignees.includes(task.assignee)
            ) {
              existingTask.assignees.push(task.assignee);
            }

            // Merge initials arrays
            if (
              task.assigneeInitialsList &&
              Array.isArray(task.assigneeInitialsList)
            ) {
              task.assigneeInitialsList.forEach((init: string) => {
                if (!existingTask.assigneeInitialsList.includes(init)) {
                  existingTask.assigneeInitialsList.push(init);
                }
              });
            } else if (
              task.assigneeInitials &&
              !existingTask.assigneeInitialsList.includes(task.assigneeInitials)
            ) {
              existingTask.assigneeInitialsList.push(task.assigneeInitials);
            }
          } else {
            // First occurrence of this task
            // Normalize the data structure
            const assignees =
              task.assignees && Array.isArray(task.assignees)
                ? task.assignees
                : task.assignee
                  ? [task.assignee]
                  : [];

            const assigneeInitialsList =
              task.assigneeInitialsList &&
              Array.isArray(task.assigneeInitialsList)
                ? task.assigneeInitialsList
                : task.assigneeInitials
                  ? [task.assigneeInitials]
                  : [];

            taskMap.set(taskId, {
              ...task,
              assignees,
              assigneeInitialsList,
              // Keep single values for backward compatibility
              assignee: assignees[0] || "Unassigned",
              assigneeInitials: assigneeInitialsList[0] || "?",
            });
          }
        });

        setTasks(Array.from(taskMap.values()));
      }
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

  // Use unique task count for stats
  const uniqueTasks = useMemo(() => {
    const uniqueIds = new Set(tasks.map((t) => t.id || t.taskId));
    return uniqueIds.size;
  }, [tasks]);

  const filteredTasks = tasks.filter((t) =>
    t.title?.toLowerCase().includes(search.toLowerCase()),
  );

  // Calculate summary stats based on unique tasks
  const totalTasks = uniqueTasks;
  const completedTasks = tasks.filter((t) => t.status === "Done").length;
  const overdueTasks = tasks.filter((t) => t.daysOverdue > 0).length;
  const averageTimeTaken =
    tasks.length > 0
      ? Math.round(
          tasks.reduce((sum, t) => sum + (t.timeTaken || 0), 0) / tasks.length,
        )
      : 0;

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <p className="text-gray-500 dark:text-gray-400 animate-pulse">
          Loading tasks...
        </p>
      </div>
    );

  if (!tasks.length)
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Tasks Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Try adjusting your filters to see results
          </p>
        </CardContent>
      </Card>
    );

  return (
    <Card className="">
      <CardHeader className="border-b border-gray-100 dark:border-gray-800">
        <div className="flex flex-col space-y-4">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold">Task Details</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Complete list of tasks with performance metrics
              </p>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tasks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 max-w-xs"
                />
              </div>
              <Button
                variant="outline"
                className="gap-2 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            </div>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  Total Tasks
                </p>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {totalTasks}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Completed
                </p>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  {completedTasks}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-red-600 dark:text-red-400">
                  Overdue
                </p>
                <p className="text-lg font-bold text-red-700 dark:text-red-300">
                  {overdueTasks}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Timer className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  Avg. Time
                </p>
                <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                  {averageTimeTaken}d
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <TableHead className="">
                  <div className="flex items-center gap-2">Task Title</div>
                </TableHead>
                <TableHead className="">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Assignee(s)
                  </div>
                </TableHead>
                <TableHead className="">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Team
                  </div>
                </TableHead>
                <TableHead className="">Status</TableHead>
                <TableHead className="">Priority</TableHead>
                <TableHead className="">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Due Date
                  </div>
                </TableHead>
                <TableHead className="">Completed</TableHead>
                <TableHead className="">Overdue</TableHead>
                <TableHead className="">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time Taken
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task, index) => {
                // Safely get assignees array
                const assignees = Array.isArray(task.assignees)
                  ? task.assignees
                  : task.assignee
                    ? [task.assignee]
                    : [];

                // Safely get initials array
                const initialsList = Array.isArray(task.assigneeInitialsList)
                  ? task.assigneeInitialsList
                  : task.assigneeInitials
                    ? [task.assigneeInitials]
                    : [];

                return (
                  <TableRow
                    key={task.id || task.taskId || index}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <TableCell className=" max-w-[300px]">
                      <div className="truncate" title={task.title}>
                        {task.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {/* Avatar stack */}
                        <div className="flex -space-x-2">
                          {assignees
                            .slice(0, 3)
                            .map((assignee: string, i: number) => (
                              <div
                                key={i}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shadow-sm border-2 border-white dark:border-gray-800"
                                style={{
                                  backgroundColor:
                                    STATUS_COLORS[task.status] || "#94a3b8",
                                }}
                                title={assignee}
                              >
                                {initialsList[i] ||
                                  assignee?.charAt(0)?.toUpperCase() ||
                                  "?"}
                              </div>
                            ))}
                          {assignees.length > 3 && (
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-2 border-white dark:border-gray-800">
                              +{assignees.length - 3}
                            </div>
                          )}
                        </div>
                        {/* Names */}
                        <span className="text-xs text-gray-600 dark:text-gray-400 max-w-[120px] truncate">
                          {assignees.slice(0, 2).join(", ")}
                          {assignees.length > 2 &&
                            ` +${assignees.length - 2} more`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {task.team ? (
                        <Badge
                          variant="secondary"
                          className=""
                          style={{
                            backgroundColor: `${TEAM_COLORS[task.team] || "#94a3b8"}15`,
                            color: TEAM_COLORS[task.team] || "#94a3b8",
                          }}
                        >
                          <Building2 className="h-3 w-3 mr-1" />
                          {task.team}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className=""
                        style={{
                          backgroundColor: `${STATUS_COLORS[task.status] || "#94a3b8"}15`,
                          color: STATUS_COLORS[task.status],
                        }}
                      >
                        {task.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className=""
                        style={{
                          borderColor:
                            PRIORITY_COLORS[task.priority] || "#94a3b8",
                          color: PRIORITY_COLORS[task.priority],
                        }}
                      >
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{task.dueDate}</TableCell>
                    <TableCell>
                      {task.completedDate ? (
                        <span className="text-emerald-600 dark:text-emerald-400 text-sm">
                          {task.completedDate}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {task.daysOverdue > 0 ? (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 text-red-500" />
                          <span className="text-red-600 dark:text-red-400  text-sm">
                            {task.daysOverdue} days
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400 text-sm">
                            On time
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {task.timeTaken > 0 ? (
                        <div className="flex items-center gap-1">
                          <Timer className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">
                            {task.timeTaken} days
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              No tasks match your search criteria
            </p>
          </div>
        )}

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {filteredTasks.length}
            </span>{" "}
            unique tasks
          </p>
          {filteredTasks.length < tasks.length && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {tasks.length - filteredTasks.length} tasks filtered out
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(TaskDetailsTable);
