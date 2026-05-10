// components/hr/LeaveManagement.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  CalendarDays,
  Eye,
  Loader2,
  Plus,
  Palette,
  Banknote,
  Check,
  Pencil,
  Trash2,
} from "lucide-react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import apiClient from "@/api/client";
import { toast } from "sonner";
import ViewLeaveDetailsDialog from "./ViewLeaveDetailsDialog";

interface LeaveRequest {
  id: string;
  employee: string;
  email: string;
  avatar: string | null;
  initials: string;
  department: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: string;
}

interface LeaveStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface LeaveType {
  id: string;
  name: string;
  description: string | null;
  color: string;
  isPaid: boolean;
  defaultDays: number;
  requiresApproval: boolean;
  isActive: boolean;
}

const LeaveManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [departmentFilter, setDepartmentFilter] = useState<string>("All");
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [stats, setStats] = useState<LeaveStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<{
    id: string | null;
    type: "approve" | "reject" | null;
  }>({
    id: null,
    type: null,
  });

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmittingType, setIsSubmittingType] = useState(false);
  const [editingType, setEditingType] = useState<LeaveType | null>(null);

  // Form state
  const [typeName, setTypeName] = useState("");
  const [typeDescription, setTypeDescription] = useState("");
  const [typeColor, setTypeColor] = useState("#3b82f6");
  const [typeIsPaid, setTypeIsPaid] = useState(true);
  const [typeDefaultDays, setTypeDefaultDays] = useState(0);
  const [typeRequiresApproval, setTypeRequiresApproval] = useState(true);

  //view leave detail state
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);

  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Predefined colors
  const colorOptions = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#f97316",
    "#6366f1",
    "#14b8a6",
    "#e11d48",
    "#ca8a04",
  ];

  // Fetch leave types
  const fetchLeaveTypes = useCallback(async () => {
    try {
      const response = await apiClient.get("/leave-types");
      if (response.data.success) setLeaveTypes(response.data.data);
    } catch (error) {
      console.error("Failed to fetch leave types:", error);
    }
  }, []);

  // Fetch leaves
  const fetchLeaves = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "All") params.append("status", statusFilter);
      if (typeFilter !== "All") params.append("leaveType", typeFilter);
      if (departmentFilter !== "All")
        params.append("department", departmentFilter);
      if (searchTerm) params.append("search", searchTerm);

      const response = await apiClient.get(`/leaves?${params.toString()}`);
      if (response.data.success) setLeaveRequests(response.data.data);
    } catch (error) {
      toast.error("Failed to load leave requests");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter, typeFilter, departmentFilter]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await apiClient.get("/leaves/stats");
      if (response.data.success) setStats(response.data.data);
    } catch (error) {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
    fetchStats();
    fetchLeaveTypes();
  }, [fetchLeaves, fetchStats, fetchLeaveTypes]);

  // Reset form
  const resetForm = () => {
    setTypeName("");
    setTypeDescription("");
    setTypeColor("#3b82f6");
    setTypeIsPaid(true);
    setTypeDefaultDays(0);
    setTypeRequiresApproval(true);
    setEditingType(null);
  };

  // Open dialog for create
  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Open dialog for edit
  const handleEdit = (leaveType: LeaveType) => {
    setEditingType(leaveType);
    setTypeName(leaveType.name);
    setTypeDescription(leaveType.description || "");
    setTypeColor(leaveType.color);
    setTypeIsPaid(leaveType.isPaid);
    setTypeDefaultDays(leaveType.defaultDays);
    setTypeRequiresApproval(leaveType.requiresApproval);
    setIsDialogOpen(true);
  };

  // Submit leave type
  const handleSubmitLeaveType = async () => {
    if (!typeName.trim()) {
      toast.error("Leave type name is required");
      return;
    }

    setIsSubmittingType(true);
    try {
      if (editingType) {
        // Update
        await apiClient.put(`/leave-types/${editingType.id}`, {
          name: typeName.trim(),
          description: typeDescription.trim() || null,
          color: typeColor,
          isPaid: typeIsPaid,
          defaultDays: typeDefaultDays,
          requiresApproval: typeRequiresApproval,
        });
        toast.success("Leave type updated successfully!");
      } else {
        // Create
        await apiClient.post("/leave-types", {
          name: typeName.trim(),
          description: typeDescription.trim() || null,
          color: typeColor,
          isPaid: typeIsPaid,
          defaultDays: typeDefaultDays,
          requiresApproval: typeRequiresApproval,
        });
        toast.success("Leave type created successfully!");
      }
      setIsDialogOpen(false);
      resetForm();
      fetchLeaveTypes();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to save leave type");
    } finally {
      setIsSubmittingType(false);
    }
  };

  // Delete leave type
  const handleDeleteType = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this leave type? This may affect existing leave requests.",
      )
    ) {
      return;
    }
    try {
      await apiClient.delete(`/leave-types/${id}`);
      toast.success("Leave type deleted successfully!");
      fetchLeaveTypes();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete leave type");
    }
  };

  // Approve leave
  const handleApprove = async (id: string) => {
    setActionLoading({
      id,
      type: "approve",
    });
    try {
      await apiClient.put(`/leaves/${id}`, { status: "APPROVED" });
      toast.success("Leave request approved!");
      fetchLeaves();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to approve");
    } finally {
      setActionLoading({
        id: null,
        type: null,
      });
    }
  };

  // Reject leave
  const handleReject = async (id: string) => {
    setActionLoading({
      id,
      type: "reject",
    });
    try {
      await apiClient.put(`/leaves/${id}`, { status: "REJECTED" });
      toast.success("Leave request rejected!");
      fetchLeaves();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to reject");
    } finally {
      setActionLoading({
        id: null,
        type: null,
      });
    }
  };

  const handleViewDetails = (leave: LeaveRequest) => {
    setSelectedLeave(leave);
    setIsViewDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-emerald-100 text-emerald-700";
      case "Rejected":
        return "bg-red-100 text-red-700";
      case "Pending":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 flex items-center gap-3">
              <CalendarDays /> Leave Management
            </h1>
            <p className="text-gray-600 mt-1">
              Review and manage all leave requests
            </p>
          </div>
          <Button
            onClick={handleAddNew}
            className="cursor-pointer p-5 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-medium flex items-center gap-2 transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Leave Type
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: "Total Requests",
              value: stats.total,
              icon: Users,
              color: "text-blue-600",
            },
            {
              label: "Pending",
              value: stats.pending,
              icon: Clock,
              color: "text-amber-600",
            },
            {
              label: "Approved",
              value: stats.approved,
              icon: CheckCircle,
              color: "text-emerald-600",
            },
            {
              label: "Rejected",
              value: stats.rejected,
              icon: XCircle,
              color: "text-red-600",
            },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col gap-5"
              >
                <div className="flex flex-row justify-between w-full">
                  <p className="text-gray-600 text-sm">{stat.label}</p>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="text-4xl font-semibold text-gray-900">
                  {stat.value}
                </p>
                <p className="text-gray-600 text-xs">This year</p>
              </div>
            );
          })}
        </div>

        {/* Leave Types Section */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Leave Types
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leaveTypes.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                No leave types configured yet. Click "Add Leave Type" to create
                one.
              </div>
            ) : (
              leaveTypes.map((type) => (
                <div
                  key={type.id}
                  className="border rounded-2xl p-4 hover:shadow-md transition-shadow relative group"
                  style={{
                    borderLeftColor: type.color,
                    borderLeftWidth: "4px",
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold"
                        style={{ backgroundColor: type.color }}
                      >
                        {type.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {type.name}
                        </h3>
                        {type.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {type.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(type)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDeleteType(type.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                      {type.isPaid ? "💰 Paid" : "🆓 Unpaid"}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                      {type.defaultDays > 0
                        ? `${type.defaultDays} days/yr`
                        : "No limit"}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                      {type.requiresApproval
                        ? "Requires Approval"
                        : "Auto-approved"}
                    </span>
                    {!type.isActive && (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Search + Filters */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-75 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by employee or reason..."
              className="pl-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-45">
              <SelectValue placeholder="All Leave Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Leave Types</SelectItem>
              {leaveTypes.map((type) => (
                <SelectItem key={type.id} value={type.name}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              fetchLeaves();
              fetchStats();
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-500 uppercase">
                    Employee
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-500 uppercase">
                    Leave Type
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-500 uppercase">
                    Duration
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-500 uppercase">
                    Reason
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leaveRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-500">
                      No leave requests found
                    </td>
                  </tr>
                ) : (
                  leaveRequests.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                            {req.initials}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {req.employee}
                            </div>
                            <div className="text-xs text-gray-500">
                              {req.department}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <Badge>{req.leaveType}</Badge>
                      </td>
                      <td className="px-6 py-6">
                        <div className="text-sm">
                          {req.fromDate} → {req.toDate}
                          <div className="text-xs text-gray-500 mt-0.5">
                            {req.days} days
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-gray-600 text-sm max-w-md truncate">
                        {req.reason}
                      </td>
                      <td className="px-6 py-6">
                        <Badge className={getStatusColor(req.status)}>
                          {req.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-1">
                          {req.status === "Pending" && (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => handleApprove(req.id)}
                                    disabled={actionLoading.id === req.id}
                                    className="cursor-pointer p-3 text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-colors"
                                  >
                                    {actionLoading.id === req.id &&
                                    actionLoading.type === "approve" ? (
                                      <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                      <CheckCircle className="w-5 h-5" />
                                    )}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Approve</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => handleReject(req.id)}
                                    disabled={actionLoading.id === req.id}
                                    className="cursor-pointer p-3 text-red-600 hover:bg-red-50 rounded-2xl transition-colors"
                                  >
                                    {actionLoading.id === req.id &&
                                    actionLoading.type === "reject" ? (
                                      <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                      <XCircle className="w-5 h-5" />
                                    )}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Reject</p>
                                </TooltipContent>
                              </Tooltip>
                            </>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleViewDetails(req)}
                                className="cursor-pointer p-3 text-blue-600 hover:bg-gray-100 rounded-2xl transition-colors"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View Details</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6 text-sm text-gray-500">
          <p>
            Showing 1 to {leaveRequests.length} of {leaveRequests.length}{" "}
            requests
          </p>
        </div>

        {/* Add/Edit Leave Type Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-violet-600" />
                {editingType ? "Edit Leave Type" : "Create Leave Type"}
              </DialogTitle>
              <DialogDescription>
                {editingType
                  ? "Update the leave type details below."
                  : "Define a new leave type for your organization."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="typeName">Leave Type Name *</Label>
                <Input
                  id="typeName"
                  placeholder="e.g., Annual Leave, Sick Leave"
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="typeDescription">Description</Label>
                <Textarea
                  id="typeDescription"
                  placeholder="Brief description of this leave type..."
                  value={typeDescription}
                  onChange={(e) => setTypeDescription(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Color */}
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setTypeColor(color)}
                      className={`w-8 h-8 rounded-lg transition-all ${
                        typeColor === color
                          ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
                          : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Default Days */}
              <div className="space-y-2">
                <Label htmlFor="defaultDays">Default Days Per Year</Label>
                <Input
                  id="defaultDays"
                  type="number"
                  min="0"
                  placeholder="0 = No limit"
                  value={typeDefaultDays}
                  onChange={(e) =>
                    setTypeDefaultDays(parseInt(e.target.value) || 0)
                  }
                />
              </div>

              {/* Switches */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Paid Leave</Label>
                    <p className="text-xs text-gray-500">
                      Employee gets paid during this leave
                    </p>
                  </div>
                  <Switch
                    checked={typeIsPaid}
                    onCheckedChange={setTypeIsPaid}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Requires Approval</Label>
                    <p className="text-xs text-gray-500">
                      Leave requests need manager approval
                    </p>
                  </div>
                  <Switch
                    checked={typeRequiresApproval}
                    onCheckedChange={setTypeRequiresApproval}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitLeaveType}
                disabled={isSubmittingType || !typeName.trim()}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {isSubmittingType ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                {editingType ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ViewLeaveDetailsDialog
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          leave={selectedLeave}
        />
      </div>
    </TooltipProvider>
  );
};

export default LeaveManagement;
