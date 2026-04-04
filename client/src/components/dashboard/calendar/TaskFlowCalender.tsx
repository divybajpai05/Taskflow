import React, { useRef, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

import type {
  EventClickArg,
  EventDropArg,
  EventContentArg,
  EventInput,
} from "@fullcalendar/core";

import type { DateClickArg } from "@fullcalendar/interaction";
import type { Task } from "@/types/types";

interface TaskFlowCalendarProps {
  tasks: Task[];
  onTaskDrop: (taskId: string, newDueDate: string) => void;
  onTaskClick: (taskId: string) => void;
  onDateClick: (date: string) => void;
}

// Helper function to convert DD/MM/YY to YYYY-MM-DD
const convertToFullCalendarDate = (dueDate: string): string => {
  if (!dueDate) return "";
  const [day, month, year] = dueDate.split("/").map(Number);
  const fullYear = year < 100 ? 2000 + year : year; // handles 26 → 2026
  return `${fullYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const statusColors: Record<string, string> = {
  Todo: "#6b7280",
  "In progress": "#3b82f6", // ← Changed to match your data
  Done: "#22c55e",
  Cancelled: "#ef4444",
  "On Hold": "#eab308", // Added
};

const priorityBorderColors: Record<string, string> = {
  Low: "#86efac",
  Medium: "#fcd34d",
  High: "#fb923c",
  Urgent: "#ef4444",
};

export default function TaskFlowCalendar({
  tasks,
  onTaskDrop,
  onTaskClick,
  onDateClick,
}: TaskFlowCalendarProps) {
  const calendarRef = useRef<any>(null);

  // Convert tasks to FullCalendar events with proper date format
  const calendarEvents: EventInput[] = tasks.map((task) => {
    const formattedDate = convertToFullCalendarDate(task.dueDate);

    return {
      id: task.id,
      title: task.title,
      start: formattedDate,
      allDay: true,
      backgroundColor: statusColors[task.status] || "#6b7280",
      borderColor: priorityBorderColors[task.priority] || "#fcd34d",
      extendedProps: {
        status: task.status,
        priority: task.priority,
        initials:
          task.initials || task.selectMember?.map((m) => m[0]).join("") || "",
      },
    };
  });

  const renderEventContent = (eventInfo: EventContentArg) => {
    const initials = eventInfo.event.extendedProps.initials || "";
    return (
      <div className="px-1 py-0.5 text-xs overflow-hidden">
        <div className="font-medium truncate">{eventInfo.event.title}</div>
        {initials && (
          <div className="text-[10px] text-white/80 mt-0.5">{initials}</div>
        )}
      </div>
    );
  };

  const handleEventClick = useCallback(
    (info: EventClickArg) => {
      onTaskClick(info.event.id);
    },
    [onTaskClick],
  );

  const handleEventDrop = useCallback(
    (info: EventDropArg) => {
      if (!info.event.start) return;

      const newDate = info.event.startStr.split("T")[0]; // YYYY-MM-DD
      onTaskDrop(info.event.id, newDate);
    },
    [onTaskDrop],
  );

  const handleDateClick = useCallback(
    (info: DateClickArg) => {
      console.log("Date clicked:", info.dateStr);
      onDateClick(info.dateStr);
    },
    [onDateClick],
  );

  const dayCellDidMount = (arg: any) => {
    const today = new Date().toISOString().split("T")[0];
    if (arg.dateStr === today) {
      arg.el.style.backgroundColor = "#dbeafe";
      arg.el.style.fontWeight = "600";
    } else if (arg.dateStr < today) {
      arg.el.style.backgroundColor = "#fee2e2";
    }
  };

  return (
    <div className="taskflow-calendar">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,dayGridWeek,dayGridDay",
        }}
        events={calendarEvents}
        editable={true}
        droppable={true}
        selectable={true}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        dateClick={handleDateClick}
        dayCellDidMount={dayCellDidMount}
        eventContent={renderEventContent}
        height="auto"
        contentHeight="auto"
        aspectRatio={1.8}
        dayMaxEvents={3}
        moreLinkClick="popover"
        eventDisplay="block"
      />
    </div>
  );
}
