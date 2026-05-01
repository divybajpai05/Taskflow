// src/modules/kanban/kanban.types.ts

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

export interface MoveTaskInput {
  taskId: string;
  newStatus: string;
}
