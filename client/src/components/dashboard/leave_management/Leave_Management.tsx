import React, { useState } from "react";
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

interface LeaveRequest {
  id: number;
  employee: string;
  avatar: string;
  department: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
}

const LeaveManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [departmentFilter, setDepartmentFilter] = useState<string>("All");

  const leaveRequests: LeaveRequest[] = [
    {
      id: 1,
      employee: "Rahul Sharma",
      avatar: "https://i.pravatar.cc/150?u=rahul",
      department: "Engineering",
      leaveType: "Vacation",
      fromDate: "2026-04-15",
      toDate: "2026-04-22",
      days: 6,
      reason: "Family vacation to hill station",
      status: "Pending",
    },
    {
      id: 2,
      employee: "Priya Patel",
      avatar: "https://i.pravatar.cc/150?u=priya",
      department: "Marketing",
      leaveType: "Sick Leave",
      fromDate: "2026-04-12",
      toDate: "2026-04-14",
      days: 2,
      reason: "Not feeling well - fever and cold",
      status: "Approved",
    },
    {
      id: 3,
      employee: "Amit Kumar",
      avatar: "https://i.pravatar.cc/150?u=amit",
      department: "Finance",
      leaveType: "Casual Leave",
      fromDate: "2026-04-18",
      toDate: "2026-04-18",
      days: 1,
      reason: "Personal work",
      status: "Rejected",
    },
    {
      id: 4,
      employee: "Sneha Gupta",
      avatar: "https://i.pravatar.cc/150?u=sneha",
      department: "HR",
      leaveType: "Vacation",
      fromDate: "2026-04-25",
      toDate: "2026-05-02",
      days: 6,
      reason: "Going to native place for wedding",
      status: "Pending",
    },
  ];

  const filteredRequests = leaveRequests.filter((req) => {
    const matchesSearch =
      req.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.reason.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "All" || req.status === statusFilter;
    const matchesType = typeFilter === "All" || req.leaveType === typeFilter;
    const matchesDept =
      departmentFilter === "All" || req.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesType && matchesDept;
  });

  const stats = {
    total: leaveRequests.length,
    pending: leaveRequests.filter((r) => r.status === "Pending").length,
    approved: leaveRequests.filter((r) => r.status === "Approved").length,
    rejected: leaveRequests.filter((r) => r.status === "Rejected").length,
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

  const handleApprove = (id: number) => {
    alert(`✅ Leave request #${id} has been Approved`);
  };

  const handleReject = (id: number) => {
    if (confirm(`Reject leave request #${id}?`)) {
      alert(`❌ Leave request #${id} has been Rejected`);
    }
  };

  const handleViewDetails = (id: number) => {
    alert(`📋 Viewing details for leave request #${id}`);
    // TODO: Open modal in future
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

        {/* Top Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              className="bg-transparent focus:outline-none text-sm"
              defaultValue="2026-04-12"
            />
          </div>

          <button className="cursor-pointer px-5 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-2xl text-sm font-medium">
            This Month
          </button>
          <button className="cursor-pointer px-5 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-2xl text-sm font-medium">
            This Quarter
          </button>

          {/* Department Filter - shadcn Select */}
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="cursor-pointer w-45 bg-white border border-gray-200 rounded-2xl">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem className="cursor-pointer" value="All">
                All Departments
              </SelectItem>
              <SelectItem className="cursor-pointer" value="Engineering">
                Engineering
              </SelectItem>
              <SelectItem className="cursor-pointer" value="Marketing">
                Marketing
              </SelectItem>
              <SelectItem className="cursor-pointer" value="Finance">
                Finance
              </SelectItem>
              <SelectItem className="cursor-pointer" value="HR">
                HR
              </SelectItem>
            </SelectContent>
          </Select>

          <button className="cursor-pointer flex items-center gap-2 px-5 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-2xl text-sm font-medium">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>

          <button className="cursor-pointer flex items-center gap-2 px-5 py-2 bg-black text-white rounded-2xl text-sm font-medium">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col gap-5">
            <div className="flex flex-row justify-between w-full">
              <p className="text-gray-600 text-sm">Total Requests</p>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-4xl font-semibold text-gray-900">
              {stats.total}
            </p>
            <p className="text-gray-600 text-xs">This year</p>
          </div>

          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col gap-5">
            <div className="flex flex-row justify-between w-full">
              <p className="text-gray-600 text-sm">Pending</p>
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <p className="text-4xl font-semibold text-gray-900">
              {stats.pending}
            </p>
            <p className="text-gray-600 text-xs">This year</p>
          </div>

          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col gap-5">
            <div className="flex flex-row justify-between w-full">
              <p className="text-gray-500 text-sm">Approved</p>
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-4xl font-semibold text-gray-900">
              {stats.approved}
            </p>
            <p className="text-gray-600 text-xs">This year</p>
          </div>

          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col gap-5">
            <div className="flex flex-row justify-between w-full">
              <p className="text-gray-500 text-sm">Rejected</p>
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-4xl font-semibold text-gray-900">
              {stats.rejected}
            </p>
            <p className="text-gray-600 text-xs">This year</p>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-75 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by employee or reason..."
              className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-300 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter - shadcn Select */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-white border border-gray-200 rounded-2xl">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          {/* Leave Type Filter - shadcn Select */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-45 bg-white border border-gray-200 rounded-2xl">
              <SelectValue placeholder="All Leave Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Leave Types</SelectItem>
              <SelectItem value="Vacation">Vacation</SelectItem>
              <SelectItem value="Sick Leave">Sick Leave</SelectItem>
              <SelectItem value="Casual Leave">Casual Leave</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
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
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                      <img
                        src={req.avatar}
                        alt={req.employee}
                        className="w-9 h-9 rounded-full object-cover"
                      />
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
                    <Badge className={`${getStatusColor(req.status)}`}>
                      {req.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-1">
                      {/* Approve Button with Tooltip */}
                      {req.status === "Pending" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleApprove(req.id)}
                              className="cursor-pointer p-3 text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-colors"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Approve</p>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {/* Reject Button with Tooltip */}
                      {req.status === "Pending" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleReject(req.id)}
                              className="cursor-pointer p-3 text-red-600 hover:bg-red-50 rounded-2xl transition-colors"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Reject</p>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {/* View Details Button with Tooltip */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleViewDetails(req.id)}
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6 text-sm text-gray-500">
          <p>
            Showing 1 to {filteredRequests.length} of {leaveRequests.length}{" "}
            requests
          </p>
          <div className="flex items-center gap-2">
            <button className="cursor-pointer px-4 py-2 border border-gray-200 rounded-2xl hover:bg-gray-50">
              Previous
            </button>
            <button className="cursor-pointer px-4 py-2 border border-gray-200 rounded-2xl bg-black text-white">
              1
            </button>
            <button className="cursor-pointer px-4 py-2 border border-gray-200 rounded-2xl hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default LeaveManagement;
