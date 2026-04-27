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
import { Download, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/api/client";

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
    case "create":
      return (
        <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
          Create
        </Badge>
      );
    case "update":
      return (
        <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
          Update
        </Badge>
      );
    case "verify":
      return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
          Verify
        </Badge>
      );
    default:
      return <Badge variant="secondary">Activity</Badge>;
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

  const [eventTypes, setEventTypes] = useState<
    { value: string; label: string }[]
  >([{ value: "all", label: "All Events" }]);

  const fetchEventTypes = useCallback(async () => {
    try {
      const response = await apiClient.get("/activities/event-types");
      if (response.data.success) {
        setEventTypes(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch event types:", error);
    }
  }, []);

  useEffect(() => {
    fetchEventTypes();
  }, [fetchEventTypes]);

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
        setTotal(response.data.total);
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
      log.timestamp,
      log.user,
      log.userEmail,
      log.action,
      log.details,
      log.ipAddress,
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

  const exportPDF = () => {
    toast.info("PDF export will be available soon");
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
                  <SelectValue placeholder="Event Type" />
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
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};
