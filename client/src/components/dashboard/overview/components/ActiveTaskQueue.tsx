// components/dashboard/overview/components/ActiveTaskQueue.tsx
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import apiClient from "@/api/client";

interface ActiveTask {
  id: string;
  name: string;
  assignedTeam: string;
  priority: string;
  dueDate: string;
  status: string;
  createdBy: {
    id: string;
    name: string;
  };
}

export const StatusColors: Record<string, string> = {
  Todo: "bg-yellow-500",
  "In progress": "bg-blue-500",
  Done: "bg-green-500",
  Cancelled: "bg-red-500",
  "On Hold": "bg-slate-500",
};

export const priorityColors: Record<string, string> = {
  Low: "text-emerald-500 border-emerald-200 bg-emerald-50",
  Medium: "text-yellow-600 border-yellow-200 bg-yellow-50",
  High: "text-red-400 border-red-200 bg-red-50",
  Urgent: "text-red-700 border-red-400 bg-red-100",
};

export function ActiveTaskQueue() {
  const [tasks, setTasks] = useState<ActiveTask[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchActiveTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const limit = isExpanded ? 100 : 5;
      const response = await apiClient.get(
        `/dashboard/active-tasks?limit=${limit}&offset=0`,
      );

      if (response.data.success) {
        // ✅ Backend returns { tasks: [...], total: number, showing: number }
        const data = response.data.data;
        setTasks(data.tasks || []);
        setTotalTasks(data.total || 0);
      }
    } catch (error) {
      console.error("Failed to fetch active tasks:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isExpanded]);

  useEffect(() => {
    fetchActiveTasks();
  }, [fetchActiveTasks]);

  // Manually slice for display when expanded shows all, collapsed shows 5
  const displayedTasks = isExpanded ? tasks : tasks.slice(0, 5);

  return (
    <div className="rounded-md border bg-white shadow-sm overflow-hidden text-neutral-800">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex flex-row gap-2 items-center">
          <h3 className="font-semibold text-lg">Active Task Queue</h3>
          <span className="text-blue-600 font-bold">{`(${totalTasks})`}</span>
        </div>
        <Link
          to={"/dashboard/tasks"}
          className="hover:underline text-blue-600 text-xs font-semibold"
        >
          View All Tasks →
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex justify-center py-12 text-sm text-muted-foreground">
          No active tasks
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead className="w-4"></TableHead>
              <TableHead className="text-xs font-bold">TASK NAME</TableHead>
              <TableHead className="text-xs font-bold">PRIORITY</TableHead>
              <TableHead className="text-xs font-bold">DUE DATE</TableHead>
              <TableHead className="text-xs font-bold">STATUS</TableHead>
              <TableHead className="text-xs font-bold">CREATED BY</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <AnimatePresence initial={false}>
              {displayedTasks.map((task) => (
                <motion.tr
                  key={task.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="border-b transition-colors hover:bg-slate-50/50"
                >
                  <TableCell></TableCell>
                  <TableCell>
                    <div className="font-medium">{task.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Assigned: {task.assignedTeam}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        priorityColors[
                          task.priority as keyof typeof priorityColors
                        ] || ""
                      }
                    >
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{task.dueDate}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${StatusColors[task.status as keyof typeof StatusColors] || "bg-gray-500"}`}
                      />
                      <span className="text-sm">{task.status}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {task.createdBy?.name || "Unknown"}
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      )}

      {totalTasks > 5 && (
        <div className="p-4 border-t flex justify-between items-center text-xs text-muted-foreground">
          <span>
            Showing {displayedTasks.length} of {totalTasks} tasks
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="cursor-pointer text-blue-600 font-semibold hover:underline transition-all"
          >
            {isExpanded ? "Show Less ↑" : "View All ↓"}
          </button>
        </div>
      )}
    </div>
  );
}
