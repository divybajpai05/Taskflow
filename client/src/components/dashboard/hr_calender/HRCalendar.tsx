// components/hr/HRCalendar.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import apiClient from "@/api/client";
import HRCalendarLoader from "@/components/loaders/HRCalendarLoader";

interface AttendanceEvent {
  id: string;
  title: string;
  start: string;
  allDay: boolean;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    type: string;
    present: number;
    absent: number;
    onLeave: number;
    halfDay: number;
    total: number;
    attendancePercentage: number;
    category: string;
  };
}

interface LeaveEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    type: string;
    employee: string;
    department: string;
    leaveType: string;
    reason: string;
    category: string;
  };
}

interface HolidayEvent {
  id: string;
  title: string;
  start: string;
  allDay: boolean;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    type: string;
    category: string;
  };
}

interface HREvents {
  attendance: AttendanceEvent[];
  leaves: LeaveEvent[];
  holidays: HolidayEvent[];
}

const HRCalendar: React.FC = () => {
  const calendarRef = useRef<FullCalendar>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [events, setEvents] = useState<EventInput[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Fetch HR calendar events from API
  const fetchHREvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/hr-calendar/events");
      if (response.data.success) {
        const { attendance, leaves, holidays } = response.data.data as HREvents;

        // ✅ Combine all event types into one array
        const allEvents: EventInput[] = [
          ...(attendance || []).map((event) => ({
            id: event.id,
            title: event.title,
            start: event.start,
            allDay: event.allDay,
            backgroundColor: event.backgroundColor,
            borderColor: event.borderColor,
            extendedProps: {
              type: "attendance",
              present: event.extendedProps.present,
              absent: event.extendedProps.absent,
              onLeave: event.extendedProps.onLeave,
              halfDay: event.extendedProps.halfDay,
              total: event.extendedProps.total,
              attendancePercentage: event.extendedProps.attendancePercentage,
              category: "attendance",
            },
          })),
          ...(leaves || []).map((event) => ({
            id: event.id,
            title: event.title,
            start: event.start,
            end: event.end,
            backgroundColor: event.backgroundColor,
            borderColor: event.borderColor,
            extendedProps: {
              type: "leave",
              employee: event.extendedProps.employee,
              department: event.extendedProps.department,
              leaveType: event.extendedProps.leaveType,
              reason: event.extendedProps.reason,
              category: "leave",
            },
          })),
          ...(holidays || []).map((event) => ({
            id: event.id,
            title: event.title,
            start: event.start,
            allDay: event.allDay,
            backgroundColor: event.backgroundColor,
            borderColor: event.borderColor,
            extendedProps: {
              type: "holiday",
              category: "holiday",
            },
          })),
        ];

        setEvents(allEvents);
      }
    } catch (error) {
      console.error("Failed to fetch HR events:", error);
      toast.error("Failed to load HR calendar events");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHREvents();
  }, [fetchHREvents]);
  
  useEffect(() => {
    return () => {
      const existingStyle = document.getElementById(
        "attendance-calendar-styles",
      );
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  const renderEventContent = (eventInfo: EventContentArg) => {
    const props = eventInfo.event.extendedProps as any;

    // ✅ Enhanced Attendance Display
    if (props?.type === "attendance") {
      const percentage = props.attendancePercentage || 0;
      const colorClass =
        percentage >= 80
          ? "text-green-200"
          : percentage >= 60
            ? "text-amber-200"
            : "text-red-200";

      return (
        <div className="p-1.5 text-[10px] leading-tight font-medium">
          <div className="font-semibold mb-0.5 flex items-center justify-between">
            <span>{eventInfo.event.title}</span>
            <span className={`text-[9px] ${colorClass}`}>{percentage}%</span>
          </div>
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

    // ✅ Leave Display
    if (props?.type === "leave") {
      return (
        <div className="p-1 text-xs overflow-hidden font-medium">
          <div className="truncate">{eventInfo.event.title}</div>
          <div className="text-[10px] opacity-75">{props.department}</div>
        </div>
      );
    }

    // ✅ Holiday Display
    if (props?.type === "holiday") {
      return (
        <div className="p-1 text-xs overflow-hidden font-medium">
          <div className="truncate">🎉 {eventInfo.event.title}</div>
        </div>
      );
    }

    // Default
    return (
      <div className="p-1 text-xs overflow-hidden font-medium">
        {eventInfo.event.title}
      </div>
    );
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    const props = event.extendedProps as any;

    if (props?.type === "attendance") {
      alert(
        `📊 Daily Attendance - ${event.start?.toLocaleDateString()}\n\n` +
          `Present : ${props.present}\n` +
          `Absent   : ${props.absent}\n` +
          `On Leave : ${props.onLeave}\n` +
          `Half Day : ${props.halfDay}\n` +
          `Total    : ${props.total}\n` +
          `Rate     : ${props.attendancePercentage}%`,
      );
    } else if (props?.type === "leave") {
      alert(
        `🏖️ Leave Details\n\n` +
          `Employee: ${props.employee}\n` +
          `Department: ${props.department}\n` +
          `Type: ${props.leaveType}\n` +
          `Reason: ${props.reason || "N/A"}\n` +
          `Dates: ${event.start?.toLocaleDateString()} - ${event.end?.toLocaleDateString() || event.start?.toLocaleDateString()}`,
      );
    } else if (props?.type === "holiday") {
      alert(
        `🎉 Holiday\n\n` +
          `${event.title}\n` +
          `Date: ${event.start?.toLocaleDateString()}`,
      );
    }
  };

  // Filter events by category
  const filteredEvents =
    selectedCategory === "all"
      ? events
      : events.filter((ev) => {
          const props = ev.extendedProps as any;
          return props?.category === selectedCategory;
        });

  if (isLoading) {
    return (
        <HRCalendarLoader/>
    );
  }

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
                <SelectItem value="holiday">Holidays</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm text-gray-500">
            Integrated with Leave Management • Real-time HR Overview
          </p>
        </div>

        {/* Calendar */}
        <div className="bg-white overflow-hidden">
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

        {/* Legend Cards */}
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

        {/* ✅ Color Legend */}
        <div className="mt-8 bg-white rounded-xl border p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-6">
            Color Legend & Event Types
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Attendance Section */}
            <div className="bg-gray-50/50 rounded-lg p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Attendance Status
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-md"
                      style={{ backgroundColor: "#10b981" }}
                    ></div>
                    <div>
                      <span className="text-sm font-medium text-slate-700">
                        Good Attendance
                      </span>
                      <p className="text-[11px] text-slate-400">80%+ present</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-green-600">
                    80-100%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-md"
                      style={{ backgroundColor: "#f59e0b" }}
                    ></div>
                    <div>
                      <span className="text-sm font-medium text-slate-700">
                        Moderate Attendance
                      </span>
                      <p className="text-[11px] text-slate-400">
                        60-79% present
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-600">
                    60-79%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-md"
                      style={{ backgroundColor: "#ef4444" }}
                    ></div>
                    <div>
                      <span className="text-sm font-medium text-slate-700">
                        Low Attendance
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Below 60% present
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-red-600">
                    &lt;60%
                  </span>
                </div>
              </div>
            </div>

            {/* Leave Types Section */}
            <div className="bg-gray-50/50 rounded-lg p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Leave Types
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-md"
                    style={{ backgroundColor: "#3b82f6" }}
                  ></div>
                  <div>
                    <span className="text-sm font-medium text-slate-700">
                      Casual Leave
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Personal time off
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-md"
                    style={{ backgroundColor: "#8b5cf6" }}
                  ></div>
                  <div>
                    <span className="text-sm font-medium text-slate-700">
                      Sick Leave
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Medical/Health related
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-md"
                    style={{ backgroundColor: "#10b981" }}
                  ></div>
                  <div>
                    <span className="text-sm font-medium text-slate-700">
                      Earned Leave
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Accrued paid leave
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-md"
                    style={{ backgroundColor: "#6b7280" }}
                  ></div>
                  <div>
                    <span className="text-sm font-medium text-slate-700">
                      Unpaid Leave
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Leave without pay
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Types Section */}
            <div className="bg-gray-50/50 rounded-lg p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Event Categories
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-md"
                    style={{ backgroundColor: "#eab308" }}
                  ></div>
                  <div>
                    <span className="text-sm font-medium text-slate-700">
                      Company Holiday
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Official day off
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-md"
                    style={{ backgroundColor: "#14b8a6" }}
                  ></div>
                  <div>
                    <span className="text-sm font-medium text-slate-700">
                      Onboarding
                    </span>
                    <p className="text-[11px] text-slate-400">
                      New employee orientation
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-md"
                    style={{ backgroundColor: "#f59e0b" }}
                  ></div>
                  <div>
                    <span className="text-sm font-medium text-slate-700">
                      Performance Review
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Evaluation deadlines
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-md"
                    style={{ backgroundColor: "#6366f1" }}
                  ></div>
                  <div>
                    <span className="text-sm font-medium text-slate-700">
                      Training Session
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Skill development
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Reference Table */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Quick Reference
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center gap-2 bg-green-50 rounded px-3 py-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-green-700 font-medium">Present</span>
              </div>
              <div className="flex items-center gap-2 bg-red-50 rounded px-3 py-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-red-700 font-medium">Absent</span>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 rounded px-3 py-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-blue-700 font-medium">On Leave</span>
              </div>
              <div className="flex items-center gap-2 bg-orange-50 rounded px-3 py-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-orange-700 font-medium">Half Day</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRCalendar;
