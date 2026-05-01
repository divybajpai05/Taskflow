"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Users,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "@/api/client";

type Priority = "Low" | "Medium" | "High" | "Urgent";

const priorityStyles: Record<Priority, string> = {
  Low: "bg-green-50 text-green-700 border-green-200",
  Medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
  High: "bg-red-50 text-red-500 border-red-200",
  Urgent: "bg-red-100 text-red-700 border-red-400 font-bold animate-pulse",
};

interface OverdueTask {
  id: string;
  title: string;
  teamName: string;
  priority: string;
  dueDate: string;
  assignees: string[];
}

export default function OverDueList() {
  const [tasks, setTasks] = useState<OverdueTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchOverdueTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      // Get tasks past due date (not Done/Cancelled)
      const response = await apiClient.get("/tasks");
      if (response.data.success) {
        const today = new Date();
        const overdue = response.data.data
          .filter((t: any) => {
            if (!t.dueDate) return false;
            if (t.status === "DONE" || t.status === "CANCELLED") return false;
            const parts = t.dueDate.split("/");
            if (parts.length === 3) {
              const [day, month, year] = parts.map(Number);
              const dueDate = new Date(2000 + year, month - 1, day);
              return dueDate < today;
            }
            return false;
          })
          .map((t: any) => ({
            id: t.id,
            title: t.title,
            teamName: t.teamName || "No Team",
            priority:
              t.priority?.charAt(0).toUpperCase() +
                t.priority?.slice(1).toLowerCase() || "Medium",
            dueDate: t.dueDate,
            assignees: t.assignees || [],
          }));
        setTasks(overdue);
      }
    } catch (error) {
      console.error("Failed to fetch overdue tasks:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverdueTasks();
  }, [fetchOverdueTasks]);

  const displayedTasks = isExpanded ? tasks : tasks.slice(0, 3);

  if (isLoading) {
    return (
      <div className="flex flex-col border rounded-xl text-neutral-800 overflow-hidden bg-white">
        <div className="flex items-center justify-between p-4 bg-red-50/40 border-b">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-slate-900 leading-none">
              Overdue Tasks
            </h3>
          </div>
        </div>
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col border rounded-xl text-neutral-800 overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-red-50/40 border-b">
        <div className="flex items-center gap-2">
          <div className="rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 leading-none">
              Overdue Tasks
            </h3>
            <p className="text-[11px] text-red-600 font-medium mt-1">
              {tasks.length > 0
                ? "Requires immediate action"
                : "No overdue tasks"}
            </p>
          </div>
        </div>
        <Badge
          variant="destructive"
          className="px-2 py-0.5 rounded-full text-xs"
        >
          {tasks.length} Overdue
        </Badge>
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="flex justify-center py-12 text-sm text-muted-foreground">
          No overdue tasks 🎉
        </div>
      ) : (
        <div className="flex flex-col divide-y">
          <AnimatePresence initial={false}>
            {displayedTasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-slate-800">{task.title}</h4>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded-md">
                    <Calendar className="w-3 h-3" />
                    {task.dueDate}
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" /> {task.teamName}
                  </span>
                  <span>•</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] uppercase py-0 ${priorityStyles[task.priority as Priority] || ""}`}
                  >
                    {task.priority}
                  </Badge>
                </div>

                {task.assignees.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {task.assignees.map((member) => (
                      <Badge
                        key={member}
                        variant="secondary"
                        className="text-[10px] bg-blue-50 text-blue-700 border-blue-100 font-medium"
                      >
                        {member}
                      </Badge>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* View All / View Less Toggle */}
      {tasks.length > 3 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="cursor-pointer w-full p-3 text-xs font-semibold text-blue-600 bg-slate-50/50 hover:bg-slate-100 border-t flex items-center justify-center gap-1 transition-all"
        >
          {isExpanded ? (
            <>
              View Less <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              View All ({tasks.length - 3} more){" "}
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
