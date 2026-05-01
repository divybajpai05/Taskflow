// components/dashboard/kanban/KanbanColumn.tsx
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { KanbanTask } from "@/services/kanban.service";

interface KanbanColumnProps {
  team: string;
  status: string;
  tasks: KanbanTask[];
  colorClass: string;
  onTaskClick: (task: KanbanTask) => void;
  isCollapsedByDefault?: boolean;
}

export function KanbanColumn({
  team,
  status,
  tasks,
  colorClass,
  onTaskClick,
  isCollapsedByDefault = false,
}: KanbanColumnProps) {
  const [isCollapsed, setIsCollapsed] = useState(isCollapsedByDefault);

  const droppableId = `${team}-${status}`;

  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-h-125 rounded-xl border transition-colors ${
        isOver ? "border-blue-400 bg-blue-50/50" : ""
      }`}
    >
      <div
        className="px-5 py-4 flex items-center justify-between border-b bg-white rounded-t-xl cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3">
          <div className="font-semibold text-base">{status}</div>
          <div className="text-sm font-medium bg-white/80 px-2.5 py-0.5 rounded-full">
            {tasks.length}
          </div>
        </div>
        <button>
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </button>
      </div>

      {!isCollapsed && (
        <div className="flex-1 p-4 space-y-3 min-h-100">
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-slate-400 text-sm border border-dashed rounded-lg">
                Drop tasks here
              </div>
            ) : (
              tasks.map((task) => (
                <TaskCard key={task.id} task={task} onClick={onTaskClick} />
              ))
            )}
          </SortableContext>
        </div>
      )}
    </div>
  );
}
