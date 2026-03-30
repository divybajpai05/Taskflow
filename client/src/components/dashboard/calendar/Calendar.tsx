import { useState } from "react";
import TaskFlowCalendar from "./TaskFlowCalender";
import { AddTaskModal } from "../mytask/AddTaskModal";
import { TaskDetailModal } from "../kanban/TaskDetailModal"; // ← Adjust path if needed
import type { Task } from "@/types/types";
import { initialTasks } from "../mytask/Mytasks";
import { toast } from "sonner";

export default function Calendar() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const [modalOpen, setModalOpen] = useState(false);
  const [initialDueDate, setInitialDueDate] = useState<string | undefined>(
    undefined,
  );
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // New state for Task Detail Modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  // ================== Calendar Handlers ==================

  const handleTaskDrop = (taskId: string, newDueDate: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, dueDate: newDueDate } : t)),
    );
  };

  const handleTaskClick = (taskId: string) => {
    const taskToView = tasks.find((t) => t.id === taskId);
    if (taskToView) {
      setViewingTask(taskToView);
      setDetailOpen(true);
    }
  };

  const handleDateClick = (date: string) => {
    const clickedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (clickedDate < today) {
      toast.warning(
        "You cannot create tasks on past dates.\n\nPlease select today or a future date.",
      );
      return;
    }

    setInitialDueDate(date);
    setEditingTask(null);
    setModalOpen(true);
  };

  // ================== Modal Handlers ==================

  const handleAddTask = (newTask: Task) => {
    setTasks((prev) => [...prev, newTask]);
  };

  const handleEditTask = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
    );
    setEditingTask(null);
  };

  const handleCreateModalClose = (open: boolean) => {
    setModalOpen(open);
    if (!open) {
      setEditingTask(null);
      setInitialDueDate(undefined);
    }
  };

  const handleDetailClose = () => {
    setDetailOpen(false);
    setViewingTask(null);
  };

  const handleEditFromDetail = (task: Task) => {
    setEditingTask(task);
    setDetailOpen(false);
    setModalOpen(true); // Open edit modal
  };

  return (
    <>
      <TaskFlowCalendar
        tasks={tasks}
        onTaskDrop={handleTaskDrop}
        onTaskClick={handleTaskClick}
        onDateClick={handleDateClick}
      />

      {/* Create / Edit Modal */}
      <AddTaskModal
        open={modalOpen}
        onOpenChange={handleCreateModalClose}
        initialDueDate={initialDueDate}
        onAddTask={handleAddTask}
        onEditTask={handleEditTask}
        editingTask={editingTask}
        onCloseEdit={() => setEditingTask(null)}
      />

      {/* Task Detail Modal - Using your existing component */}
      <TaskDetailModal
        task={viewingTask}
        open={detailOpen}
        onClose={handleDetailClose}
        onEdit={handleEditFromDetail}
      />
    </>
  );
}
