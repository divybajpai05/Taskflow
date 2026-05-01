// src/modules/dashboard/dashboard.types.ts

export interface TaskStatusDistribution {
  status: string;
  count: number;
}

export interface PriorityBreakdown {
  priority: string;
  count: number;
}

export interface DepartmentHeadcount {
  department: string; // This will map to team names
  count: number;
}

export interface PerformanceOverview {
  taskStatus: TaskStatusDistribution[];
  priorityBreakdown: PriorityBreakdown[];
  departmentHeadcount: DepartmentHeadcount[];
  totalTasks: number;
  highestPriority: string;
}

export interface ActiveTask {
  id: string;
  name: string;
  assignedTeam: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  dueDate: string;
  status: "Todo" | "In progress" | "Done" | "Cancelled" | "On Hold";
  createdBy: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface ActiveTaskQueueResponse {
  tasks: ActiveTask[];
  total: number;
  showing: number;
}

export interface OverdueTask {
  id: string;
  name: string;
  team: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  dueDate: string;
  assignedMembers: string[]; // Array of member names
}

export interface TeamMemberWorkload {
  name: string;
  completed: number;
  total: number;
  percentage: number;
}

export interface TeamWorkloadData {
  teamName: string;
  members: TeamMemberWorkload[];
}

export interface LiveActivityItem {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  date: string;
  status: "success" | "pending" | "failed";
}

export interface DashboardFilters {
  workspaceId: string;
  userId: string;
  userRole: string;
  teamId?: string;
}
