import { useState, useMemo } from "react";
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragOverEvent } from "@dnd-kit/core";
import type { Task } from "@/types/types";
import { initialTasks } from "../mytask/Mytasks";
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
import { Plus } from "lucide-react";

const statuses = [
  "Todo",
  "In progress",
  "On Hold",
  "Done",
  "Cancelled",
] as const;

export default function KanbanBoard() {
  const [taskList, setTaskList] = useState<Task[]>(initialTasks);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("All");

  const [selectedTaskForDetail, setSelectedTaskForDetail] =
    useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // ← New state

  const groupedTasks = useMemo(() => {
    const filtered = taskList.filter((task) => {
      const matchesSearch = task.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesPriority =
        selectedPriority === "All" || task.priority === selectedPriority;
      return matchesSearch && matchesPriority;
    });

    const byTeam: Record<string, Record<string, Task[]>> = {};

    filtered.forEach((task) => {
      if (!byTeam[task.selectTeam]) byTeam[task.selectTeam] = {};
      const statusKey = task.status;
      if (!byTeam[task.selectTeam][statusKey])
        byTeam[task.selectTeam][statusKey] = [];
      byTeam[task.selectTeam][statusKey].push(task);
    });

    return byTeam;
  }, [taskList, searchTerm, selectedPriority]);

  const teams = Object.keys(groupedTasks);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const newStatus = overId.split("-").pop() || "";

    setTaskList((prevTasks) => {
      const activeTaskIndex = prevTasks.findIndex((t) => t.id === activeId);
      if (activeTaskIndex === -1) return prevTasks;

      const activeTask = prevTasks[activeTaskIndex];
      if (activeTask.status === newStatus) return prevTasks;

      const updatedTasks = [...prevTasks];
      updatedTasks[activeTaskIndex] = {
        ...activeTask,
        status: newStatus as any,
      };
      return updatedTasks;
    });
  };

  const handleAddTask = (newTask: Task) => {
    setTaskList([newTask, ...taskList]);
  };

  const handleSaveEdit = (updatedTask: Task) => {
    setTaskList((prev) =>
      prev.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
    );
    setEditingTask(null);
    setIsModalOpen(false); // ← Close modal after edit
  };

  const handleCloseEdit = () => {
    setEditingTask(null);
    setIsModalOpen(false);
  };

  const handleEditFromDetail = (task: Task) => {
    setSelectedTaskForDetail(null);
    setEditingTask(task);
    setIsModalOpen(true); // ← Open modal for editing
  };

  return (
    <div className="min-h-screen">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Kanban Board</h1>
          <p className="text-slate-500 mt-1">Visual workflow by teams</p>
        </div>

        <div className="flex items-center gap-3">
          <Input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-72 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
          />

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

          {/* New Task Button */}
          <Button
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1" /> New Task
          </Button>

          {/* Controlled AddTaskModal */}
          <AddTaskModal
            onAddTask={handleAddTask}
            onEditTask={handleSaveEdit}
            editingTask={editingTask}
            onCloseEdit={handleCloseEdit}
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
          />
        </div>
      </div>

      {/* ... rest of your DndContext and columns remain the same ... */}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragOver={handleDragOver}
        onDragEnd={() => {}} // You can keep it empty or implement if needed
      >
        {/* Your existing columns rendering */}
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
                      {Object.values(groupedTasks[team] || {}).flat().length}{" "}
                      tasks
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 overflow-x-auto">
                  {statuses.map((status) => {
                    const columnTasks = groupedTasks[team]?.[status] || [];
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
                        isCollapsedByDefault={false}
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
        onEdit={handleEditFromDetail} // ← Updated to use new handler
      />
    </div>
  );
}
