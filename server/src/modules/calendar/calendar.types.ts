// src/modules/calendar/calendar.types.ts

export interface CalendarTask {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  teamId: string;
  teamName: string;
  assignees: string[];
  assigneeIds: string[];
  dueDate: string; // DD/MM/YY format
  createdById: string;
  creatorName: string;
  initials: string;
}

export interface MoveTaskInput {
  taskId: string;
  newDueDate: string; // YYYY-MM-DD from FullCalendar
}
