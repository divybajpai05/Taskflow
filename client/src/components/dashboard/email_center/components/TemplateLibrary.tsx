// components/email/TemplateLibrary.tsx
import React, { useState, useEffect, useCallback } from "react";
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
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EmailTemplate } from "@/types/types";
import apiClient from "@/api/client";
import { toast } from "sonner";

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
  // ==================== STATE ====================
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null,
  );
  const [deletingTemplate, setDeletingTemplate] =
    useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    subject?: string;
    body?: string;
  }>({});

  // ==================== DATA FETCHING ====================
  const fetchTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/email/templates");
      if (response.data.success) {
        setTemplates(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // ==================== FORM HELPERS ====================
  const resetForm = () => {
    setFormData(initialFormData);
    setFormErrors({});
    setEditingTemplate(null);
  };

  const validateForm = (): boolean => {
    const errors: { name?: string; subject?: string; body?: string } = {};
    if (!formData.name.trim()) errors.name = "Template name is required";
    if (!formData.subject.trim()) errors.subject = "Subject is required";
    if (!formData.body.trim()) errors.body = "Email body is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
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
      category: template.category as "HR" | "Admin" | "General",
    });
    setIsDialogOpen(true);
  };

  // ==================== CRUD OPERATIONS ====================
  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (editingTemplate) {
        // Update
        await apiClient.put(`/email/templates/${editingTemplate.id}`, formData);
        toast.success("Template updated!");
      } else {
        // Create
        await apiClient.post("/email/templates", formData);
        toast.success("Template created!");
      }
      setIsDialogOpen(false);
      resetForm();
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to save template");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (template: EmailTemplate) => {
    setDeletingTemplate(template);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTemplate) return;

    setIsSubmitting(true);
    try {
      await apiClient.delete(`/email/templates/${deletingTemplate.id}`);
      toast.success("Template deleted!");
      setIsDeleteDialogOpen(false);
      setDeletingTemplate(null);
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete template");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== DISPLAY ====================
  const displayTemplates = compact ? templates.slice(0, 3) : templates;

  // ==================== RENDER ====================
  return (
    <>
      <ScrollArea className={compact ? "h-[300px] pr-4" : "h-[500px] pr-4"}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : displayTemplates.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {manageMode
                ? "No templates yet. Create your first one!"
                : "No templates available"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayTemplates.map((template) => {
              const Icon = getTemplateIcon(template);
              return (
                <Card
                  key={template.id}
                  className="hover:bg-accent/20 transition-colors"
                >
                  <CardHeader className={compact ? "p-3 pb-2" : "p-4 pb-2"}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="rounded-md bg-primary/10 p-1">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <CardTitle
                          className={compact ? "text-sm" : "text-base"}
                        >
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
                        className="w-full cursor-pointer"
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
          </div>
        )}

        {/* Create New Template Button */}
        {manageMode ? (
          <Button
            variant="outline"
            className="w-full justify-start gap-2 cursor-pointer mt-3"
            onClick={handleOpenCreate}
          >
            <Plus className="h-4 w-4" />
            Create New Template...
          </Button>
        ) : (
          !compact && (
            <Button
              variant="outline"
              className="w-full justify-start gap-2 cursor-pointer mt-3"
              onClick={handleOpenCreate}
            >
              <FileText className="h-4 w-4" />
              Create New Template...
            </Button>
          )
        )}

        {compact && templates.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground mt-1"
          >
            View all templates →
          </Button>
        )}
      </ScrollArea>

      {/* ====================== CREATE/EDIT DIALOG ====================== */}
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
                <Label htmlFor="name">Template Name*</Label>
                <Input
                  id="name"
                  placeholder="e.g., Leave Approval"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (formErrors.name)
                      setFormErrors({ ...formErrors, name: undefined });
                  }}
                  disabled={isSubmitting}
                  className={formErrors.name ? "border-red-500" : ""}
                />
                {formErrors.name && (
                  <p className="text-xs text-red-500">{formErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: "HR" | "Admin" | "General") =>
                    setFormData({ ...formData, category: value })
                  }
                  disabled={isSubmitting}
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
                <Label htmlFor="subject">Email Subject*</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Your Leave Request has been Approved"
                  value={formData.subject}
                  onChange={(e) => {
                    setFormData({ ...formData, subject: e.target.value });
                    if (formErrors.subject)
                      setFormErrors({ ...formErrors, subject: undefined });
                  }}
                  disabled={isSubmitting}
                  className={formErrors.subject ? "border-red-500" : ""}
                />
                {formErrors.subject && (
                  <p className="text-xs text-red-500">{formErrors.subject}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">
                  Email Body*
                  <span className="ml-2 text-xs text-muted-foreground">
                    Use {"{{variable_name}}"} for dynamic content
                  </span>
                </Label>
                <Textarea
                  id="body"
                  placeholder="Write your email template here..."
                  className={`min-h-[150px] max-h-[250px] font-mono text-sm ${formErrors.body ? "border-red-500" : ""}`}
                  value={formData.body}
                  onChange={(e) => {
                    setFormData({ ...formData, body: e.target.value });
                    if (formErrors.body)
                      setFormErrors({ ...formErrors, body: undefined });
                  }}
                  disabled={isSubmitting}
                />
                {formErrors.body && (
                  <p className="text-xs text-red-500">{formErrors.body}</p>
                )}
              </div>

              {/* Available Variables Hint */}
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs font-medium mb-2">Available Variables:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "{{employee_name}}",
                    "{{start_date}}",
                    "{{email}}",
                    "{{team}}",
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
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="cursor-pointer"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingTemplate ? (
                "Save Changes"
              ) : (
                "Create Template"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====================== DELETE DIALOG ====================== */}
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
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
