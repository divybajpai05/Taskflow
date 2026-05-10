import React from "react";
import { Eye } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

interface ViewLeaveDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leave: LeaveRequest | null;
}

const ViewLeaveDetailsDialog: React.FC<ViewLeaveDetailsDialogProps> = ({
  open,
  onOpenChange,
  leave,
}) => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            Leave Request Details
          </DialogTitle>

          <DialogDescription>
            Complete leave request information
          </DialogDescription>
        </DialogHeader>

        {leave && (
          <div className="space-y-6 py-4">
            {/* Employee */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold">
                {leave.initials}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {leave.employee}
                </h3>

                <p className="text-sm text-gray-500">{leave.email}</p>

                <p className="text-sm text-gray-500">{leave.department}</p>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs text-gray-500 mb-1">Leave Type</p>

                <Badge>{leave.leaveType}</Badge>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs text-gray-500 mb-1">Status</p>

                <Badge className={getStatusColor(leave.status)}>
                  {leave.status}
                </Badge>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs text-gray-500 mb-1">From Date</p>

                <p className="font-medium">{leave.fromDate}</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs text-gray-500 mb-1">To Date</p>

                <p className="font-medium">{leave.toDate}</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 col-span-2">
                <p className="text-xs text-gray-500 mb-1">Total Duration</p>

                <p className="font-medium">{leave.days} days</p>
              </div>
            </div>

            {/* Reason */}
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs text-gray-500 mb-2">Leave Reason</p>

              <p className="text-sm text-gray-700 leading-relaxed">
                {leave.reason}
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button className="cursor-pointer" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewLeaveDetailsDialog;
