import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/types/types";

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
}

export function TaskDetailModal({
  task,
  open,
  onClose,
  onEdit,
}: TaskDetailModalProps) {
  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{task.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <p className="text-slate-600">{task.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">
                Status
              </p>
              <Badge variant="outline">{task.status}</Badge>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">
                Priority
              </p>
              <Badge>{task.priority}</Badge>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">
                Team
              </p>
              <p>{task.selectTeam}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">
                Due Date
              </p>
              <p>{task.dueDate}</p>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">
              Assignees
            </p>
            <div className="flex flex-wrap gap-2">
              {task.selectMember.map((m) => (
                <Badge key={m} variant="secondary">
                  {m}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="cursor-pointer"
          >
            Close
          </Button>
          <Button className="cursor-pointer" onClick={() => onEdit(task)}>
            Edit Task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
