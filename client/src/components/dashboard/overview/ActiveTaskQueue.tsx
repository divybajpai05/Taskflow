"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion"; // Import animation tools
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { statusColors } from "@/types/types";
import { Link } from "react-router-dom";

const tasks = [
  {
    name: "Submission form",
    assigned: "Technical Team",
    priority: "Urgent",
    dueDate: "Mar 23",
    status: "In progress",
    owner: "Prashant Thakur",
  },
  {
    name: "Update Signin/signup page",
    assigned: "Technical Team",
    priority: "Medium",
    dueDate: "Mar 19",
    status: "Done",
    owner: "Prashant Thakur",
  },
  {
    name: "Taskflow Home Page",
    assigned: "Technical Team",
    priority: "Medium",
    dueDate: "Mar 18",
    status: "On Hold",
    owner: "Prashant Thakur",
  },
  {
    name: "LinkedIn Scraping",
    assigned: "HR Team",
    priority: "Low",
    dueDate: "Mar 16",
    status: "Cancelled",
    owner: "Prashant Thakur",
  },
  {
    name: "Cold mailing",
    assigned: "No Team",
    priority: "Low",
    dueDate: "Mar 16",
    status: "Todo",
    owner: "Prashant Thakur",
  },
  {
    name: "Database Backup",
    assigned: "DevOps",
    priority: "High",
    dueDate: "Mar 25",
    status: "In progress",
    owner: "Prashant Thakur",
  },
  {
    name: "UI Polish",
    assigned: "Design",
    priority: "Low",
    dueDate: "Mar 26",
    status: "In progress",
    owner: "Prashant Thakur",
  },
];

type Status = "Todo" | "Done" | "In progress" | "Cancelled" | "On Hold";

const statusColors: Record<Status, string> = {
  Todo: "bg-slate-300",
  "In progress": "bg-blue-500",
  Done: "bg-green-500",
  Cancelled: "bg-red-500",
  "On Hold": "bg-black",
};

type Priority = "Low" | "Medium" | "High" | "Urgent";

const priorityColors: Record<Priority, string> = {
  Low: "text-emerald-500 border-emerald-200 bg-emerald-50",
  Medium: "text-yellow-600 border-yellow-200 bg-yellow-50",
  High: "text-red-400 border-red-200 bg-red-50 animate-pulse", // Light Red
  Urgent: "text-red-700 border-red-400 bg-red-100 animate-pulse", // Dark Red
};

export function ActiveTaskQueue() {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayedTasks = isExpanded ? tasks : tasks.slice(0, 5);

  return (
    <div className="rounded-md border bg-white shadow-sm overflow-hidden text-neutral-800">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-lg">Active Task Queue</h3>
        <Link to={'/dashboard/tasks'} className="hover:underline text-blue-600 text-xs">View All Tasks → </Link>
      </div>

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

        {/* We use asChild or map directly inside TableBody */}
        <TableBody>
          <AnimatePresence initial={false}>
            {displayedTasks.map((task, index) => (
              <motion.tr
                key={index}
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
                    Assigned: {task.assigned}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={priorityColors[task.priority as Priority]}
                  >
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{task.dueDate}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        statusColors[task.status as keyof typeof statusColors]
                      }`}
                    />
                    <span className="text-sm">{task.status}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{task.owner}</TableCell>
              </motion.tr>
            ))}
          </AnimatePresence>
        </TableBody>
      </Table>

      <div className="p-4 border-t flex justify-between items-center text-xs text-muted-foreground">
        <span>
          Showing {displayedTasks.length} of {tasks.length} tasks
        </span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="cursor-pointer text-blue-600 font-semibold hover:underline transition-all"
        >
          {isExpanded ? "Show Less ↑" : "View All ↓"}
        </button>
      </div>
    </div>
  );
}
