import React, { useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import type {
  EventClickArg,
  EventContentArg,
  EventInput,
} from "@fullcalendar/core";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExtendedProps {
  type:
    | "attendance"
    | "leave"
    | "onboarding"
    | "review"
    | "training"
    | "holiday";
  employee?: string;
  department?: string;
  present?: number;
  absent?: number;
  onLeave?: number;
  halfDay?: number;
  total?: number;
  category: string;
}

const HRCalendar: React.FC = () => {
  const calendarRef = useRef<FullCalendar>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Sample events with improved attendance data
  const [events] = useState<EventInput[]>([
    // === Attendance Events (Daily Summary) ===
    {
      id: "att-2026-04-13",
      title: "Daily Attendance",
      start: "2026-04-13",
      allDay: true,
      backgroundColor: "#10b981",
      borderColor: "#10b981",
      extendedProps: {
        type: "attendance",
        present: 42,
        absent: 3,
        onLeave: 4,
        halfDay: 1,
        total: 50,
        category: "attendance",
      } as ExtendedProps,
    },
    {
      id: "att-2026-04-14",
      title: "Daily Attendance",
      start: "2026-04-14",
      allDay: true,
      backgroundColor: "#10b981",
      borderColor: "#10b981",
      extendedProps: {
        type: "attendance",
        present: 38,
        absent: 5,
        onLeave: 6,
        halfDay: 1,
        total: 50,
        category: "attendance",
      } as ExtendedProps,
    },
    {
      id: "att-2026-04-15",
      title: "Low Attendance Alert",
      start: "2026-04-15",
      allDay: true,
      backgroundColor: "#ef4444",
      extendedProps: {
        type: "attendance",
        present: 28,
        absent: 12,
        onLeave: 8,
        halfDay: 2,
        total: 50,
        category: "attendance",
      } as ExtendedProps,
    },

    // === Leaves (from Leave Management) ===
    {
      id: "leave1",
      title: "Rahul Sharma - Annual Leave",
      start: "2026-04-20",
      end: "2026-04-25",
      backgroundColor: "#3b82f6",
      extendedProps: {
        type: "leave",
        employee: "Rahul Sharma",
        department: "Engineering",
        category: "leave",
      } as ExtendedProps,
    },
    {
      id: "leave2",
      title: "Priya Singh - Sick Leave",
      start: "2026-04-14",
      backgroundColor: "#8b5cf6",
      extendedProps: {
        type: "leave",
        employee: "Priya Singh",
        category: "leave",
      } as ExtendedProps,
    },

    // === Other HR Events ===
    {
      id: "onboard1",
      title: "New Joiner: Amit Kumar - Onboarding",
      start: "2026-04-16T10:00:00",
      end: "2026-04-16T12:00:00",
      backgroundColor: "#14b8a6",
      extendedProps: {
        type: "onboarding",
        category: "onboarding",
      } as ExtendedProps,
    },
    {
      id: "review1",
      title: "Q2 Performance Reviews Deadline",
      start: "2026-04-30",
      allDay: true,
      backgroundColor: "#f59e0b",
      extendedProps: {
        type: "review",
        category: "review",
      } as ExtendedProps,
    },
    {
      id: "training1",
      title: "Cyber Security Training",
      start: "2026-04-22T14:00:00",
      end: "2026-04-22T16:00:00",
      backgroundColor: "#6366f1",
      extendedProps: {
        type: "training",
        category: "training",
      } as ExtendedProps,
    },
    {
      id: "holiday1",
      title: "Good Friday - Company Holiday",
      start: "2026-04-03",
      allDay: true,
      backgroundColor: "#eab308",
      extendedProps: {
        type: "holiday",
        category: "holiday",
      } as ExtendedProps,
    },
  ]);

  const renderEventContent = (eventInfo: EventContentArg) => {
    const props = eventInfo.event.extendedProps as ExtendedProps | undefined;

    // Enhanced Attendance Display
    if (props?.type === "attendance") {
      return (
        <div className="p-1.5 text-[10px] leading-tight font-medium ">
          <div className="font-semibold mb-0.5">{eventInfo.event.title}</div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            <div>
              Present: <span className="font-semibold">{props.present}</span>
            </div>
            <div>
              Absent:{" "}
              <span className="font-semibold text-red-200">{props.absent}</span>
            </div>
            <div>
              On Leave:{" "}
              <span className="font-semibold text-blue-200">
                {props.onLeave}
              </span>
            </div>
            <div>
              Half Day:{" "}
              <span className="font-semibold text-amber-200">
                {props.halfDay}
              </span>
            </div>
          </div>
          <div className="text-[9px] mt-1 opacity-90">
            Total: {props.total} employees
          </div>
        </div>
      );
    }

    // Default for other events
    return (
      <div className="p-1 text-xs overflow-hidden font-medium">
        {eventInfo.event.title}
      </div>
    );
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    const props = event.extendedProps as ExtendedProps;

    if (props?.type === "attendance") {
      alert(`
📊 Daily Attendance - ${event.start?.toLocaleDateString()}

Present : ${props.present} 
Absent   : ${props.absent}
On Leave : ${props.onLeave}
Half Day : ${props.halfDay}
Total    : ${props.total}
      `);
    } else {
      alert(`
Event: ${event.title}
Type: ${props?.type || "General"}
Start: ${event.start?.toLocaleString() || "N/A"}
      `);
    }
  };

  // Filter events
  const filteredEvents =
    selectedCategory === "all"
      ? events
      : events.filter((ev) => {
          const props = ev.extendedProps as ExtendedProps | undefined;
          return props?.category === selectedCategory;
        });

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">HR Calendar</h1>
          <div className="flex gap-3">
            <button
              onClick={() => calendarRef.current?.getApi().today()}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => alert("Add HR Event modal coming soon")}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
            >
              + Add HR Event
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <div className="w-full sm:w-72">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="attendance">Attendance</SelectItem>
                <SelectItem value="leave">Leaves</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="review">Performance Reviews</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="holiday">Holidays</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm text-gray-500">
            Integrated with Leave Management • Real-time HR Overview
          </p>
        </div>

        {/* Calendar */}
        <div className="bg-white">
          <FullCalendar
            ref={calendarRef}
            plugins={[
              dayGridPlugin,
              timeGridPlugin,
              listPlugin,
              interactionPlugin,
            ]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
            }}
            events={filteredEvents}
            eventContent={renderEventContent}
            eventClick={handleEventClick}
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={3}
            weekends={true}
            height="auto"
            eventTimeFormat={{
              hour: "numeric",
              minute: "2-digit",
              meridiem: "short",
            }}
          />
        </div>

        {/* Legend */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <span className="text-lg">●</span> Attendance
            </div>
            <p className="text-gray-500 mt-1">
              Present, Absent, On Leave & Half Day count
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 text-blue-600 font-medium">
              <span className="text-lg">●</span> Leaves
            </div>
            <p className="text-gray-500 mt-1">Pulled from Leave Management</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 text-amber-600 font-medium">
              <span className="text-lg">●</span> Reviews & Training
            </div>
            <p className="text-gray-500 mt-1">Critical deadlines</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 text-yellow-600 font-medium">
              <span className="text-lg">●</span> Holidays
            </div>
            <p className="text-gray-500 mt-1">Company-wide events</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRCalendar;
