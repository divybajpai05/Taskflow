// src/services/dashboard.service.ts

import apiClient from "@/api/client";

export interface TaskStatusDistribution {
  status: string;
  count: number;
}

export interface PriorityBreakdown {
  priority: string;
  count: number;
}

export interface DepartmentHeadcount {
  department: string;
  count: number;
}

export interface PerformanceOverview {
  taskStatus: TaskStatusDistribution[];
  priorityBreakdown: PriorityBreakdown[];
  departmentHeadcount: DepartmentHeadcount[];
  totalTasks: number;
  highestPriority: string;
}

export interface ActiveTaskItem {
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

export interface ActiveTaskQueueData {
  tasks: ActiveTaskItem[];
  total: number;
  showing: number;
}

export interface OverdueTaskItem {
  id: string;
  name: string;
  team: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  dueDate: string;
  assignedMembers: string[];
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

export const dashboardService = {
  getPerformanceOverview: async (): Promise<PerformanceOverview> => {
    const response = await apiClient.get(`/dashboard/overview`);
    return response.data.data;
  },

  getActiveTasks: async (
    limit = 5,
    offset = 0,
  ): Promise<ActiveTaskQueueData> => {
    const response = await apiClient.get(`/dashboard/active-tasks`, {
      params: { limit, offset },
    });
    return response.data.data;
  },

  getOverdueTasks: async (): Promise<OverdueTaskItem[]> => {
    const response = await apiClient.get(`/dashboard/overdue-tasks`);
    return response.data.data;
  },

  getTeamWorkload: async (): Promise<TeamWorkloadData[]> => {
    const response = await apiClient.get(`/dashboard/team-workload`);
    return response.data.data;
  },

  getLiveActivity: async (limit = 3): Promise<LiveActivityItem[]> => {
    const response = await apiClient.get(`/dashboard/live-activity`, {
      params: { limit },
    });
    return response.data.data;
  },
};
