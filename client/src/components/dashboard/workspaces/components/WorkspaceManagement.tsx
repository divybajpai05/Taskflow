// components/settings/WorkspaceManagement.tsx
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  Users,
  Calendar,
  Search,
  List,
} from "lucide-react";

// Types
interface Workspace {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  taskCount: number;
  createdAt: string;
  isActive: boolean;
}

// Mock Data (Replace with API later)
const INITIAL_WORKSPACES: Workspace[] = [
  {
    id: "ws1",
    name: "Acme Corp",
    description: "Main workspace for all teams in Acme Corporation",
    memberCount: 124,
    taskCount: 874,
    createdAt: "2025-08-15",
    isActive: true,
  },
  {
    id: "ws2",
    name: "StartupHub",
    description: "Innovation and product development workspace",
    memberCount: 47,
    taskCount: 342,
    createdAt: "2025-11-03",
    isActive: true,
  },
  {
    id: "ws3",
    name: "Freelance Projects",
    description: "Personal workspace for client projects",
    memberCount: 12,
    taskCount: 89,
    createdAt: "2026-01-20",
    isActive: true,
  },
];

export const WorkspaceManagement: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(INITIAL_WORKSPACES);
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingWorkspace, setDeletingWorkspace] = useState<Workspace | null>(
    null,
  );

  // Separate form states to prevent data leakage
  const [createForm, setCreateForm] = useState({ name: "", description: "" });
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(
    null,
  );

  const filteredWorkspaces = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const resetCreateForm = () => setCreateForm({ name: "", description: "" });
  const resetEditForm = () => setEditForm({ name: "", description: "" });

  const handleCreateWorkspace = () => {
    if (!createForm.name.trim()) {
      alert("Workspace name is required");
      return;
    }

    const newWorkspace: Workspace = {
      id: `ws${Date.now()}`,
      name: createForm.name,
      description: createForm.description,
      memberCount: 1,
      taskCount: 0,
      createdAt: new Date().toISOString().split("T")[0],
      isActive: true,
    };

    setWorkspaces((prev) => [...prev, newWorkspace]);
    setIsCreateDialogOpen(false);
    resetCreateForm();
  };

  const handleEditWorkspace = () => {
    if (!editingWorkspace || !editForm.name.trim()) return;

    setWorkspaces((prev) =>
      prev.map((ws) =>
        ws.id === editingWorkspace.id
          ? { ...ws, name: editForm.name, description: editForm.description }
          : ws,
      ),
    );

    setIsEditDialogOpen(false);
    setEditingWorkspace(null);
    resetEditForm();
  };

  const handleDeleteWorkspace = () => {
    if (!deletingWorkspace) return;
    setWorkspaces((prev) =>
      prev.filter((ws) => ws.id !== deletingWorkspace.id),
    );
    setDeletingWorkspace(null);
  };

  const openEditDialog = (workspace: Workspace) => {
    setEditingWorkspace(workspace);
    setEditForm({
      name: workspace.name,
      description: workspace.description,
    });
    setIsEditDialogOpen(true);
  };

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorkspaces.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No workspaces found</p>
            <p className="text-muted-foreground">Try a different search term</p>
          </div>
        ) : (
          filteredWorkspaces.map((workspace) => (
            <Card key={workspace.id} className="hover:shadow-md transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">{workspace.name}</CardTitle>
                  <Badge variant={workspace.isActive ? "default" : "secondary"}>
                    {workspace.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {workspace.description || "No description provided"}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {workspace.memberCount} members
                  </div>
                  <div className="flex items-center gap-2">
                    {workspace.taskCount} tasks
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {workspace.createdAt}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 cursor-pointer"
                    onClick={() => openEditDialog(workspace)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 cursor-pointer"
                    onClick={() => setDeletingWorkspace(workspace)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

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
              <Label htmlFor="name">Workspace Name</Label>
              <Input
                id="name"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm({ ...createForm, name: e.target.value })
                }
                placeholder="e.g. My Company"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm({ ...createForm, description: e.target.value })
                }
                placeholder="What is this workspace for?"
                rows={3}
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
            >
              Cancel
            </Button>
            <Button className="cursor-pointer" onClick={handleCreateWorkspace}>
              Create Workspace
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
              <Label htmlFor="name">Workspace Name</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              className="cursor-pointer"
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingWorkspace(null);
                resetEditForm();
              }}
            >
              Cancel
            </Button>
            <Button className="cursor-pointer" onClick={handleEditWorkspace}>
              Save Changes
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
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWorkspace}
              className="bg-destructive cursor-pointer text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Workspace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
