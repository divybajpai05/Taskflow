// components/dashboard/calendar/Calendar.tsx
import { useState, useEffect, useCallback } from "react";
import TaskFlowCalendar from "./TaskFlowCalender";
import { AddTaskModal } from "../mytask/AddTaskModal";
import { TaskDetailModal } from "../kanban/TaskDetailModal";
import { toast } from "sonner";
import apiClient from "@/api/client";
import CalendarLoader from "@/components/loaders/CalendarLoader";

interface CalendarTask {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  teamId: string;
  teamName: string;
  assignees: string[];
  assigneeIds: string[];
  dueDate: string;
  createdById: string;
  creatorName: string;
  initials: string;
}

interface AttendanceDay {
  date: string;
  status: string;
}

interface LeaveEvent {
  id: string;
  title: string;
  dueDate: string;
  type: string;
  leaveType: string;
  userName: string;
  initials: string;
}

export default function Calendar() {
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [leaveEvents, setLeaveEvents] = useState<LeaveEvent[]>([]);
  const [attendanceDays, setAttendanceDays] = useState<AttendanceDay[]>([]);
  const [canSeeLeaveCards, setCanSeeLeaveCards] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [initialDueDate, setInitialDueDate] = useState<string | undefined>(
    undefined,
  );
  const [editingTask, setEditingTask] = useState<any>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<CalendarTask | null>(null);

  // ✅ Fetch attendance for a month - NOW ACTUALLY SETS STATE
  const fetchAttendanceForMonth = useCallback(
    async (month: number, year: number) => {
      try {
        const response = await apiClient.get(
          `/attendance/calendar-monthly?month=${month}&year=${year}`,
        );

        if (
          response.data.success &&
          response.data.data &&
          response.data.data.length > 0
        ) {
          const newDays: AttendanceDay[] = response.data.data.map(
            (record: any) => {
              const d = new Date(record.date);
              const day = String(d.getDate()).padStart(2, "0");
              const mon = String(d.getMonth() + 1).padStart(2, "0");
              const yr = d.getFullYear();
              return {
                date: `${day}/${mon}/${yr}`,
                status: record.status,
              };
            },
          );

          // ✅ MERGE with existing days (overwrite duplicates, keep old ones)
          setAttendanceDays((prev: AttendanceDay[]) => {
            const merged = [...prev];
            newDays.forEach((newDay: AttendanceDay) => {
              const existingIndex = merged.findIndex(
                (d: AttendanceDay) => d.date === newDay.date,
              );
              if (existingIndex >= 0) {
                merged[existingIndex] = newDay;
              } else {
                merged.push(newDay);
              }
            });
            return merged;
          });
        }
      } catch (error) {
        console.error("Failed to fetch attendance for month:", error);
      }
    },
    [],
  );

  // ✅ Handle month change
  const handleMonthChange = useCallback(
    (month: number, year: number) => {
      fetchAttendanceForMonth(month, year);
    },
    [fetchAttendanceForMonth],
  );

  // ✅ Fetch ALL events
  const fetchAllEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/calendar/events");
      if (response.data.success) {
        const {
          tasks,
          leaves,
          attendance,
          canSeeLeaveCards: showCards,
        } = response.data.data;
        setTasks(tasks || []);
        setLeaveEvents(leaves || []);
        setCanSeeLeaveCards(showCards || false);

        // ✅ Format attendance from the events response if available
        if (attendance && Array.isArray(attendance) && attendance.length > 0) {
          const days: AttendanceDay[] = attendance.map((record: any) => ({
            date: record.date,
            status: record.status,
          }));
          setAttendanceDays((prev: AttendanceDay[]) => {
            const merged = [...prev];
            days.forEach((newDay: AttendanceDay) => {
              const existingIndex = merged.findIndex(
                (d: AttendanceDay) => d.date === newDay.date,
              );
              if (existingIndex >= 0) {
                merged[existingIndex] = newDay;
              } else {
                merged.push(newDay);
              }
            });
            return merged;
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch calendar events:", error);
      try {
        const tasksResponse = await apiClient.get("/calendar/tasks");
        if (tasksResponse.data.success) {
          setTasks(tasksResponse.data.data || []);
        }
      } catch (e) {
        toast.error("Failed to load calendar");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ Fetch teams
  const fetchTeams = useCallback(async () => {
    try {
      const response = await apiClient.get("/teams");
      if (response.data.success) {
        setTeams(response.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch teams:", error);
    }
  }, []);

  useEffect(() => {
    fetchAllEvents();
    fetchTeams();
    const now = new Date();
    fetchAttendanceForMonth(now.getMonth() + 1, now.getFullYear());
  }, []);

  const handleTaskDrop = async (taskId: string, newDueDate: string) => {
    try {
      await apiClient.patch("/calendar/tasks/move", { taskId, newDueDate });
      const formattedDate = convertToDDMMYY(newDueDate);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, dueDate: formattedDate } : t,
        ),
      );
      toast.success("Task due date updated");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update due date");
    }
  };

  const handleTaskClick = (taskId: string) => {
    const taskToView = tasks.find((t) => t.id === taskId);
    if (taskToView) {
      setViewingTask(taskToView as any);
      setDetailOpen(true);
    }
  };

  const handleDateClick = (date: string) => {
    const clickedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (clickedDate < today) {
      toast.warning("You cannot create tasks on past dates.");
      return;
    }
    setInitialDueDate(convertToDDMMYY(date));
    setEditingTask(null);
    setModalOpen(true);
  };

  const handleAddTask = async (newTask: any): Promise<any> => {
    try {
      const response = await apiClient.post("/tasks", {
        title: newTask.title,
        description: newTask.description || "",
        priority: newTask.priority || "Medium",
        status: newTask.status || "Todo",
        teamId: newTask.teamId || newTask.selectTeam || null,
        assigneeIds: newTask.assigneeIds || newTask.selectMember || [],
        dueDate: newTask.dueDate || initialDueDate || null,
      });
      if (response.data.success) {
        toast.success("Task created!");
        setModalOpen(false);
        await fetchAllEvents();
        return { success: true };
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create task");
      throw error;
    }
  };

  const handleEditTask = async (updatedTask: any): Promise<any> => {
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
        toast.success("Task updated!");
        setEditingTask(null);
        setModalOpen(false);
        await fetchAllEvents();
        return { success: true };
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update task");
      throw error;
    }
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

  const handleEditFromDetail = (task: any) => {
    setEditingTask({
      ...task,
      selectTeam: task.teamId || task.teamName || "",
      selectMember: task.assignees || [],
    });
    setDetailOpen(false);
    setModalOpen(true);
  };

  if (isLoading) {
    return <CalendarLoader />;
  }

  return (
    <>
      <TaskFlowCalendar
        tasks={tasks}
        leaveEvents={leaveEvents}
        attendanceDays={attendanceDays}
        canSeeLeaveCards={canSeeLeaveCards}
        onTaskDrop={handleTaskDrop}
        onTaskClick={handleTaskClick}
        onDateClick={handleDateClick}
        onMonthChange={handleMonthChange}
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
        teams={teams}
      />
      <TaskDetailModal
        task={viewingTask as any}
        open={detailOpen}
        onClose={handleDetailClose}
        onEdit={handleEditFromDetail}
      />
    </>
  );
}

const convertToDDMMYY = (dateStr: string): string => {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(2);
  return `${day}/${month}/${year}`;
};
