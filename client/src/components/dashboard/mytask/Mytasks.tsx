// components/dashboard/mytask/Mytasks.tsx
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, Edit2, Trash2, X, Plus, Loader2 } from "lucide-react";
import { AddTaskModal } from "./AddTaskModal";
import { useMemo, useState, useEffect, useCallback } from "react";
import { priorityColors } from "../overview/components/ActiveTaskQueue";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import apiClient from "@/api/client";
import { useAuthStore } from "@/stores";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  teamName?: string;
  teamId?: string;
  assignees?: string[];
  assigneeIds?: string[];
  dueDate?: string;
  createdAt?: string;
  createdById?: string;
  selectTeam?: string;
  selectMember?: string[];
  initials?: string;
}

const StatusColors: Record<string, string> = {
  Todo: "text-yellow-600 border border-yellow-600/60",
  "In progress": "text-blue-600 border border-blue-600",
  Done: "text-green-600 border border-green-600",
  Cancelled: "text-red-600 border border-red-600",
  "On Hold": "text-slate-500 border border-slate",
};

const statusMap: Record<string, string> = {
  TODO: "Todo",
  IN_PROGRESS: "In progress",
  DONE: "Done",
  ON_HOLD: "On Hold",
  CANCELLED: "Cancelled",
};
const priorityMap: Record<string, string> = {
  URGENT: "Urgent",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export default function TaskTable() {
  const { user } = useAuthStore();
  const userId = user?.id;
  const userPermissions = user?.permissions || [];

  const [taskList, setTaskList] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("All");
  const [selectedPriority, setSelectedPriority] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  const canManageAll =
    userPermissions.includes("team_management") ||
    userPermissions.includes("user_management");

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedTeam !== "All") params.append("teamId", selectedTeam);
      if (selectedPriority !== "All")
        params.append("priority", selectedPriority);
      if (selectedStatus !== "All") params.append("status", selectedStatus);
      const response = await apiClient.get(`/tasks?${params.toString()}`);
      if (response.data.success) {
        setTaskList(
          response.data.data.map((t: any) => ({
            ...t,
            status: statusMap[t.status] || t.status,
            priority: priorityMap[t.priority] || t.priority,
            selectTeam: t.teamName || "N/A",
            selectMember: t.assignees || [],
            initials:
              t.assignees
                ?.map((a: string) => a.charAt(0).toUpperCase())
                .join(", ") || "",
          })),
        );
      }
    } catch (error) {
      toast.error("Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedTeam, selectedPriority, selectedStatus]);

  const fetchTeams = useCallback(async () => {
    try {
      const r = await apiClient.get("/tasks/teams");
      if (r.data.success) setTeams(r.data.data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchTeams();
  }, [fetchTasks, fetchTeams]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await apiClient.put(`/tasks/${id}`, { status: newStatus });
      toast.success("Status updated!");
      fetchTasks();
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Failed");
    }
  };

  const handleAddTask = async (newTask: any) => {
    const r = await apiClient.post("/tasks", {
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      status: newTask.status,
      teamId: newTask.teamId || undefined,
      assigneeIds: newTask.assigneeIds || [],
      dueDate: newTask.dueDate,
    });
    if (r.data.success) {
      toast.success("Task created!");
      setIsModalOpen(false);
      fetchTasks();
    }
    return r;
  };

  const handleSaveEdit = async (updatedTask: any) => {
    const payload: any = {
      title: updatedTask.title,
      description: updatedTask.description,
      priority: updatedTask.priority,
      status: updatedTask.status,
      dueDate: updatedTask.dueDate,
    };
    if (canManageAll) {
      payload.teamId = updatedTask.teamId || undefined;
      payload.assigneeIds = updatedTask.assigneeIds || [];
    }
    const r = await apiClient.put(`/tasks/${updatedTask.id}`, payload);
    if (r.data.success) {
      toast.success("Task updated!");
      setEditingTask(null);
      setIsModalOpen(false);
      fetchTasks();
    }
    return r;
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    try {
      await apiClient.delete(`/tasks/${id}`);
      toast.success("Task deleted!");
      setTaskToDelete(null);
      fetchTasks();
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canEditTask = (task: Task) =>
    canManageAll ||
    task.createdById === userId ||
    (task.assigneeIds || []).includes(userId || "");
  const canDeleteTask = (task: Task) =>
    canManageAll || task.createdById === userId;

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedTeam("All");
    setSelectedPriority("All");
    setSelectedStatus("All");
  };
  const activeFiltersCount =
    (searchTerm ? 1 : 0) +
    (selectedTeam !== "All" ? 1 : 0) +
    (selectedPriority !== "All" ? 1 : 0) +
    (selectedStatus !== "All" ? 1 : 0);

  return (
    <TooltipProvider>
      <div className="w-full bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-white/50 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">Tasks</h2>
              <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                {taskList.length} of {taskList.length}
              </Badge>
            </div>
            <Button
              onClick={() => {
                setEditingTask(null);
                setIsModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
              disabled={isSubmitting}
            >
              <Plus className="w-4 h-4 mr-1" /> New Task
            </Button>
            <AddTaskModal
              onAddTask={handleAddTask}
              onEditTask={handleSaveEdit}
              editingTask={editingTask}
              onCloseEdit={() => setEditingTask(null)}
              open={isModalOpen}
              onOpenChange={setIsModalOpen}
              teams={teams}
            />
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-50">
              <label className="text-xs font-medium text-slate-500 mb-1 block">
                Search Task
              </label>
              <div className="relative">
                <Input
                  placeholder="Search by task title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="min-w-40">
              <label className="text-xs font-medium text-slate-500 mb-1 block">
                Team
              </label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-35">
              <label className="text-xs font-medium text-slate-500 mb-1 block">
                Priority
              </label>
              <Select
                value={selectedPriority}
                onValueChange={setSelectedPriority}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["All", "Urgent", "High", "Medium", "Low"].map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-37">
              <label className="text-xs font-medium text-slate-500 mb-1 block">
                Status
              </label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "All",
                    "Todo",
                    "In progress",
                    "Done",
                    "On Hold",
                    "Cancelled",
                  ].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="h-10"
              >
                Clear ({activeFiltersCount})
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead className="uppercase text-[11px] font-bold text-left">
                  Task
                </TableHead>
                <TableHead className="uppercase text-[11px] font-bold text-center">
                  Team
                </TableHead>
                <TableHead className="uppercase text-[11px] font-bold text-center">
                  Priority
                </TableHead>
                <TableHead className="uppercase text-[11px] font-bold text-center">
                  Status
                </TableHead>
                <TableHead className="uppercase text-[11px] font-bold text-center">
                  Assignees
                </TableHead>
                <TableHead className="uppercase text-[11px] font-bold text-center">
                  Due Date
                </TableHead>
                <TableHead className="w-20 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taskList.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-slate-500"
                  >
                    No tasks found.
                  </TableCell>
                </TableRow>
              ) : (
                taskList.map((task) => (
                  <TableRow
                    key={task.id}
                    className="group hover:bg-slate-50/30 transition-colors"
                  >
                    <TableCell className="text-center">
                      {task.description && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-slate-400 cursor-help hover:text-blue-500 transition-colors" />
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p className="text-xs max-w-50">
                              {task.description}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell className="max-w-50 text-left">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p
                            className={cn(
                              "font-medium text-slate-800 truncate cursor-help",
                              task.status === "Cancelled" &&
                                "line-through text-slate-400",
                            )}
                          >
                            {task.title}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="text-xs font-medium">{task.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-medium border-slate-200 text-slate-500 uppercase tracking-tight"
                      >
                        {task.selectTeam || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className={`border-none text-[10px] uppercase font-bold ${priorityColors[task.priority as keyof typeof priorityColors]}`}
                      >
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Select
                        value={task.status}
                        onValueChange={(v) => handleStatusChange(task.id, v)}
                      >
                        <SelectTrigger
                          className={`w-27 cursor-pointer mx-auto h-7 text-[11px] font-medium border-slate-200 ${StatusColors[task.status as keyof typeof StatusColors]}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "Todo",
                            "In progress",
                            "Done",
                            "On Hold",
                            "Cancelled",
                          ].map((s) => (
                            <SelectItem
                              key={s}
                              value={s}
                              className="text-xs cursor-pointer"
                            >
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex -space-x-2 overflow-hidden justify-center">
                        {(task.selectMember || []).slice(0, 3).map((m, i) => (
                          <Tooltip key={i}>
                            <TooltipTrigger asChild>
                              <div className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-[10px] font-bold text-white ring-1 ring-slate-100 cursor-default">
                                {getInitials(m)}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">{m}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                        {(task.selectMember || []).length > 3 && (
                          <div className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-medium text-slate-600 ring-1 ring-slate-100">
                            +{(task.selectMember || []).length - 3}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm text-rose-500 tracking-tight">
                      {task.dueDate}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {canEditTask(task) && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => {
                                  setEditingTask(task);
                                  setIsModalOpen(true);
                                }}
                                className="cursor-pointer p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Edit Task</TooltipContent>
                          </Tooltip>
                        )}
                        {canDeleteTask(task) && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => setTaskToDelete(task.id)}
                                className="cursor-pointer p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Delete Task</TooltipContent>
                          </Tooltip>
                        )}
                        {!canEditTask(task) && !canDeleteTask(task) && (
                          <span className="text-[10px] text-muted-foreground">
                            🔒
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <AlertDialog
        open={!!taskToDelete}
        onOpenChange={() => setTaskToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="cursor-pointer"
              disabled={isSubmitting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => taskToDelete && handleDelete(taskToDelete)}
              className="bg-red-600 hover:bg-red-700 cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
