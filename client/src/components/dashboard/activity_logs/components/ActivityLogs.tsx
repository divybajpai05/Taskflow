// components/hr/ActivityLog.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Download, Search, Loader2, User, Clock, FileText } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/api/client";

// Types
interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  userEmail: string;
  action: string;
  entityType: string;
  details: any;
  ipAddress: string;
}

// ✅ Auto-detect event type from action text
const getEventBadge = (action: string, entityType: string) => {
  const actionLower = action.toLowerCase();

  if (actionLower.includes("login") || actionLower.includes("logged in")) {
    return (
      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
        Login
      </Badge>
    );
  }
  if (
    actionLower.includes("delete") ||
    actionLower.includes("remove") ||
    actionLower.includes("deleted")
  ) {
    return (
      <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
        Delete
      </Badge>
    );
  }
  if (
    actionLower.includes("create") ||
    actionLower.includes("invite") ||
    actionLower.includes("added")
  ) {
    return (
      <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
        Create
      </Badge>
    );
  }
  if (
    actionLower.includes("update") ||
    actionLower.includes("change") ||
    actionLower.includes("modified")
  ) {
    return (
      <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
        Update
      </Badge>
    );
  }
  if (actionLower.includes("moved") || actionLower.includes("status")) {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
        Status
      </Badge>
    );
  }
  if (actionLower.includes("approve") || actionLower.includes("reject")) {
    return (
      <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
        Approve
      </Badge>
    );
  }

  // Fallback by entity type
  const entityBadges: Record<string, React.ReactNode> = {
    task: (
      <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">
        Task
      </Badge>
    ),
    user: (
      <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
        User
      </Badge>
    ),
    role: (
      <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
        Role
      </Badge>
    ),
    team: (
      <Badge className="bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300">
        Team
      </Badge>
    ),
    workspace: (
      <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
        Workspace
      </Badge>
    ),
    leave: (
      <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
        Leave
      </Badge>
    ),
    attendance: (
      <Badge className="bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-300">
        Attendance
      </Badge>
    ),
  };

  return (
    entityBadges[entityType] || <Badge variant="secondary">Activity</Badge>
  );
};

// ✅ Get entity icon based on type
const getEntityIcon = (entityType: string) => {
  switch (entityType) {
    case "task":
      return <FileText className="h-4 w-4 text-cyan-500" />;
    case "user":
      return <User className="h-4 w-4 text-indigo-500" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

export const ActivityLog: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEventType, setSelectedEventType] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const eventTypes = [
    { value: "all", label: "All Activities" },
    { value: "create", label: "Created" },
    { value: "update", label: "Updated" },
    { value: "delete", label: "Deleted" },
    { value: "status", label: "Status Changed" },
    { value: "task", label: "Tasks" },
    { value: "user", label: "Users" },
    { value: "role", label: "Roles" },
    { value: "team", label: "Teams" },
    { value: "workspace", label: "Workspaces" },
    { value: "leave", label: "Leaves" },
    { value: "attendance", label: "Attendance" },
  ];

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedEventType !== "all")
        params.append("eventType", selectedEventType);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      params.append("limit", "100");

      const response = await apiClient.get(`/activities?${params.toString()}`);
      if (response.data.success) {
        setLogs(response.data.data);
        setTotal(response.data.total || response.data.data.length);
      }
    } catch (error: any) {
      console.error("Failed to fetch activity logs:", error);
      toast.error("Failed to load activity logs");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedEventType, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const exportCSV = () => {
    if (logs.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Timestamp",
      "User",
      "Email",
      "Action",
      "Details",
      "IP Address",
    ];
    const rows = logs.map((log) => [
      new Date(log.timestamp).toLocaleString(),
      log.user,
      log.userEmail || "",
      log.action,
      typeof log.details === "string"
        ? log.details
        : JSON.stringify(log.details),
      log.ipAddress || "N/A",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();

    toast.success("CSV exported successfully");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground">
            Complete audit trail of all activities across your workspace
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="">
          <div className="flex flex-col items-center md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user or action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="w-full md:w-56">
              <Select
                value={selectedEventType}
                onValueChange={setSelectedEventType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Activities" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-44">
              <Label className="text-xs text-muted-foreground">From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

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
          <CardTitle>Recent Activities ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No activity logs found
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-380px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                    <TableHead className="w-[200px]">User</TableHead>
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead className="w-[100px]">IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
                            <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                              {log.user
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2) || "?"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{log.user}</p>
                            {log.userEmail && (
                              <p className="text-xs text-muted-foreground">
                                {log.userEmail}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getEventBadge(log.action, log.entityType)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          {getEntityIcon(log.entityType)}
                          <div>
                            <p className="text-sm">{log.action}</p>
                            {typeof log.details === "object" &&
                              log.details !== null && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {Object.entries(log.details)
                                    .filter(
                                      ([key]) =>
                                        ![
                                          "taskTitle",
                                          "roleName",
                                          "userName",
                                          "workspaceName",
                                        ].includes(key),
                                    )
                                    .map(([key, value]) => `${key}: ${value}`)
                                    .join(" • ")}
                                </p>
                              )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {log.ipAddress || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
