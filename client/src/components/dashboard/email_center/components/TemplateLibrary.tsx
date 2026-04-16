// components/email/TemplateLibrary.tsx
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  FileText,
  Calendar,
  AlertCircle,
  PartyPopper,
  Pencil,
  Trash2,
  Plus,
  Mail,
  Users,
  Briefcase,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EmailTemplate } from "@/types/types";

// Mock Data - Replace with API call
const INITIAL_TEMPLATES: EmailTemplate[] = [
  {
    id: "1",
    name: "Leave Approval",
    subject: "Your Leave Request has been Approved",
    body: "Dear {{employee_name}},\n\nYour leave request from {{start_date}} to {{end_date}} has been approved.\n\nBest,\nHR Team",
    category: "HR",
  },
  {
    id: "2",
    name: "Meeting Reminder",
    subject: "Reminder: Upcoming HR Meeting",
    body: "Hi Team,\n\nThis is a reminder about our meeting tomorrow at {{meeting_time}}.\n\nThanks.",
    category: "General",
  },
  {
    id: "3",
    name: "Welcome New Hire",
    subject: "Welcome to the Team, {{employee_name}}!",
    body: "Dear {{employee_name}},\n\nWelcome aboard! We are excited to have you join the team. Your first day will be {{start_date}}.\n\nPlease let us know if you have any questions.\n\nBest regards,\nHR Team",
    category: "HR",
  },
];

// Icon mapping based on template name/category
const getTemplateIcon = (template: EmailTemplate) => {
  const name = template.name.toLowerCase();
  if (name.includes("leave") || name.includes("approval")) return Calendar;
  if (name.includes("meeting") || name.includes("reminder")) return AlertCircle;
  if (name.includes("welcome") || name.includes("hire")) return PartyPopper;
  if (template.category === "HR") return Users;
  if (template.category === "Admin") return Briefcase;
  return Mail;
};

interface TemplateLibraryProps {
  onSelectTemplate?: (template: EmailTemplate) => void;
  manageMode?: boolean;
  compact?: boolean;
}

interface TemplateFormData {
  name: string;
  subject: string;
  body: string;
  category: "HR" | "Admin" | "General";
}

const initialFormData: TemplateFormData = {
  name: "",
  subject: "",
  body: "",
  category: "General",
};

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  onSelectTemplate,
  manageMode = false,
  compact = false,
}) => {
  const [templates, setTemplates] =
    useState<EmailTemplate[]>(INITIAL_TEMPLATES);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null,
  );
  const [deletingTemplate, setDeletingTemplate] =
    useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(initialFormData);

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingTemplate(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
      category: template.category,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.subject || !formData.body) {
      alert("Please fill in all fields");
      return;
    }

    if (editingTemplate) {
      // Update existing template
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === editingTemplate.id
            ? {
                ...t,
                ...formData,
              }
            : t,
        ),
      );
    } else {
      // Create new template
      const newTemplate: EmailTemplate = {
        id: `template-${Date.now()}`,
        ...formData,
      };
      setTemplates((prev) => [...prev, newTemplate]);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDeleteClick = (template: EmailTemplate) => {
    setDeletingTemplate(template);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingTemplate) {
      setTemplates((prev) => prev.filter((t) => t.id !== deletingTemplate.id));
    }
    setIsDeleteDialogOpen(false);
    setDeletingTemplate(null);
  };

  const displayTemplates = compact ? templates.slice(0, 3) : templates;

  return (
    <>
      <ScrollArea className={compact ? "h-[300px] pr-4" : "h-[500px] pr-4"}>
        <div className="space-y-3">
          {displayTemplates.map((template) => {
            const Icon = getTemplateIcon(template);
            return (
              <Card
                key={template.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <CardHeader className={compact ? "p-3 pb-2" : "p-4 pb-2"}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-primary/10 p-1">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <CardTitle className={compact ? "text-sm" : "text-base"}>
                        {template.name}
                      </CardTitle>
                    </div>
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                  <CardDescription
                    className={`line-clamp-1 ${compact ? "text-xs pt-1" : "pt-1"}`}
                  >
                    Subject: {template.subject}
                  </CardDescription>
                </CardHeader>
                <CardContent className={compact ? "p-3 pt-0" : "p-4 pt-0"}>
                  {!compact && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {template.body.substring(0, 60)}...
                    </p>
                  )}
                  {!manageMode && onSelectTemplate && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() => onSelectTemplate(template)}
                    >
                      Use Template
                    </Button>
                  )}
                  {manageMode && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(template)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDeleteClick(template)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Create New Template Button */}
          {manageMode ? (
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleOpenCreate}
            >
              <Plus className="h-4 w-4" />
              Create New Template...
            </Button>
          ) : (
            !compact && (
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={handleOpenCreate}
              >
                <FileText className="h-4 w-4" />
                Create New Template...
              </Button>
            )
          )}

          {compact && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
            >
              View all templates →
            </Button>
          )}
        </div>
      </ScrollArea>

      {/* Create/Edit Template Dialog - FIXED HEIGHT */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {editingTemplate ? "Edit Template" : "Create New Template"}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? "Update the template details below."
                : "Create a reusable email template for quick access."}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[70vh]">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Leave Approval"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: "HR" | "Admin" | "General") =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Your Leave Request has been Approved"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">
                  Email Body
                  <span className="ml-2 text-xs text-muted-foreground">
                    Use {"{{variable_name}}"} for dynamic content
                  </span>
                </Label>
                <Textarea
                  id="body"
                  placeholder="Write your email template here..."
                  className="min-h-[150px] max-h-[250px] font-mono text-sm"
                  value={formData.body}
                  onChange={(e) =>
                    setFormData({ ...formData, body: e.target.value })
                  }
                />
              </div>

              {/* Available Variables Hint */}
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs font-medium mb-2">Available Variables:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "{{employee_name}}",
                    "{{start_date}}",
                    "{{end_date}}",
                    "{{meeting_time}}",
                    "{{department}}",
                    "{{manager_name}}",
                  ].map((variable) => (
                    <Badge
                      key={variable}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          body: formData.body + " " + variable,
                        })
                      }
                    >
                      {variable}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                resetForm();
              }}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button className="cursor-pointer" onClick={handleSave}>
              {editingTemplate ? "Save Changes" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingTemplate?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
