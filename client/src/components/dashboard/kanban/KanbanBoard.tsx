// components/dashboard/kanban/KanbanBoard.tsx
import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { AddTaskModal } from "../mytask/AddTaskModal";
import { KanbanColumn } from "./KanbanColumn";
import { StatusColors } from "../overview/components/ActiveTaskQueue";
import { TaskDetailModal } from "./TaskDetailModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, FilterX } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/api/client";
import {
  kanbanService,
  type KanbanBoard,
  type KanbanTask,
} from "@/services/kanban.service";
import KanbanBoardLoader from "@/components/loaders/KanbanBoardLoader";

const statuses = [
  "Todo",
  "In progress",
  "On Hold",
  "Done",
  "Cancelled",
] as const;

export default function KanbanBoard() {
  const [board, setBoard] = useState<KanbanBoard>({});
  const [allTeams, setAllTeams] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [selectedTeam, setSelectedTeam] = useState("All Teams");
  const [teamsList, setTeamsList] = useState<{ id: string; name: string }[]>(
    [],
  );

  // ✅ Add workspace members state
  const [workspaceMembers, setWorkspaceMembers] = useState<
    {
      id: string;
      name: string;
      email: string;
      team?: string;
      teamId?: string;
    }[]
  >([]);

  const [selectedTaskForDetail, setSelectedTaskForDetail] =
    useState<KanbanTask | null>(null);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ✅ Fetch workspace members
  const fetchWorkspaceMembers = useCallback(async () => {
    try {
      const response = await apiClient.get("/users/workspace-members");
      if (response.data.success) {
        setWorkspaceMembers(
          response.data.data.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            team: u.team,
            teamId: u.teamId,
          })),
        );
      }
    } catch (error) {
      console.error("Failed to fetch workspace members:", error);
    }
  }, []);

  // ✅ Fetch board data
  const fetchBoard = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await kanbanService.getBoard(searchTerm, selectedPriority);
      setBoard(data);
    } catch (error) {
      console.error("Failed to fetch kanban board:", error);
      toast.error("Failed to load kanban board");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedPriority]);

  useEffect(() => {
    fetchBoard();
    fetchWorkspaceMembers(); // ✅ Fetch members on mount
  }, [fetchBoard, fetchWorkspaceMembers]);

  // ✅ Extract team names from board
  useEffect(() => {
    const teams = Object.keys(board);
    setAllTeams(teams);
  }, [board]);

  // ✅ Fetch teams list for AddTaskModal dropdown
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await apiClient.get("/teams");
        if (response.data.success) {
          setTeamsList(response.data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch teams:", error);
        const teamsFromBoard = Object.keys(board).map((name) => ({
          id: name,
          name: name,
        }));
        setTeamsList(teamsFromBoard);
      }
    };
    fetchTeams();
  }, [board]);

  // ✅ Filter teams based on selection
  const teams =
    selectedTeam === "All Teams"
      ? Object.keys(board)
      : [selectedTeam].filter((t) => board[t]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const taskId = String(active.id);
    const overId = String(over.id);
    const parts = overId.split("-");
    const newStatus = parts[parts.length - 1];

    if (!newStatus || !statuses.includes(newStatus as any)) return;

    setBoard((prevBoard) => {
      const newBoard = JSON.parse(JSON.stringify(prevBoard));
      for (const team of Object.keys(newBoard)) {
        for (const status of Object.keys(newBoard[team] || {})) {
          const taskIndex = newBoard[team][status]?.findIndex(
            (t: any) => t.id === taskId,
          );
          if (taskIndex !== undefined && taskIndex !== -1) {
            const [movedTask] = newBoard[team][status].splice(taskIndex, 1);
            const targetTeam = overId.split("-").slice(0, -1).join("-") || team;
            if (!newBoard[targetTeam]) newBoard[targetTeam] = {};
            if (!newBoard[targetTeam][newStatus])
              newBoard[targetTeam][newStatus] = [];
            newBoard[targetTeam][newStatus].push({
              ...movedTask,
              status: newStatus,
            });
            return newBoard;
          }
        }
      }
      return newBoard;
    });

    try {
      await kanbanService.moveTask(taskId, newStatus);
      toast.success(`Task moved to ${newStatus}`);
    } catch (error) {
      console.error("Failed to move task:", error);
      toast.error("Failed to move task");
      fetchBoard();
    }
  };

  // ✅ New Task
  const handleAddTask = async (newTask: any): Promise<any> => {
    try {
      const response = await apiClient.post("/tasks", {
        title: newTask.title,
        description: newTask.description || "",
        priority: newTask.priority || "Medium",
        status: newTask.status || "In progress",
        teamId: newTask.teamId || newTask.selectTeam || null,
        assigneeIds: newTask.assigneeIds || newTask.selectMember || [],
        dueDate: newTask.dueDate || null,
      });

      if (response.data.success) {
        toast.success("Task created successfully");
        setIsModalOpen(false);
        await fetchBoard();
        return { success: true };
      }
    } catch (error: any) {
      console.error("Failed to create task:", error);
      toast.error(error.response?.data?.error || "Failed to create task");
      throw error;
    }
  };

  // ✅ Edit Task
  const handleSaveEdit = async (updatedTask: any): Promise<any> => {
    try {
      const response = await apiClient.put(`/tasks/${updatedTask.id}`, {
        title: updatedTask.title,
        description: updatedTask.description,
        priority: updatedTask.priority,
        status: updatedTask.status,
        teamId: updatedTask.teamId || updatedTask.selectTeam,
        assigneeIds: updatedTask.assigneeIds || updatedTask.selectMember || [],
        dueDate: updatedTask.dueDate,
      });

      if (response.data.success) {
        toast.success("Task updated successfully");
        setEditingTask(null);
        setIsModalOpen(false);
        await fetchBoard();
        return { success: true };
      }
    } catch (error: any) {
      console.error("Failed to update task:", error);
      toast.error(error.response?.data?.error || "Failed to update task");
      throw error;
    }
  };

  // ✅ Map assignee NAMES to IDs before passing to modal
 const handleEditFromDetail = (task: KanbanTask) => {
   setSelectedTaskForDetail(null);
   setEditingTask({
     ...task,
     selectTeam: task.teamId || task.teamName || "",
     // ✅ Pass names - AddTaskModal will map to IDs internally
     selectMember: task.assignees || [],
   });
   setIsModalOpen(true);
 };

  const handleCloseEdit = () => {
    setEditingTask(null);
    setIsModalOpen(false);
  };

  if (isLoading) {
    return <KanbanBoardLoader />;
  }

  return (
    <div className="min-h-screen">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Kanban Board</h1>
          <p className="text-slate-500 mt-1">Visual workflow by teams</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-72 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
          />

          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-45">
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Teams">All Teams</SelectItem>
              {allTeams.map((team) => (
                <SelectItem key={team} value={team}>
                  {team}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="w-45">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Priorities</SelectItem>
              <SelectItem value="Urgent">Urgent</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>

          {(selectedTeam !== "All Teams" ||
            selectedPriority !== "All" ||
            searchTerm) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedTeam("All Teams");
                setSelectedPriority("All");
                setSearchTerm("");
              }}
              title="Clear filters"
            >
              <FilterX className="h-4 w-4" />
            </Button>
          )}

          <Button
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1" /> New Task
          </Button>

          <AddTaskModal
            onAddTask={handleAddTask}
            onEditTask={handleSaveEdit}
            editingTask={editingTask}
            onCloseEdit={handleCloseEdit}
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            teams={teamsList}
          />
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-4">
          {teams.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              No tasks found
            </div>
          ) : (
            teams.map((team) => (
              <div
                key={team}
                className="bg-white rounded-2xl border shadow-sm overflow-hidden"
              >
                <div className="px-8 py-5 border-b bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-xl font-semibold text-slate-800">
                      {team}
                    </div>
                    <div className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                      {Object.values(board[team] || {}).flat().length} tasks
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 overflow-x-auto">
                  {statuses.map((status) => {
                    const columnTasks = board[team]?.[status] || [];
                    return (
                      <KanbanColumn
                        key={`${team}-${status}`}
                        team={team}
                        status={status}
                        tasks={columnTasks}
                        colorClass={
                          StatusColors[status as keyof typeof StatusColors]
                        }
                        onTaskClick={setSelectedTaskForDetail}
                      />
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </DndContext>

      <TaskDetailModal
        task={selectedTaskForDetail}
        open={!!selectedTaskForDetail}
        onClose={() => setSelectedTaskForDetail(null)}
        onEdit={handleEditFromDetail}
      />
    </div>
  );
}
