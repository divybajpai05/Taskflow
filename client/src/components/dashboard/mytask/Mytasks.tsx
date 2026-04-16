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
import { Info, Edit2, Trash2, X, Plus } from "lucide-react";
import { AddTaskModal } from "./AddTaskModal";
import { useMemo, useState } from "react";
import { priorityColors } from "../overview/components/ActiveTaskQueue";
import type { Status, Task } from "@/types/types";
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

export const initialTasks: Task[] = [
  {
    id: "1",
    title: "Submission form",
    description: "Initial draft of the user submission flow",
    priority: "Urgent",
    status: "Cancelled",
    selectTeam: "HR",
    selectMember: ["Shiva", "Prashant Thakur"],
    dueDate: "22/03/26",
  },
  {
    id: "2",
    title: "Submission form",
    description: "Initial draft of the user submission flow",
    priority: "Medium",
    status: "Done",
    selectTeam: "Technical Team",
    selectMember: ["Shiva", "Prashant Thakur", "Aryan", "Ravi"],
    dueDate: "22/03/26",
  },
  {
    id: "3",
    title: "Submission form",
    description: "Initial draft of the user submission flow",
    priority: "Low",
    status: "In progress",
    selectTeam: "Technical Team",
    selectMember: ["Shiva", "Prashant Thakur", "Aryan", "Ravi"],
    dueDate: "24/03/26",
  },

  {
    id: "4",
    title: "Submission form",
    description: "Initial draft of the user submission flow",
    priority: "Low",
    status: "In progress",
    selectTeam: "HR",
    selectMember: ["Shiva", "Prashant Thakur", "Aryan", "Ravi"],
    dueDate: "25/03/26",
  },
];

const StatusColors: Record<Status, string> = {
  Todo: "text-yellow-600 border border-yellow-600/60 [&>svg]:text-yellow-600",
  "In progress": "text-blue-600 border border-blue-600 [&>svg]:text-blue-600",
  Done: "text-green-600 border border-green-600 [&>svg]:text-green-600",
  Cancelled: "text-red-600 border border-red-600 [&>svg]:text-red-600",
  "On Hold": "text-slate-500 border border-slate [&>svg]:text-slate-600",
};

export default function TaskTable() {
  const [taskList, setTaskList] = useState<Task[]>(initialTasks);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ==================== FILTER STATES ====================
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("All");
  const [selectedPriority, setSelectedPriority] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  const teams = [
    "All",
    ...Array.from(new Set(taskList.map((t) => t.selectTeam))),
  ];
  const priorities = ["All", "Urgent", "High", "Medium", "Low"];
  const statuses = [
    "All",
    "Todo",
    "In progress",
    "Done",
    "On Hold",
    "Cancelled",
  ];

  // ==================== FILTERED TASKS (Memoized) ====================
  const filteredTasks = useMemo(() => {
    return taskList.filter((task) => {
      const matchesSearch = task.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesTeam =
        selectedTeam === "All" || task.selectTeam === selectedTeam;
      const matchesPriority =
        selectedPriority === "All" || task.priority === selectedPriority;
      const matchesStatus =
        selectedStatus === "All" || task.status === selectedStatus;

      return matchesSearch && matchesTeam && matchesPriority && matchesStatus;
    });
  }, [taskList, searchTerm, selectedTeam, selectedPriority, selectedStatus]);

  const handleStatusChange = (id: string, newStatus: string) => {
    setTaskList((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, status: newStatus } : task,
      ),
    );
  };

  const handleAddTask = (newTask: Task) => {
    setTaskList([newTask, ...taskList]);
  };

  const handleSaveEdit = (updatedTask: Task) => {
    setTaskList((prev) =>
      prev.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
    );
    setEditingTask(null);
    setIsModalOpen(false); // close modal
  };

  const handleCloseEdit = () => {
    setEditingTask(null);
    setIsModalOpen(false);
  };

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true); // ← This opens the modal
  };

  const handleDelete = (id: string) => {
    setTaskList((prev) => prev.filter((task) => task.id !== id));
    setTaskToDelete(null);
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedTeam("All");
    setSelectedPriority("All");
    setSelectedStatus("All");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
                {filteredTasks.length} of {taskList.length}
              </Badge>
            </div>

            <Button
              onClick={() => {
                setEditingTask(null);
                setIsModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1" /> New Task
            </Button>

            {/* Modal - No longer needs DialogTrigger */}
            <AddTaskModal
              onAddTask={handleAddTask}
              onEditTask={handleSaveEdit}
              editingTask={editingTask}
              onCloseEdit={handleCloseEdit}
              open={isModalOpen}
              onOpenChange={setIsModalOpen}
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-3 items-end">
            {/* Search by Title */}
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Team Filter */}
            <div className="min-w-40">
              <label className="text-xs font-medium text-slate-500 mb-1 block">
                Team
              </label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority Filter */}
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
                  {priorities.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="min-w-37.5">
              <label className="text-xs font-medium text-slate-500 mb-1 block">
                Status
              </label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters Button */}
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="h-10"
              >
                Clear Filters ({activeFiltersCount})
              </Button>
            )}
          </div>
        </div>

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
            {filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-slate-500"
                >
                  No tasks found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((task) => (
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
                          <p className="text-xs max-w-50">{task.description}</p>
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
                      {task.selectTeam}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-center">
                    <Badge
                      variant="secondary"
                      className={`border-none text-[10px] uppercase font-bold ${
                        priorityColors[
                          task.priority as keyof typeof priorityColors
                        ]
                      }`}
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
                        className={`w-27.5 cursor-pointer mx-auto h-7 text-[11px] font-medium border-slate-200 ${
                          StatusColors[task.status as keyof typeof StatusColors]
                        }`}
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

                  <TableCell className="">
                    <div className="flex -space-x-2 overflow-hidden justify-center">
                      {task.selectMember.slice(0, 3).map((member, idx) => (
                        <Tooltip key={idx}>
                          <TooltipTrigger asChild>
                            <div className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-[10px] font-bold text-white ring-1 ring-slate-100 cursor-default">
                              {getInitials(member)}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">{member}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                      {task.selectMember.length > 3 && (
                        <div className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-medium text-slate-600 ring-1 ring-slate-100">
                          +{task.selectMember.length - 3}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-center text-sm text-rose-500 tracking-tight">
                    {task.dueDate}
                  </TableCell>

                  {/* Actions Column */}
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1 transition-opacity">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleEditClick(task)}
                            className="cursor-pointer p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Edit Task</TooltipContent>
                      </Tooltip>

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
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!taskToDelete}
        onOpenChange={() => setTaskToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              task from the list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => taskToDelete && handleDelete(taskToDelete)}
              className="bg-red-600 hover:bg-red-700 cursor-pointer"
            >
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
