// components/dashboard/calendar/EventDetailDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  AlertCircle,
  Calendar,
  Building2,
  FileText,
  PartyPopper,
  Percent,
} from "lucide-react";

interface EventDetailDialogProps {
  open: boolean;
  onClose: () => void;
  eventData: {
    type: "attendance" | "leave" | "holiday";
    title: string;
    date: string;
    // Attendance
    present?: number;
    absent?: number;
    onLeave?: number;
    halfDay?: number;
    total?: number;
    attendancePercentage?: number;
    // Leave
    employee?: string;
    department?: string;
    leaveType?: string;
    reason?: string;
    startDate?: string;
    endDate?: string;
    // Holiday
    holidayName?: string;
  } | null;
}

export function EventDetailDialog({
  open,
  onClose,
  eventData,
}: EventDetailDialogProps) {
  if (!eventData) return null;

  const isAttendance = eventData.type === "attendance";
  const isLeave = eventData.type === "leave";
  const isHoliday = eventData.type === "holiday";

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 80) return "text-emerald-600 bg-emerald-50";
    if (percentage >= 60) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {isAttendance && <Users className="h-5 w-5 text-blue-600" />}
            {isLeave && <Calendar className="h-5 w-5 text-purple-600" />}
            {isHoliday && <PartyPopper className="h-5 w-5 text-amber-500" />}
            <DialogTitle className="text-lg">
              {isAttendance
                ? "Daily Attendance"
                : isLeave
                  ? "Leave Details"
                  : "Holiday"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm">
            {eventData.date}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Attendance Details */}
          {isAttendance && (
            <>
              {/* Attendance Rate Badge */}
              <div className="flex justify-center">
                <Badge
                  className={`px-4 py-2 text-lg font-bold ${getAttendanceColor(
                    eventData.attendancePercentage || 0,
                  )}`}
                >
                  <Percent className="h-4 w-4 mr-1" />
                  {eventData.attendancePercentage}% Attendance
                </Badge>
              </div>

              <Separator />

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                  <div className="p-2 bg-emerald-100 rounded-full">
                    <UserCheck className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600 font-medium">
                      Present
                    </p>
                    <p className="text-xl font-bold text-emerald-700">
                      {eventData.present}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                  <div className="p-2 bg-red-100 rounded-full">
                    <UserX className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-red-600 font-medium">Absent</p>
                    <p className="text-xl font-bold text-red-700">
                      {eventData.absent}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 font-medium">
                      On Leave
                    </p>
                    <p className="text-xl font-bold text-blue-700">
                      {eventData.onLeave}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <AlertCircle className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-purple-600 font-medium">
                      Half Day
                    </p>
                    <p className="text-xl font-bold text-purple-700">
                      {eventData.halfDay}
                    </p>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-600">
                  Total Employees:{" "}
                  <span className="font-bold text-gray-900">
                    {eventData.total}
                  </span>
                </p>
              </div>
            </>
          )}

          {/* Leave Details */}
          {isLeave && (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Employee</p>
                    <p className="font-semibold">{eventData.employee}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Building2 className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Department</p>
                    <p className="font-semibold">{eventData.department}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-amber-100 rounded-full">
                    <Calendar className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Leave Type</p>
                    <Badge style={{ backgroundColor: "#6366f1" }}>
                      {eventData.leaveType}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-emerald-100 rounded-full">
                    <FileText className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Reason</p>
                    <p className="font-semibold">{eventData.reason || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-indigo-100 rounded-full">
                    <Clock className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="font-semibold">
                      {eventData.startDate} →{" "}
                      {eventData.endDate || eventData.startDate}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Holiday Details */}
          {isHoliday && (
            <div className="text-center space-y-4">
              <div className="text-6xl">🎉</div>
              <h3 className="text-xl font-bold text-amber-600">
                {eventData.title}
              </h3>
              <div className="flex items-center justify-center gap-3 p-3 bg-amber-50 rounded-lg">
                <Calendar className="h-5 w-5 text-amber-600" />
                <p className="font-semibold text-amber-700">{eventData.date}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Company holiday - office closed
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
