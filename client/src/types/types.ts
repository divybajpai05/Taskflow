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
  teams?: { id: string; name: string }[];
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string; // HTML string or plain text
  category: "HR" | "Admin" | "General";
  lastUsed?: Date;
}

export interface EmailRecipient {
  id: string;
  name: string;
  email: string;
  type: "employee" | "external";
  department?: string;
}

export interface EmailDraft {
  recipients: EmailRecipient[];
  subject: string;
  body: string;
  attachments?: File[];
  templateId?: string;
}
