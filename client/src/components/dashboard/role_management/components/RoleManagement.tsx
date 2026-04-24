// src/components/dashboard/RoleManagement.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Loader2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/api/client";

// Types
interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: Permission[];
  permissionsCount: number;
  permissionNames: string[];
}

const PERMISSION_LABELS: Record<string, string> = {
  dashboard_access: "Dashboard Access",
  my_tasks: "My Tasks",
  kanban_board: "Kanban Board",
  calendar: "Calendar",
  analytics: "Analytics",
  hr_dashboard: "HR Dashboard",
  attendance: "Attendance",
  leave_management: "Leave Management",
  hr_calendar: "HR Calendar",
  email_center: "Email Center",
  team_management: "Team Management",
  user_management: "User Management",
  workspaces: "Workspaces",
  activity_logs: "Activity Logs",
};

export const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);

  // Form state
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Fetch data
  const fetchRoles = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/roles");
      if (response.data.success) setRoles(response.data.data);
    } catch (error: any) {
      toast.error("Failed to load roles");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    try {
      const response = await apiClient.get("/roles/permissions/list");
      if (response.data.success) setAllPermissions(response.data.data);
    } catch (error: any) {
      toast.error("Failed to load permissions");
    }
  }, []);

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, [fetchRoles, fetchPermissions]);

  // Helpers
  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setSelectedPermissions([]);
    setEditingRole(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (role: Role) => {
    setEditingRole(role);
    setFormData({ name: role.name, description: role.description || "" });
    setSelectedPermissions(role.permissions.map((p) => p.id));
    setIsEditDialogOpen(true);
  };

  const togglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId)
        ? prev.filter((id) => id !== permId)
        : [...prev, permId],
    );
  };

  // CRUD Operations
  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error("Role name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post("/roles", {
        name: formData.name,
        description: formData.description,
        permissions: selectedPermissions,
      });
      toast.success("Role created!");
      setIsCreateDialogOpen(false);
      resetForm();
      fetchRoles();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingRole || !formData.name.trim()) {
      toast.error("Role name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.put(`/roles/${editingRole.id}`, {
        name: formData.name,
        description: formData.description,
        permissions: selectedPermissions,
      });
      toast.success("Role updated!");
      setIsEditDialogOpen(false);
      resetForm();
      fetchRoles();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRole) return;

    setIsSubmitting(true);
    try {
      await apiClient.delete(`/roles/${deletingRole.id}`);
      toast.success("Role deleted!");
      setDeletingRole(null);
      fetchRoles();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete role");
      setDeletingRole(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
          <p className="text-muted-foreground">
            Create and manage roles with permissions
          </p>
        </div>
        <Button onClick={openCreateDialog}
        className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" /> Create Role
        </Button>
      </div>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Roles ({roles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <p className="font-medium">{role.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {role.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={role.isSystem ? "secondary" : "outline"}>
                        {role.isSystem ? (
                          <>
                            <ShieldAlert className="mr-1 h-3 w-3" /> System
                          </>
                        ) : (
                          <>
                            <Shield className="mr-1 h-3 w-3" /> Custom
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>{role.permissionsCount} permissions</TableCell>
                    <TableCell className="text-right">
                      <Button
                        className="cursor-pointer"
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(role)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {!role.isSystem && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive cursor-pointer"
                          onClick={() => setDeletingRole(role)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Edit Role" : "Create Role"}
            </DialogTitle>
            <DialogDescription>
              {editingRole
                ? "Update role details and permissions"
                : "Create a new custom role with permissions"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Role Name*</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Content Manager"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of this role"
                disabled={isSubmitting}
              />
            </div>

            {/* Permissions */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                Permissions ({selectedPermissions.length})
              </Label>
              <ScrollArea className="h-64 border rounded-md p-3">
                <div className="space-y-1">
                  {allPermissions.map((perm) => (
                    <label
                      key={perm.id}
                      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                        selectedPermissions.includes(perm.id)
                          ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
                          : "hover:bg-gray-50 dark:hover:bg-gray-900 border border-transparent"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        className="rounded"
                        disabled={isSubmitting}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {PERMISSION_LABELS[perm.name] || perm.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {perm.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button
              className="cursor-pointer"
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              className="cursor-pointer"
              onClick={editingRole ? handleUpdate : handleCreate}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {editingRole ? "Save Changes" : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingRole}
        onOpenChange={() => setDeletingRole(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deletingRole?.name}</strong>? Users with this role will
              need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
