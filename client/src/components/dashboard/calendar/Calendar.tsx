import { useState } from "react";
import TaskFlowCalendar from "./TaskFlowCalender";
import { AddTaskModal } from "../mytask/AddTaskModal";
import { TaskDetailModal } from "../kanban/TaskDetailModal";
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

  const [detailOpen, setDetailOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  // ================== Calendar Handlers ==================

  const handleTaskDrop = (taskId: string, newDueDate: string) => {
    // newDueDate comes as YYYY-MM-DD from FullCalendar → convert to DD/MM/YY
    const formattedDate = convertToDDMMYY(newDueDate);

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, dueDate: formattedDate } : t)),
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
    // date comes as YYYY-MM-DD
    const clickedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (clickedDate < today) {
      toast.warning(
        "You cannot create tasks on past dates.\n\nPlease select today or a future date.",
      );
      return;
    }

    // Convert YYYY-MM-DD to DD/MM/YY for the modal
    const formattedForModal = convertToDDMMYY(date);

    setInitialDueDate(formattedForModal);
    setEditingTask(null);
    setModalOpen(true);
  };

  // ================== Modal Handlers ==================

  const handleAddTask = (newTask: Task) => {
    setTasks((prev) => [newTask, ...prev]); // newest on top
  };

  const handleEditTask = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
    );
    setEditingTask(null);
    setModalOpen(false); // Important: close modal after edit
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
    setModalOpen(true);
  };

  return (
    <>
      <TaskFlowCalendar
        tasks={tasks}
        onTaskDrop={handleTaskDrop}
        onTaskClick={handleTaskClick}
        onDateClick={handleDateClick}
      />

      <AddTaskModal
        open={modalOpen}
        onOpenChange={handleCreateModalClose}
        initialDueDate={initialDueDate}
        onAddTask={handleAddTask}
        onEditTask={handleEditTask}
        editingTask={editingTask}
        onCloseEdit={() => {
          setEditingTask(null);
          setModalOpen(false);
        }}
      />

      <TaskDetailModal
        task={viewingTask}
        open={detailOpen}
        onClose={handleDetailClose}
        onEdit={handleEditFromDetail}
      />
    </>
  );
}

// Helper function: YYYY-MM-DD → DD/MM/YY
const convertToDDMMYY = (dateStr: string): string => {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(2); // 2026 → 26
  return `${day}/${month}/${year}`;
};
