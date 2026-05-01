// src/services/kanban.service.ts
import apiClient from "@/api/client";

export interface KanbanTask {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  teamId: string;
  teamName: string;
  assigneeId: string | null;
  assignees: string[];
  dueDate: string | null;
  createdById: string;
  creatorName: string;
  createdAt: string;
}

export interface KanbanBoard {
  [teamName: string]: {
    [status: string]: KanbanTask[];
  };
}

export const kanbanService = {
  getBoard: async (
    search?: string,
    priority?: string,
  ): Promise<KanbanBoard> => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (priority && priority !== "All") params.append("priority", priority);

    const response = await apiClient.get(`/kanban/board?${params.toString()}`);
    return response.data.data;
  },

  moveTask: async (taskId: string, newStatus: string) => {
    const response = await apiClient.patch("/kanban/move", {
      taskId,
      newStatus,
    });
    return response.data.data;
  },
};
