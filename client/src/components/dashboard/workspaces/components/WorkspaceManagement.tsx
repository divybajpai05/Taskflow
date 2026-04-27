// components/settings/WorkspaceManagement.tsx
import React, { useCallback, useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
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
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  Users,
  Calendar,
  Search,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/api/client";
import { useAuthStore } from "@/stores";
import { useNavigate } from "react-router-dom";

// Types
interface Workspace {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  taskCount: number;
  createdAt: string;
  isActive: boolean;
  ownerId: string;
  updatedAt?: string;
}

export const WorkspaceManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();

  // ==================== STATE ====================
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [switchingWorkspace, setSwitchingWorkspace] = useState<string | null>(
    null,
  );

  // Current active workspace
  const currentWorkspaceId = user?.activeWorkspaceId;

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingWorkspace, setDeletingWorkspace] = useState<Workspace | null>(
    null,
  );

  // Form states
  const [createForm, setCreateForm] = useState({ name: "", description: "" });
  const [createErrors, setCreateErrors] = useState<{ name?: string }>({});
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [editErrors, setEditErrors] = useState<{ name?: string }>({});
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(
    null,
  );

  // ==================== DATA FETCHING ====================
  const fetchWorkspaces = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/workspaces");
      if (response.data.success) {
        setWorkspaces(response.data.data);
      }
    } catch (error: any) {
      toast.error("Failed to load workspaces");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // ==================== FILTERING ====================
  const filteredWorkspaces = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // ==================== FORM HELPERS ====================
  const resetCreateForm = () => {
    setCreateForm({ name: "", description: "" });
    setCreateErrors({});
  };

  const resetEditForm = () => {
    setEditForm({ name: "", description: "" });
    setEditErrors({});
    setEditingWorkspace(null);
  };

  const validateCreateForm = (): boolean => {
    const errors: { name?: string } = {};
    if (!createForm.name.trim()) {
      errors.name = "Workspace name is required";
    } else if (createForm.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    } else if (createForm.name.trim().length > 100) {
      errors.name = "Name must be less than 100 characters";
    }
    setCreateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEditForm = (): boolean => {
    const errors: { name?: string } = {};
    if (!editForm.name.trim()) {
      errors.name = "Workspace name is required";
    } else if (editForm.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ==================== CRUD OPERATIONS ====================
  const handleCreateWorkspace = async () => {
    if (!validateCreateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await apiClient.post("/workspaces", {
        name: createForm.name.trim(),
        description: createForm.description.trim(),
      });

      if (response.data.success) {
        toast.success("Workspace created successfully!", {
          description: `"${createForm.name}" is ready to use.`,
        });
        setIsCreateDialogOpen(false);
        resetCreateForm();
        fetchWorkspaces();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create workspace");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditWorkspace = async () => {
    if (!editingWorkspace || !validateEditForm()) return;

    setIsSubmitting(true);
    try {
      await apiClient.put(`/workspaces/${editingWorkspace.id}`, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
      });

      toast.success("Workspace updated!");
      setIsEditDialogOpen(false);
      resetEditForm();
      fetchWorkspaces();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update workspace");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!deletingWorkspace) return;

    // Prevent deleting current workspace
    if (deletingWorkspace.id === currentWorkspaceId) {
      toast.error("Cannot delete active workspace", {
        description: "Switch to another workspace first.",
      });
      setDeletingWorkspace(null);
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.delete(`/workspaces/${deletingWorkspace.id}`);
      toast.success("Workspace deleted!");
      setDeletingWorkspace(null);
      fetchWorkspaces();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete workspace");
      setDeletingWorkspace(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchWorkspace = async (
    workspaceId: string,
    workspaceName: string,
  ) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    // ✅ Update Zustand store
    useAuthStore.getState().updateUser({
      activeWorkspaceId: workspaceId,
      activeWorkspaceName: workspaceName,
    });

    toast.success(`Switched to "${workspaceName}"`);
    navigate("/dashboard");
  };

  const openEditDialog = (workspace: Workspace) => {
    setEditingWorkspace(workspace);
    setEditForm({
      name: workspace.name,
      description: workspace.description || "",
    });
    setIsEditDialogOpen(true);
  };

  // ==================== FORMAT HELPERS ====================
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ==================== RENDER ====================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Workspace Management
          </h1>
          <p className="text-muted-foreground">
            Manage all your workspaces • Create, edit and organize your teams
          </p>
        </div>
        <Button
          className="cursor-pointer"
          onClick={() => setIsCreateDialogOpen(true)}
          size="lg"
          disabled={isSubmitting}
        >
          <Plus className="mr-2 h-5 w-5" />
          Create New Workspace
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search workspaces..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Workspaces Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredWorkspaces.length === 0 ? (
        <div className="col-span-full text-center py-16">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">
            {searchTerm
              ? "No workspaces match your search"
              : "No workspaces yet"}
          </p>
          <p className="text-muted-foreground">
            {searchTerm
              ? "Try a different search term"
              : "Create your first workspace to get started"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkspaces.map((workspace) => {
            const isActive = workspace.id === currentWorkspaceId;
            const isSwitching = switchingWorkspace === workspace.id;

            return (
              <Card
                key={workspace.id}
                className={`hover:shadow-md transition-all relative ${
                  isActive ? "ring-2 ring-primary border-primary" : ""
                }`}
              >
                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute top-4 left-[60%]">
                    <Badge className="bg-primary text-primary-foreground gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Current
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">{workspace.name}</CardTitle>
                    <Badge
                      variant={workspace.isActive ? "default" : "secondary"}
                    >
                      {workspace.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {workspace.description || "No description provided"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      <span>{workspace.memberCount} members</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>{workspace.taskCount} tasks</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(workspace.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {/* Switch Workspace Button */}
                    {!isActive && (
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 cursor-pointer gap-1"
                        onClick={() => handleSwitchWorkspace(workspace.id, workspace.name)}
                        disabled={isSwitching || isSubmitting}
                      >
                        {isSwitching ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowRight className="h-4 w-4" />
                        )}
                        Switch
                      </Button>
                    )}

                    {/* Edit Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => openEditDialog(workspace)}
                      disabled={isSubmitting}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    {/* Delete Button */}
                    {!isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 cursor-pointer"
                        onClick={() => setDeletingWorkspace(workspace)}
                        disabled={isSubmitting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Current Workspace Label */}
                  {isActive && (
                    <p className="text-xs text-center text-muted-foreground">
                      You are currently in this workspace
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ====================== CREATE WORKSPACE DIALOG ====================== */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Workspace</DialogTitle>
            <DialogDescription>
              Create a new workspace to organize your teams and projects
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Workspace Name*</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) => {
                  setCreateForm({ ...createForm, name: e.target.value });
                  if (createErrors.name) setCreateErrors({});
                }}
                placeholder="e.g. Acme Corp"
                disabled={isSubmitting}
                className={createErrors.name ? "border-red-500" : ""}
                autoFocus
              />
              {createErrors.name && (
                <p className="text-xs text-red-500">{createErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-description">Description (Optional)</Label>
              <Textarea
                id="create-description"
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm({ ...createForm, description: e.target.value })
                }
                placeholder="What is this workspace for?"
                rows={3}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              className="cursor-pointer"
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                resetCreateForm();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button className="cursor-pointer" onClick={handleCreateWorkspace} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Workspace"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====================== EDIT WORKSPACE DIALOG ====================== */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Workspace</DialogTitle>
            <DialogDescription>Update workspace details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Workspace Name*</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => {
                  setEditForm({ ...editForm, name: e.target.value });
                  if (editErrors.name) setEditErrors({});
                }}
                disabled={isSubmitting}
                className={editErrors.name ? "border-red-500" : ""}
              />
              {editErrors.name && (
                <p className="text-xs text-red-500">{editErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                rows={3}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              className="cursor-pointer"
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                resetEditForm();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button className="cursor-pointer" onClick={handleEditWorkspace} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingWorkspace}
        onOpenChange={() => setDeletingWorkspace(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deletingWorkspace?.name}</strong>?
              <br />
              This action cannot be undone and all data inside this workspace
              will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWorkspace}
              className="bg-destructive cursor-pointer text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Workspace"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
