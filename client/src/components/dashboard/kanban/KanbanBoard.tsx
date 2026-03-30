import { useState, useMemo } from "react";
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import type { DragOverEvent } from "@dnd-kit/core";
import type { Task } from "@/types/types";
import { initialTasks } from "../mytask/Mytasks";
import { AddTaskModal } from "../mytask/AddTaskModal";
import { KanbanColumn } from "./KanbanColumn";
import { StatusColors } from "../overview/ActiveTaskQueue";
import { TaskDetailModal } from "./TaskDetailModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const statuses = [
  "Todo",
  "In Progress",
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

  // Fixed Drag Over Handler with unique IDs
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id); // This will now be "team-status" format

    setTaskList((prevTasks) => {
      const activeTaskIndex = prevTasks.findIndex((t) => t.id === activeId);
      if (activeTaskIndex === -1) return prevTasks;

      const activeTask = prevTasks[activeTaskIndex];

      // Extract status from overId (format: "TeamName-Status")
      const newStatus = overId.split("-").pop() || activeTask.status;

      if (activeTask.status === newStatus) return prevTasks;

      const updatedTasks = [...prevTasks];
      updatedTasks[activeTaskIndex] = { ...activeTask, status: newStatus };

      return updatedTasks;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
  };

  const handleAddTask = (newTask: Task) => {
    setTaskList([newTask, ...taskList]);
  };

  const handleSaveEdit = (updatedTask: Task) => {
    setTaskList((prev) =>
      prev.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
    );
    setEditingTask(null);
  };

  const handleCloseEdit = () => setEditingTask(null);

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

          <AddTaskModal
            onAddTask={handleAddTask}
            onEditTask={handleSaveEdit}
            editingTask={editingTask}
            onCloseEdit={handleCloseEdit}
          />
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragOver={handleDragOver}
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
                      {Object.values(groupedTasks[team] || {}).flat().length}{" "}
                      tasks
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 p-4 overflow-x-auto">
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
        onEdit={(task) => {
          setSelectedTaskForDetail(null);
          setEditingTask(task);
        }}
      />

    </div>
  );
}
