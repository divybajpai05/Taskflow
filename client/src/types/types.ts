export type Status = "Todo" | "Done" | "In progress" | "Cancelled" | "On Hold";
export type Priority = "Low" | "Medium" | "High" | "Urgent";

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  selectTeam: string;
  selectMember: string[];
  dueDate: string;
  initials?: string;
}


export interface AddTaskModalProps {
  onAddTask: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  editingTask?: Task | null;
  onCloseEdit?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialDueDate?: string;
}

