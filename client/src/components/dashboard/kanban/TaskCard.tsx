// components/dashboard/kanban/TaskCard.tsx
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { priorityColors } from "../overview/components/ActiveTaskQueue";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { KanbanTask } from "@/services/kanban.service";

interface TaskCardProps {
  task: KanbanTask;
  onClick: (task: KanbanTask) => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isOverdue = task.dueDate
    ? new Date(task.dueDate.split("/").reverse().join("-")) < new Date()
    : false;

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.985]"
    >
      <div className="flex justify-between items-start mb-3">
        <Badge
          variant="secondary"
          className={`text-xs font-bold uppercase border-none ${
            priorityColors[task.priority as keyof typeof priorityColors]
          }`}
        >
          {task.priority}
        </Badge>

        {task.status === "Cancelled" && (
          <span className="text-red-500 text-xs line-through">Cancelled</span>
        )}
      </div>

      <h3 className="font-medium text-slate-900 line-clamp-2 mb-2 leading-tight">
        {task.title}
      </h3>

      {task.description && (
        <p className="text-sm text-slate-600 line-clamp-2 mb-4">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Calendar className="h-3.5 w-3.5" />
          <span className={isOverdue ? "text-red-600" : ""}>
            {task.dueDate || "No date"}
          </span>
        </div>

        <div className="flex -space-x-1">
          {task.assignees.slice(0, 3).map((member, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full border-2 border-white bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center ring-1 ring-slate-100"
              title={member}
            >
              {getInitials(member)}
            </div>
          ))}
          {task.assignees.length > 3 && (
            <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 text-slate-600 text-[10px] flex items-center justify-center">
              +{task.assignees.length - 3}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
