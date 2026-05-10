// components/dashboard/calendar/TaskFlowCalender.tsx
import { useRef, useCallback, useMemo, useEffect } from "react";
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

interface CalendarTask {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  priority: string;
  initials?: string;
  assignees?: string[];
}
interface AttendanceDay {
  date: string;
  status: string;
}
interface TaskFlowCalendarProps {
  tasks: CalendarTask[];
  leaveEvents?: any[];
  attendanceDays: AttendanceDay[];
  canSeeLeaveCards?: boolean;
  onTaskDrop: (taskId: string, newDueDate: string) => void;
  onTaskClick: (taskId: string) => void;
  onDateClick: (date: string) => void;
  onMonthChange: (month: number, year: number) => void;
}

const toFullCalendarDate = (ddmmyy: string) => {
  if (!ddmmyy) return "";
  const [d, m, y] = ddmmyy.split("/").map(Number);
  return `${y < 100 ? 2000 + y : y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
};

const statusColors: Record<string, string> = {
  Todo: "#6b7280",
  "In progress": "#3b82f6",
  Done: "#22c55e",
  Cancelled: "#ef4444",
  "On Hold": "#eab308",
};
const priorityColors: Record<string, string> = {
  Low: "#16a34a",
  Medium: "#ca8a04",
  High: "#ef4444",
  Urgent: "#991b1b",
};
const attendanceColors: Record<string, string> = {
  PRESENT: "#bbf7d0",
  LATE: "#fef08a",
  ABSENT: "#fecaca",
  HALF_DAY: "#fdba74",
  ON_LEAVE: "#d8b4fe",
};
const leaveColors: Record<string, string> = {
  CASUAL: "#f97316",
  SICK: "#ef4444",
  EARNED: "#8b5cf6",
  UNPAID: "#6b7280",
};

export default function TaskFlowCalendar({
  tasks,
  leaveEvents = [],
  attendanceDays,
  canSeeLeaveCards = false,
  onTaskDrop,
  onTaskClick,
  onDateClick,
  onMonthChange,
}: TaskFlowCalendarProps) {
  const calendarRef = useRef<any>(null);
  const lastMonthRef = useRef<string>("");
  const styleRef = useRef<HTMLStyleElement | null>(null);

  // ✅ Build attendance CSS rules and inject into <style> tag
  const attendanceCSS = useMemo(() => {
    if (!attendanceDays || attendanceDays.length === 0) return "";

    return attendanceDays
      .map((day) => {
        const [d, m, y] = day.date.split("/").map(Number);
        const fcDate = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const color = attendanceColors[day.status] || "";
        return color
          ? `.fc-day[data-date="${fcDate}"] { background-color: ${color} !important; }`
          : "";
      })
      .filter(Boolean)
      .join("\n");
  }, [attendanceDays]);

  // ✅ Apply CSS rules
  if (typeof document !== "undefined") {
    if (!styleRef.current) {
      styleRef.current = document.createElement("style");
      styleRef.current.id = "attendance-calendar-styles";
      document.head.appendChild(styleRef.current);
    }
    styleRef.current.textContent = attendanceCSS;
  }

  // ✅ CLEANUP: Remove style tag when component unmounts
  useEffect(() => {
    return () => {
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
      // Also remove any leftover attendance styles
      const existingStyle = document.getElementById(
        "attendance-calendar-styles",
      );
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  const handleDatesSet = useCallback(
    (arg: any) => {
      const monthKey = `${arg.view.currentStart.getMonth()}-${arg.view.currentStart.getFullYear()}`;
      if (monthKey !== lastMonthRef.current) {
        lastMonthRef.current = monthKey;
        const m = arg.view.currentStart.getMonth() + 1;
        const y = arg.view.currentStart.getFullYear();
        onMonthChange(m, y);
      }
    },
    [onMonthChange],
  );

  const taskEvents: EventInput[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    start: toFullCalendarDate(t.dueDate),
    allDay: true,
    backgroundColor: statusColors[t.status] || "#6b7280",
    borderColor: priorityColors[t.priority] || "#fcd34d",
    textColor: "#fff",
    classNames: ["task-event"],
    extendedProps: { type: "task", initials: t.initials || "" },
  }));

  const leaveEventsList: EventInput[] = canSeeLeaveCards
    ? leaveEvents.map((l) => ({
        id: l.id,
        title: `🏖️ ${l.title}`,
        start: toFullCalendarDate(l.dueDate),
        allDay: true,
        backgroundColor: leaveColors[l.leaveType] || "#f97316",
        borderColor: "transparent",
        textColor: "#fff",
        classNames: ["leave-event"],
        extendedProps: { type: "leave" },
      }))
    : [];

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
        events={[...taskEvents, ...leaveEventsList]}
        editable
        droppable
        selectable
        eventClick={(info: EventClickArg) => {
          if (info.event.extendedProps.type === "task")
            onTaskClick(info.event.id);
        }}
        eventDrop={(info: EventDropArg) => {
          if (info.event.start)
            onTaskDrop(info.event.id, info.event.startStr.split("T")[0]);
        }}
        dateClick={(info: DateClickArg) => onDateClick(info.dateStr)}
        datesSet={handleDatesSet}
        eventContent={renderEventContent}
        height="auto"
        contentHeight="auto"
        aspectRatio={1.8}
        dayMaxEvents={3}
        moreLinkClick="popover"
        eventDisplay="block"
      />
      <div className="mt-6 bg-white rounded-xl border p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">
          Calendar Guide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Task Status
            </h4>
            <div className="space-y-2">
              {Object.entries(statusColors).map(([s, c]) => (
                <div key={s} className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded border border-white shadow-sm"
                    style={{ backgroundColor: c }}
                  />
                  <span className="text-sm text-slate-700">{s}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Priority Border
            </h4>
            <div className="space-y-2">
              {Object.entries(priorityColors).map(([p, c]) => (
                <div key={p} className="flex items-center gap-3">
                  <div
                    className="w-1 h-5 rounded-full"
                    style={{ backgroundColor: c }}
                  />
                  <span className="text-sm text-slate-700">{p}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Attendance (background)
            </h4>
            <div className="space-y-2">
              {Object.entries(attendanceColors).map(([s, c]) => (
                <div key={s} className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded border border-slate-200"
                    style={{ backgroundColor: c }}
                  />
                  <span className="text-sm text-slate-700">
                    {s.replace("_", " ")}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded border border-slate-200 bg-white" />
                <span className="text-sm text-slate-700">Not Marked</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Quick Tips
            </h4>
            <div className="text-xs text-slate-500 space-y-1">
              <p>
                💡 <strong>Click</strong> task → View details
              </p>
              <p>
                💡 <strong>Drag</strong> task → Change due date
              </p>
              <p>
                💡 <strong>Click</strong> date → Create task
              </p>
              <p>
                💡 <strong>Day colors</strong> show attendance
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
