// components/hr/ActivityLog.tsx
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Download,
  Search,
  Filter,
  Calendar,
  User,
  LogIn,
  CheckSquare,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";

// Types
interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  userEmail: string;
  eventType: string;
  action: string;
  details: string;
  taskTitle?: string;
  ipAddress: string;
}

// Mock Data
const INITIAL_LOGS: ActivityLog[] = [
  {
    id: "log1",
    timestamp: "2026-04-16 10:45",
    user: "Prashant Thakur",
    userEmail: "prashant@taskflow.com",
    eventType: "login",
    action: "User Login",
    details: "Successful login from browser",
    ipAddress: "182.68.12.45",
  },
  {
    id: "log2",
    timestamp: "2026-04-16 10:32",
    user: "Neha Gupta",
    userEmail: "neha@taskflow.com",
    eventType: "task",
    action: "Task Status Changed",
    details: "Todo → In Progress",
    taskTitle: "Design new landing page",
    ipAddress: "122.171.45.78",
  },
  {
    id: "log3",
    timestamp: "2026-04-16 09:15",
    user: "Vikram Rao",
    userEmail: "vikram@taskflow.com",
    eventType: "task",
    action: "Task Created",
    details: "New task added",
    taskTitle: "Implement payment gateway",
    ipAddress: "103.45.67.89",
  },
  {
    id: "log4",
    timestamp: "2026-04-15 18:22",
    user: "Priya Patel",
    userEmail: "priya@taskflow.com",
    eventType: "delete",
    action: "Task Deleted",
    details: "Task permanently removed",
    taskTitle: "Old marketing campaign",
    ipAddress: "49.36.12.78",
  },
  {
    id: "log5",
    timestamp: "2026-04-15 14:10",
    user: "Prashant Thakur",
    userEmail: "prashant@taskflow.com",
    eventType: "login",
    action: "User Login",
    details: "Login from mobile app",
    ipAddress: "182.68.12.45",
  },
];

const EVENT_TYPES = [
  { value: "all", label: "All Events" },
  { value: "login", label: "Login" },
  { value: "task", label: "Task Activity" },
  { value: "delete", label: "Delete" },
  { value: "create", label: "Create" },
];

const getEventBadge = (type: string) => {
  switch (type) {
    case "login":
      return (
        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          Login
        </Badge>
      );
    case "task":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          Task
        </Badge>
      );
    case "delete":
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
          Delete
        </Badge>
      );
    default:
      return <Badge variant="secondary">Activity</Badge>;
  }
};

export const ActivityLog: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>(INITIAL_LOGS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEventType, setSelectedEventType] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.taskTitle &&
        log.taskTitle.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType =
      selectedEventType === "all" || log.eventType === selectedEventType;

    return matchesSearch && matchesType;
  });

  const exportCSV = () => {
    alert("✅ Activity log exported as CSV (demo)");
    // In real app: generate and download CSV
  };

  const exportPDF = () => {
    alert("✅ Activity log exported as PDF (demo)");
    // In real app: generate and download PDF
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground">
            Complete audit trail of all user activities on Taskflow
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={exportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="">
          <div className="flex flex-col items-center md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user or task..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Event Type */}
            <div className="w-full md:w-56">
              <Select
                value={selectedEventType}
                onValueChange={setSelectedEventType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="w-full md:w-44">
              <Label className="text-xs text-muted-foreground">From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            {/* Date To */}
            <div className="w-full md:w-44">
              <Label className="text-xs text-muted-foreground">To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-380px)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {log.timestamp}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{log.user}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.userEmail}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getEventBadge(log.eventType)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{log.action}</p>
                        {log.taskTitle && (
                          <p className="text-xs text-muted-foreground">
                            {log.taskTitle}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {log.details}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.ipAddress}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
