// components/leaves/LeaveRequest.tsx
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
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Send,
  CheckCircle,
  Loader2,
  FileText,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/api/client";
import { useAuthStore } from "@/stores";
import { format, differenceInDays } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LeaveRequestForm {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
}

const LEAVE_TYPES = [
  {
    value: "CASUAL",
    label: "Casual Leave",
    description: "For personal or miscellaneous reasons",
  },
  {
    value: "SICK",
    label: "Sick Leave",
    description: "When you're unwell or need medical attention",
  },
  {
    value: "EARNED",
    label: "Earned Leave",
    description: "Planned vacation or long leave",
  },
  { value: "UNPAID", label: "Unpaid Leave", description: "Leave without pay" },
];

export default function LeaveRequest() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<LeaveRequestForm>({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [errors, setErrors] = useState<Partial<LeaveRequestForm>>({});

  const today = format(new Date(), "yyyy-MM-dd");

  const validateForm = (): boolean => {
    const newErrors: Partial<LeaveRequestForm> = {};

    if (!formData.leaveType) newErrors.leaveType = "Please select leave type";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        newErrors.endDate = "End date must be after start date";
      }
    }

    if (!formData.reason.trim()) {
      newErrors.reason = "Please provide a reason";
    } else if (formData.reason.trim().length < 10) {
      newErrors.reason = "Reason must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!user?.id) {
      toast.error("User not found. Please login again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post("/leaves", {
        userId: user.id,
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason.trim(),
      });

      if (response.data.success) {
        toast.success("Leave request submitted successfully!", {
          description: "Your request will be reviewed by HR/Admin.",
        });

        // Reset form
        setFormData({ leaveType: "", startDate: "", endDate: "", reason: "" });
        setErrors({});
        setIsOpen(false);
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Failed to submit leave request",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDays = (): number => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      return differenceInDays(end, start) + 1;
    }
    return 0;
  };

  const getSelectedLeaveInfo = () => {
    return LEAVE_TYPES.find((lt) => lt.value === formData.leaveType);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4" />
          Apply for Leave
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5 text-violet-600" />
            Apply for Leave
          </DialogTitle>
          <DialogDescription>
            Submit a leave request for approval by your manager or HR.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="">
          <form onSubmit={handleSubmit} className="space-y-6 py-4 max-h-[70vh]">
            {/* Employee Info */}
            {user && (
              <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-sm">
                  {user.avatarInitials || user.name?.charAt(0) || "U"}
                </div>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            )}

            {/* Leave Type */}
            <div className="space-y-2">
              <Label>Leave Type*</Label>
              <Select
                value={formData.leaveType}
                onValueChange={(value) =>
                  setFormData({ ...formData, leaveType: value })
                }
              >
                <SelectTrigger
                  className={errors.leaveType ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex flex-col">
                        <span>{type.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {type.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.leaveType && (
                <p className="text-xs text-red-500">{errors.leaveType}</p>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date*</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    min={today}
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className={`pl-10 ${errors.startDate ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.startDate && (
                  <p className="text-xs text-red-500">{errors.startDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>End Date*</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    min={formData.startDate || today}
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className={`pl-10 ${errors.endDate ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.endDate && (
                  <p className="text-xs text-red-500">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Duration Preview */}
            {calculateDays() > 0 && (
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-700 dark:text-blue-300">
                    {calculateDays()} day{calculateDays() > 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {formData.startDate} → {formData.endDate}
                  </p>
                </div>
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label>Reason*</Label>
              <Textarea
                placeholder="Please explain the reason for your leave request..."
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                className={`min-h-[100px] ${errors.reason ? "border-red-500" : ""}`}
                maxLength={500}
              />
              <div className="flex justify-between">
                {errors.reason && (
                  <p className="text-xs text-red-500">{errors.reason}</p>
                )}
                <p className="text-xs text-muted-foreground ml-auto">
                  {formData.reason.length}/500 characters
                </p>
              </div>
            </div>

            {/* Leave Type Info */}
            {formData.leaveType && (
              <div className="bg-muted/30 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  {getSelectedLeaveInfo()?.description}
                </p>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                className="cursor-pointer"
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin " />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
