import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Plus, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import type { AddTaskModalProps, Task } from "@/types/types";

const teamMembers = {
  "Technical Team": ["Shiva", "Prashant", "Aryan"],
  Graphics: ["Rahul", "Sneha"],
  HR: ["Amit", "Priya"],
  Editor: ["Vikram", "Kiran"],
  Admin: ["Suresh"],
};

// Due date is NOT required in schema anymore - we handle default in onSubmit
const formSchema = z.object({
  title: z.string().min(2, { message: "Task title is required" }),
  description: z.string().optional(),
  priority: z.string(),
  status: z.string(),
  selectTeam: z.string().min(1, { message: "Team is required" }),
  selectMember: z
    .array(z.string())
    .min(1, { message: "At least one member is required" }),
  dueDate: z.string(), // ← Removed .min(1)
});

export function AddTaskModal({
  onAddTask,
  onEditTask,
  editingTask,
  onCloseEdit,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  initialDueDate,
}: AddTaskModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpenChange = controlledOnOpenChange || setInternalOpen;

  const [date, setDate] = useState<Date | undefined>(new Date());

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

  const availableMembers = teamValue
    ? teamMembers[teamValue as keyof typeof teamMembers] || []
    : [];

  const isEditing = !!editingTask && open;

  // Pre-fill logic
  useEffect(() => {
    if (editingTask && open) {
      reset({
        title: editingTask.title,
        description: editingTask.description || "",
        priority: editingTask.priority,
        status: editingTask.status,
        selectTeam: editingTask.selectTeam,
        selectMember: editingTask.selectMember || [],
        dueDate: editingTask.dueDate,
      });

      const [day, month, year] = editingTask.dueDate.split("/").map(Number);
      const parsedDate = new Date(2000 + year, month - 1, day);
      if (!isNaN(parsedDate.getTime())) setDate(parsedDate);
    } else if (initialDueDate && open && !editingTask) {
      setValue("dueDate", initialDueDate);
      const [day, month, year] = initialDueDate.split("/").map(Number);
      const parsedDate = new Date(2000 + year, month - 1, day);
      if (!isNaN(parsedDate.getTime())) setDate(parsedDate);
    } else if (open && !editingTask && !initialDueDate) {
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
    }
  }, [open, editingTask, initialDueDate, reset, setValue]);

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);

    if (!newOpen) {
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

  const toggleMember = (member: string) => {
    const current = [...selectedMembers];
    const index = current.indexOf(member);
    if (index > -1) current.splice(index, 1);
    else current.push(member);
    setValue("selectMember", current, { shouldValidate: true });
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      const formattedDate = selectedDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      });
      setValue("dueDate", formattedDate, { shouldValidate: true });
    }
  };

  // ==================== MAIN FIX ====================
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const initials = values.selectMember
      .map((m) => m[0].toUpperCase())
      .join(", ");

    // If no due date was selected (for new tasks), use today's date
    let finalDueDate = values.dueDate;
    if (!finalDueDate && !isEditing) {
      const today = new Date();
      finalDueDate = today.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      });
    }

    const taskData: Task = {
      ...values,
      dueDate: finalDueDate,
      id: isEditing && editingTask ? editingTask.id : Date.now().toString(),
      initials,
    };

    if (isEditing && onEditTask) {
      onEditTask(taskData);
    } else {
      onAddTask(taskData);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-112.5 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Task" : "Create New Task"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Title */}
          <Field>
            <FieldLabel>Task Title</FieldLabel>
            <Input
              placeholder="e.g. Design Landing Page"
              {...register("title")}
            />
            {errors.title && <FieldError>{errors.title.message}</FieldError>}
          </Field>

          {/* Description */}
          <Field>
            <FieldLabel>Description</FieldLabel>
            <Textarea
              placeholder="Briefly describe the task..."
              className="resize-none h-20"
              {...register("description")}
            />
          </Field>

          {/* Priority & Status */}
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Priority</FieldLabel>
              <Select
                value={priorityValue}
                onValueChange={(val) => setValue("priority", val)}
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

          {/* Team & Members */}
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Select Team</FieldLabel>
              <Select
                value={teamValue}
                onValueChange={(val) => {
                  setValue("selectTeam", val);
                  setValue("selectMember", []);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Team" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(teamMembers).map((team) => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    disabled={!teamValue}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">
                      {selectedMembers.length > 0
                        ? `${selectedMembers.length} selected`
                        : "Members"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-50 p-2" align="start">
                  <div className="space-y-1">
                    {availableMembers.length > 0 ? (
                      availableMembers.map((member) => (
                        <div
                          key={member}
                          className="flex items-center space-x-2 p-1.5 hover:bg-slate-50 rounded-sm"
                        >
                          <Checkbox
                            id={member}
                            checked={selectedMembers.includes(member)}
                            onCheckedChange={() => toggleMember(member)}
                          />
                          <label
                            htmlFor={member}
                            className="text-sm cursor-pointer w-full select-none"
                          >
                            {member}
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-center text-slate-500 py-2">
                        Select a team first
                      </p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {errors.selectMember && (
                <FieldError>{errors.selectMember.message}</FieldError>
              )}
            </Field>
          </div>

          {selectedMembers.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {selectedMembers.map((m) => (
                <Badge
                  key={m}
                  variant="secondary"
                  className="text-[10px] py-0 px-1 bg-blue-50 text-blue-700 border-blue-100"
                >
                  {m}
                </Badge>
              ))}
            </div>
          )}

          {/* Due Date */}
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
            {/* No error message needed anymore since we provide default */}
          </Field>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 mt-4 h-10 cursor-pointer"
          >
            {isEditing ? "Update Task" : "Create Task"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
