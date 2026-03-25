"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Users,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Priority = "Low" | "Medium" | "High" | "Urgent";

const priorityStyles: Record<Priority, string> = {
  Low: "bg-green-50 text-green-700 border-green-200",
  Medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
  High: "bg-red-50 text-red-500 border-red-200",
  Urgent: "bg-red-100 text-red-700 border-red-400 font-bold animate-pulse",
};

const DueTaskList = [
  {
    name: "Submission form",
    team: "Technical Team",
    priority: "Urgent",
    dueDate: "Mar 23",
    assignedMember: ["Prashant", "Shiva"],
  },
  {
    name: "API Integration",
    team: "Backend Team",
    priority: "High",
    dueDate: "Mar 22",
    assignedMember: ["Amit"],
  },
  {
    name: "Design Review",
    team: "UI/UX Team",
    priority: "Medium",
    dueDate: "Mar 21",
    assignedMember: ["Siddharth"],
  },
  {
    name: "Client Feedback",
    team: "Sales Team",
    priority: "Urgent",
    dueDate: "Mar 20",
    assignedMember: ["Neha"],
  },
  {
    name: "Bug Fixes",
    team: "Technical Team",
    priority: "High",
    dueDate: "Mar 19",
    assignedMember: ["Rahul"],
  },
];

export default function OverDueList() {
  const [isExpanded, setIsExpanded] = useState(false);

  // Only show 3 tasks by default
  const displayedTasks = isExpanded ? DueTaskList : DueTaskList.slice(0, 3);

  return (
    <div className="flex flex-col border rounded-xl text-neutral-800 overflow-hidden bg-white shadow-md border-red-100">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-red-50/40 border-b">
        <div className="flex items-center gap-2">
          <div className="bg-red-100 p-1.5 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 leading-none">
              Overdue Tasks
            </h3>
            <p className="text-[11px] text-red-600 font-medium mt-1">
              Requires immediate action
            </p>
          </div>
        </div>
        <Badge
          variant="destructive"
          className="px-2 py-0.5 rounded-full text-xs"
        >
          {DueTaskList.length} Overdue
        </Badge>
      </div>

      {/* Animated Task List */}
      <div className="flex flex-col divide-y">
        <AnimatePresence initial={false}>
          {displayedTasks.map((task, index) => (
            <motion.div
              key={task.name + index} // Better to use unique ID if available
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-slate-800">{task.name}</h4>
                <div className="flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded-md">
                  <Calendar className="w-3 h-3" />
                  {task.dueDate}
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" /> {task.team}
                </span>
                <span>•</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] uppercase py-0 ${priorityStyles[task.priority as Priority]}`}
                >
                  {task.priority}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                {task.assignedMember.map((member) => (
                  <Badge
                    key={member}
                    variant="secondary"
                    className="text-[10px] bg-blue-50 text-blue-700 border-blue-100 font-medium"
                  >
                    {member}
                  </Badge>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* View All / View Less Toggle */}
      {DueTaskList.length > 3 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="cursor-pointer w-full p-3 text-xs font-bold text-slate-600 bg-slate-50/50 hover:bg-slate-100 border-t flex items-center justify-center gap-1 transition-all"
        >
          {isExpanded ? (
            <>
              View Less <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              View All ({DueTaskList.length - 3} more){" "}
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
