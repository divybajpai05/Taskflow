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
  Download,
  CalendarDays,
  Eye,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import apiClient from "@/api/client";
import { toast } from "sonner";

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

const LeaveManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [departmentFilter, setDepartmentFilter] = useState<string>("All");
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [stats, setStats] = useState<LeaveStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

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
  }, [fetchLeaves, fetchStats]);

  // Approve leave
  const handleApprove = async (id: string) => {
    setIsSubmitting(id);
    try {
      await apiClient.put(`/leaves/${id}`, { status: "APPROVED" });
      toast.success("Leave request approved!");
      fetchLeaves();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to approve");
    } finally {
      setIsSubmitting(null);
    }
  };

  // Reject leave
  const handleReject = async (id: string) => {
    setIsSubmitting(id);
    try {
      await apiClient.put(`/leaves/${id}`, { status: "REJECTED" });
      toast.success("Leave request rejected!");
      fetchLeaves();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to reject");
    } finally {
      setIsSubmitting(null);
    }
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
          <Button className="cursor-pointer p-5 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-medium flex items-center gap-2 transition-all">
            <Calendar className="w-5 h-5" />
            Add Leave Policy
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
              <SelectItem value="Vacation">Vacation</SelectItem>
              <SelectItem value="Sick Leave">Sick Leave</SelectItem>
              <SelectItem value="Casual Leave">Casual Leave</SelectItem>
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
                                    disabled={isSubmitting === req.id}
                                    className="cursor-pointer p-3 text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-colors"
                                  >
                                    {isSubmitting === req.id ? (
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
                                    disabled={isSubmitting === req.id}
                                    className="cursor-pointer p-3 text-red-600 hover:bg-red-50 rounded-2xl transition-colors"
                                  >
                                    {isSubmitting === req.id ? (
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
                              <button className="cursor-pointer p-3 text-blue-600 hover:bg-gray-100 rounded-2xl transition-colors">
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
      </div>
    </TooltipProvider>
  );
};

export default LeaveManagement;
