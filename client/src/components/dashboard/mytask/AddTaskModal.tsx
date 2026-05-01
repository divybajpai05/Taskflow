// components/dashboard/mytask/AddTaskModal.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  CalendarIcon,
  ChevronsUpDown,
  Loader2,
  Check,
  Lock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import apiClient from "@/api/client";
import { toast } from "sonner";
import { useAuthStore } from "@/stores";

interface AddTaskModalProps {
  onAddTask: (task: any) => Promise<any>;
  onEditTask?: (task: any) => Promise<any>;
  editingTask?: any | null;
  onCloseEdit?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialDueDate?: string;
  teams?: { id: string; name: string }[];
}

const formSchema = z.object({
  title: z.string().min(2, { message: "Task title is required" }),
  description: z.string().optional(),
  priority: z.string(),
  status: z.string(),
  selectTeam: z.string().min(1, { message: "Team is required" }),
  selectMember: z
    .array(z.string())
    .min(1, { message: "At least one member is required" }),
  dueDate: z.string(),
});

export function AddTaskModal({
  onAddTask,
  onEditTask,
  editingTask,
  onCloseEdit,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  initialDueDate,
  teams = [],
}: AddTaskModalProps) {
  const { user } = useAuthStore();

  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpenChange = controlledOnOpenChange || setInternalOpen;

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [workspaceMembers, setWorkspaceMembers] = useState<
    {
      id: string;
      name: string;
      email: string;
      team?: string;
      teamId?: string;
    }[]
  >([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // ✅ Track if pre-fill has been done to avoid infinite loop
  const [hasPreFilled, setHasPreFilled] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "Medium",
      status: "Todo",
      selectTeam: "",
      selectMember: [],
      dueDate: "",
    },
  });

  const teamValue = watch("selectTeam");
  const selectedMembers = watch("selectMember");
  const priorityValue = watch("priority");
  const statusValue = watch("status");

  const isEditing = !!editingTask && open;

  // ==================== PERMISSION CHECKS ====================
  const canManageAll =
    user?.permissions?.includes("team_management") ||
    user?.permissions?.includes("user_management");

  const availableTeams = canManageAll
    ? teams
    : teams.filter((t) => t.id === user?.teamId);

  const filteredMembers = canManageAll
    ? workspaceMembers.filter((m) =>
        teamValue ? m.teamId === teamValue : true,
      )
    : workspaceMembers.filter((m) => m.id === user?.id);

  // ==================== FETCH WORKSPACE MEMBERS ====================
  const fetchWorkspaceMembers = useCallback(async () => {
    setIsLoadingMembers(true);
    try {
      const response = await apiClient.get("/users/workspace-members");
      if (response.data.success) {
        const members = response.data.data.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          team: u.team,
          teamId: u.teamId,
        }));
        console.log("🔵 Fetched workspace members:", members);
        setWorkspaceMembers(members);
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setIsLoadingMembers(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchWorkspaceMembers();
      setHasPreFilled(false); // ✅ Reset pre-fill flag when opening
    }
  }, [open, fetchWorkspaceMembers]);

  // ==================== PRE-FILL LOGIC (only runs once) ====================

  const preFillAttempted = useRef(false);

  useEffect(() => {
    if (!open) {
      preFillAttempted.current = false;
      return;
    }

    if (hasPreFilled) return;

    // ✅ Wait for workspaceMembers to load before pre-filling
    if (
      editingTask &&
      workspaceMembers.length === 0 &&
      !preFillAttempted.current
    ) {
      // Members not loaded yet - fetch them first
      preFillAttempted.current = true;
      fetchWorkspaceMembers();
      return;
    }

    if (editingTask) {
      console.log("🔵 Pre-filling edit task:", editingTask);
      console.log("🔵 Workspace members:", workspaceMembers);

      // ✅ Map assignee names to IDs
      let memberIds: string[] = [];
      const rawMembers =
        editingTask.selectMember || editingTask.assignees || [];
      console.log("🔵 Raw members:", rawMembers);

      if (rawMembers.length > 0 && workspaceMembers.length > 0) {
        memberIds = rawMembers
          .map((item: string) => {
            // Try matching by ID first
            const byId = workspaceMembers.find((m) => m.id === item);
            if (byId) {
              console.log("✅ Found by ID:", item, "->", byId.name);
              return byId.id;
            }
            // Try matching by name
            const byName = workspaceMembers.find((m) => m.name === item);
            if (byName) {
              console.log("✅ Found by name:", item, "->", byName.id);
              return byName.id;
            }
            console.log("❌ Not found:", item);
            return null;
          })
          .filter(Boolean) as string[];
      }

      console.log("🔵 Final memberIds:", memberIds);

      reset({
        title: editingTask.title || "",
        description: editingTask.description || "",
        priority: editingTask.priority || "Medium",
        status: editingTask.status || "Todo",
        selectTeam: editingTask.teamId || editingTask.selectTeam || "",
        selectMember: memberIds,
        dueDate: editingTask.dueDate || "",
      });

      if (editingTask.dueDate) {
        const parts = editingTask.dueDate.split("/");
        if (parts.length === 3) {
          const [day, month, year] = parts.map(Number);
          const parsedDate = new Date(2000 + year, month - 1, day);
          if (!isNaN(parsedDate.getTime())) setDate(parsedDate);
        }
      }
    } else {
      if (!canManageAll) {
        const userTeamId =
          user?.teamId || teams.find((t) => t.name === user?.team)?.id || "";
        reset({
          title: "",
          description: "",
          priority: "Medium",
          status: "Todo",
          selectTeam: userTeamId,
          selectMember: user?.id ? [user.id] : [],
          dueDate: "",
        });
      } else {
        reset({
          title: "",
          description: "",
          priority: "Medium",
          status: "Todo",
          selectTeam: "",
          selectMember: [],
          dueDate: "",
        });
      }
      setDate(new Date());
    }

    setHasPreFilled(true);
  }, [open, editingTask, workspaceMembers, hasPreFilled]);

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      setHasPreFilled(false); // ✅ Reset for next open
      reset({
        title: "",
        description: "",
        priority: "Medium",
        status: "Todo",
        selectTeam: "",
        selectMember: [],
        dueDate: "",
      });
      setDate(new Date());
      if (editingTask && onCloseEdit) onCloseEdit();
    }
  };

  const toggleMember = (memberId: string) => {
    if (!canManageAll && memberId !== user?.id) return;
    const current = [...selectedMembers];
    const index = current.indexOf(memberId);
    if (index > -1) current.splice(index, 1);
    else current.push(memberId);
    setValue("selectMember", current, { shouldValidate: true });
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      setValue(
        "dueDate",
        selectedDate.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        }),
        { shouldValidate: true },
      );
    }
  };

  // ==================== SUBMIT ====================
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    let finalDueDate = values.dueDate;
    if (!finalDueDate && !isEditing) {
      finalDueDate = new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      });
    }

    const taskData = {
      ...values,
      dueDate: finalDueDate,
      id: isEditing && editingTask ? editingTask.id : undefined,
      teamId: values.selectTeam,
      assigneeIds: !isEditing || canManageAll ? values.selectMember : undefined,
    };

    setIsSubmitting(true);
    try {
      if (isEditing && onEditTask) await onEditTask(taskData);
      else await onAddTask(taskData);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || error.message || "Something went wrong",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== RENDER ====================
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Task" : "Create New Task"}
          </DialogTitle>
          <DialogDescription>
            {isEditing && !canManageAll && "🔒 Some fields are locked by admin"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <Field>
            <FieldLabel>Task Title</FieldLabel>
            <Input
              placeholder="e.g. Design Landing Page"
              {...register("title")}
              disabled={isSubmitting}
            />
            {errors.title && <FieldError>{errors.title.message}</FieldError>}
          </Field>

          <Field>
            <FieldLabel>Description</FieldLabel>
            <Textarea
              placeholder="Briefly describe the task..."
              className="resize-none h-20"
              {...register("description")}
              disabled={isSubmitting}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Priority</FieldLabel>
              <Select
                value={priorityValue}
                onValueChange={(val) => setValue("priority", val)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {["Urgent", "High", "Medium", "Low"].map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select
                value={statusValue}
                onValueChange={(val) => setValue("status", val)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {["Todo", "In progress", "Done", "On Hold", "Cancelled"].map(
                    (s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Select Team</FieldLabel>
              <Select
                value={teamValue}
                onValueChange={(val) => {
                  setValue("selectTeam", val);
                  if (!isEditing || canManageAll) setValue("selectMember", []);
                }}
                disabled={isSubmitting || (isEditing && !canManageAll)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Team" />
                </SelectTrigger>
                <SelectContent>
                  {availableTeams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isEditing && !canManageAll && (
                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Team locked
                </p>
              )}
              {!canManageAll && !isEditing && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Auto-assigned based on your profile
                </p>
              )}
              {errors.selectTeam && (
                <FieldError>{errors.selectTeam.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel>Select Members</FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between font-normal"
                    disabled={isSubmitting || (isEditing && !canManageAll)}
                  >
                    <span className="truncate">
                      {selectedMembers.length > 0
                        ? `${selectedMembers.length} selected`
                        : "Members"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  {isLoadingMembers ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : !teamValue ? (
                    <p className="text-xs text-center text-slate-500 py-4">
                      Select a team first
                    </p>
                  ) : filteredMembers.length > 0 ? (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {filteredMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center space-x-2 p-1.5 hover:bg-slate-50 rounded-sm cursor-pointer"
                        >
                          <Checkbox
                            id={member.id}
                            checked={selectedMembers.includes(member.id)}
                            onCheckedChange={() => toggleMember(member.id)}
                            disabled={!canManageAll && member.id !== user?.id}
                          />
                          <label
                            htmlFor={member.id}
                            className="text-sm cursor-pointer w-full select-none"
                          >
                            <div>
                              <span className="font-medium">{member.name}</span>
                              {member.id === user?.id && (
                                <Badge
                                  variant="secondary"
                                  className="ml-1 text-[9px] px-1 py-0"
                                >
                                  You
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {member.email}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-center text-slate-500 py-4">
                      No members in this team
                    </p>
                  )}
                </PopoverContent>
              </Popover>
              {isEditing && !canManageAll && (
                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Members locked
                </p>
              )}
              {!canManageAll && !isEditing && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Self-assigned
                </p>
              )}
              {errors.selectMember && (
                <FieldError>{errors.selectMember.message}</FieldError>
              )}
            </Field>
          </div>

          {selectedMembers.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedMembers.map((memberId) => {
                const member = workspaceMembers.find((m) => m.id === memberId);
                return (
                  <Badge
                    key={memberId}
                    variant="secondary"
                    className="text-[10px] py-0 px-2 bg-blue-50 text-blue-700 border-blue-100"
                  >
                    {member?.name || user?.name || "Selected"}
                  </Badge>
                );
              })}
            </div>
          )}

          <Field>
            <FieldLabel>Due Date</FieldLabel>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground",
                  )}
                  disabled={isSubmitting}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date
                    ? date.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                      })
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </Field>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 mt-4 h-10 cursor-pointer"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isEditing ? "Updating..." : "Creating..."}
              </span>
            ) : isEditing ? (
              "Update Task"
            ) : (
              "Create Task"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
