// components/dashboard/leave_management/LeavePage.tsx
import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CalendarIcon,
  Plus,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Infinity,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import apiClient from "@/api/client";
import { useAuthStore } from "@/stores";

interface LeaveBalance {
  id: string;
  name: string;
  color: string;
  description: string | null;
  isPaid: boolean;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  exhausted: boolean;
}

interface MyLeave {
  id: string;
  leaveType: string;
  leaveTypeColor: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: string;
  createdAt: string;
}

export default function LeavePage() {
  const { user } = useAuthStore();

  // State
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance[]>([]);
  const [myLeaves, setMyLeaves] = useState<MyLeave[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [selectedType, setSelectedType] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [balanceRes, leavesRes] = await Promise.all([
        apiClient.get("/leaves/balance"),
        apiClient.get("/leaves/my"),
      ]);
      if (balanceRes.data.success) setLeaveBalance(balanceRes.data.data);
      if (leavesRes.data.success) setMyLeaves(leavesRes.data.data);
    } catch (error) {
      toast.error("Failed to load leave data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedLeaveType = leaveBalance.find((t) => t.id === selectedType);

  const handleSubmit = async () => {
    setFormError("");

    if (!selectedType) {
      setFormError("Please select a leave type");
      return;
    }
    if (!startDate || !endDate) {
      setFormError("Please select start and end dates");
      return;
    }
    if (endDate < startDate) {
      setFormError("End date must be after start date");
      return;
    }
    if (selectedLeaveType?.exhausted) {
      setFormError("You have exhausted this leave type");
      return;
    }

    const days =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;

    if (
      selectedLeaveType &&
      selectedLeaveType.remainingDays !== Number.POSITIVE_INFINITY &&
      days > selectedLeaveType.remainingDays
    ) {
      setFormError(
        `You only have ${selectedLeaveType.remainingDays} days remaining`,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post("/leaves", {
        userId: user?.id,
        leaveTypeId: selectedType,
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        reason,
      });
      toast.success("Leave request submitted!");
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Failed to submit leave request",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedType("");
    setStartDate(undefined);
    setEndDate(undefined);
    setReason("");
    setFormError("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 gap-1">
            <CheckCircle2 className="h-3 w-3" /> Approved
          </Badge>
        );
      case "Rejected":
        return (
          <Badge className="bg-red-100 text-red-700 gap-1">
            <XCircle className="h-3 w-3" /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-100 text-amber-700 gap-1">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        );
    }
  };

  const totalUsed = leaveBalance.reduce((sum, t) => sum + t.usedDays, 0);
  const totalAllowed = leaveBalance.reduce((sum, t) => sum + t.totalDays, 0);
  const pendingCount = myLeaves.filter((l) => l.status === "Pending").length;

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Apply & Manage leaves
          </h1>
          <p className="text-muted-foreground mt-1">
            View your leave balance and apply for time off
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-blue-600 hover:bg-blue-700 cursor-pointer gap-2"
              onClick={resetForm}
            >
              <Plus className="h-4 w-4" /> Apply for Leave
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Apply for Leave</DialogTitle>
              <DialogDescription>
                Submit a new leave request for approval
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Leave Type */}
              <div className="space-y-2">
                <Label>Leave Type *</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveBalance.map((type) => (
                      <SelectItem
                        key={type.id}
                        value={type.id}
                        disabled={type.exhausted}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: type.color }}
                          />
                          <span>{type.name}</span>
                          {type.exhausted && (
                            <span className="text-xs text-red-500">
                              (Exhausted)
                            </span>
                          )}
                          {type.remainingDays !== Number.POSITIVE_INFINITY && (
                            <span className="text-xs text-muted-foreground ml-auto">
                              {type.remainingDays}d left
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Type Info */}
              {selectedLeaveType && (
                <div
                  className="p-3 rounded-lg border"
                  style={{
                    borderLeftColor: selectedLeaveType.color,
                    borderLeftWidth: "4px",
                  }}
                >
                  <p className="font-medium">{selectedLeaveType.name}</p>
                  <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                    <span>Used: {selectedLeaveType.usedDays}d</span>
                    <span>
                      Remaining:{" "}
                      {selectedLeaveType.remainingDays ===
                      Number.POSITIVE_INFINITY
                        ? "Unlimited"
                        : `${selectedLeaveType.remainingDays}d`}
                    </span>
                    <span>
                      {selectedLeaveType.isPaid ? "💰 Paid" : "Unpaid"}
                    </span>
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "dd/MM/yyyy") : "Select"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "dd/MM/yyyy") : "Select"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) =>
                          startDate ? date < startDate : date < new Date()
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Days Count */}
              {startDate && endDate && (
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <p className="text-sm text-blue-700">
                    Total:{" "}
                    <span className="font-bold">
                      {Math.ceil(
                        (endDate.getTime() - startDate.getTime()) /
                          (1000 * 60 * 60 * 24),
                      ) + 1}{" "}
                      days
                    </span>
                  </p>
                </div>
              )}

              {/* Reason */}
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea
                  placeholder="Briefly describe the reason for leave..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="resize-none h-20"
                />
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {formError}
                </div>
              )}

              <Button
                className="w-full cursor-pointer"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Submit Leave Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Leave Types</p>
                <p className="text-2xl font-bold">{leaveBalance.length}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Days Used</p>
                <p className="text-2xl font-bold">{totalUsed}</p>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Allowed</p>
                <p className="text-2xl font-bold">
                  {totalAllowed > 0 ? (
                    totalAllowed
                  ) : (
                    <Infinity className="h-5 w-5" />
                  )}
                </p>
              </div>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Balance Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Balance</CardTitle>
          <CardDescription>
            Your leave entitlement for this year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leaveBalance.length === 0 ? (
              <p className="text-muted-foreground col-span-full text-center py-8">
                No leave types configured yet.
              </p>
            ) : (
              leaveBalance.map((type) => (
                <div
                  key={type.id}
                  className="border rounded-xl p-4 hover:shadow-md transition-shadow"
                  style={{
                    borderLeftColor: type.color,
                    borderLeftWidth: "4px",
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: type.color }}
                      >
                        {type.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{type.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {type.isPaid ? "Paid" : "Unpaid"}
                        </p>
                      </div>
                    </div>
                    {type.exhausted && (
                      <Badge className="bg-red-100 text-red-700 text-xs">
                        Exhausted
                      </Badge>
                    )}
                    {type.remainingDays === Number.POSITIVE_INFINITY && (
                      <Badge className="bg-green-100 text-green-700 text-xs">
                        Unlimited
                      </Badge>
                    )}
                  </div>

                  {/* Progress bar */}
                  {type.totalDays > 0 ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{type.usedDays}d used</span>
                        <span>{type.remainingDays}d remaining</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (type.usedDays / type.totalDays) * 100)}%`,
                            backgroundColor:
                              type.usedDays / type.totalDays > 0.8
                                ? "#ef4444"
                                : type.usedDays / type.totalDays > 0.5
                                  ? "#f59e0b"
                                  : type.color,
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-right">
                        {type.totalDays}d total
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No limit set
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Leave History */}
      <Card>
        <CardHeader>
          <CardTitle>Leave History</CardTitle>
          <CardDescription>
            Your leave requests and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myLeaves.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No leave requests yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myLeaves.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: leave.leaveTypeColor }}
                        />
                        <span className="font-medium">{leave.leaveType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {leave.fromDate} → {leave.toDate}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{leave.days}d</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(leave.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {leave.createdAt
                        ? new Date(leave.createdAt).toLocaleDateString()
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
