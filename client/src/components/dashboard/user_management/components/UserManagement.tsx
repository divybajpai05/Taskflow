// components/hr/UserManagement.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Search,
  X,
  Loader2,
  ShieldCheck,
  ShieldPlus,
} from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/api/client";
import { UserDetailDialog } from "./UserDetailDialog";

// ==================== PERMISSIONS ====================
const ALL_PERMISSIONS = [
  "dashboard_access",
  "my_tasks",
  "kanban_board",
  "calendar",
  "analytics",
  "hr_dashboard",
  "attendance",
  "leave_management",
  "hr_calendar",
  "email_center",
  "team_management",
  "user_management",
  "workspaces",
  "activity_logs",
  "role_management",
] as const;

type Permission = (typeof ALL_PERMISSIONS)[number];

const PERMISSION_LABELS: Record<Permission, string> = {
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
  role_management: "Role Management",
};

// ==================== TYPES ====================
interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  roleId: string;
  team: string | null;
  isActive: boolean;
  avatarInitials: string;
  permissions: string[];
  permissionsCount: number;
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
}

interface PermissionData {
  id: string;
  name: string;
  description: string;
  module: string;
}

const ROLE_COLORS: Record<string, string> = {
  Admin: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  HR: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  Manager: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Employee: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
};

export const UserManagement: React.FC = () => {
  // ==================== STATE ====================
  const [users, setUsers] = useState<UserData[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [availableTeams, setAvailableTeams] = useState<string[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>("All");

  // Dialog States
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserData | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "",
    team: "",
  });

  // ✅ Permissions given to the user (for create & edit)
  const [givenPermissions, setGivenPermissions] = useState<Permission[]>([]);

  // ===== See user detial =========
  const handleUserClick = (user: any) => {
    setSelectedUser(user);
    setIsDetailOpen(true);
  };

  // ==================== FETCH DATA ====================
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/users");
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error: any) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await apiClient.get("/users/roles/list");
      if (response.data.success) {
        setRoles(response.data.data);
      }
    } catch (error: any) {
      console.error("Failed to fetch roles:", error);
    }
  }, []);

  const fetchTeams = useCallback(async () => {
    try {
      const response = await apiClient.get("/teams");
      if (response.data.success) {
        const teamNames = response.data.data.map((t: any) => t.name);
        setAvailableTeams(teamNames);
      }
    } catch (error: any) {
      console.error("Failed to fetch teams:", error);
      setAvailableTeams([]);
    }
  }, []);

  const fetchAllPermissions = useCallback(async () => {
    try {
      const response = await apiClient.get("/users/permissions/list");
      if (response.data.success) {
        setAllPermissions(response.data.data);
      }
    } catch (error: any) {
      console.error("Failed to fetch permissions:", error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchTeams();
    fetchAllPermissions();
  }, [fetchUsers, fetchRoles, fetchTeams, fetchAllPermissions]);

  // ==================== FILTERS ====================
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam =
      selectedTeamFilter === "All" || user.team === selectedTeamFilter;
    return matchesSearch && matchesTeam;
  });

  // ==================== HELPERS ====================

  /**
   * Get permissions that are NOT in the givenPermissions list
   */
  const getAvailablePermissions = (currentPerms: string[]): Permission[] => {
    return ALL_PERMISSIONS.filter((p) => !currentPerms.includes(p));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      roleId: "",
      team: "",
    });
    setGivenPermissions([]);
    setEditingUser(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (user: UserData) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      roleId: user.roleId,
      team: user.team || "",
    });

    // ✅ The user.permissions already includes role defaults + overrides
    // So we can just use them directly
    setGivenPermissions(user.permissions as Permission[]);

    setIsEditDialogOpen(true);
  };

  const handleRoleChange = async (roleId: string) => {
    setFormData({ ...formData, roleId });

    try {
      const response = await apiClient.get(`/roles/${roleId}`);
      if (response.data.success) {
        const roleData = response.data.data;
        const rolePerms = roleData.permissionNames || [];
        setGivenPermissions(rolePerms as Permission[]);
      }
    } catch (error) {
      console.error("Failed to load role permissions:", error);
      // Fallback: keep existing permissions or set empty
      if (!editingUser) {
        setGivenPermissions([]);
      }
    }
  };

  const handleAddPermission = (permission: Permission) => {
    if (!givenPermissions.includes(permission)) {
      setGivenPermissions([...givenPermissions, permission]);
    }
  };

  const handleRemovePermission = (permission: Permission) => {
    setGivenPermissions(givenPermissions.filter((p) => p !== permission));
  };

  /**
   * Sync user permissions with backend
   * Creates overrides for ALL permissions (both granted and revoked)
   */
  const syncUserPermissions = async (userId: string) => {
    try {
      // Get the role's default permission names
      const roleResponse = await apiClient.get(`/roles/${formData.roleId}`);

      let roleDefaultPerms: string[] = [];
      if (roleResponse.data.success) {
        roleDefaultPerms = roleResponse.data.data.permissionNames || [];
      }

      // Get all permissions from DB
      const permsResponse = await apiClient.get("/users/permissions/list");
      const allPerms = permsResponse.data.data;

      // Build overrides for ALL permissions
      const permissionOverrides = ALL_PERMISSIONS.map((permName) => {
        const perm = allPerms.find((p: any) => p.name === permName);
        if (!perm) return null;

        const isGiven = givenPermissions.includes(permName);
        const isInRoleDefault = roleDefaultPerms.includes(permName);

        // Only create override if user's permission differs from role default
        if (isGiven === isInRoleDefault) {
          return null; // No override needed
        }

        return {
          permissionId: perm.id,
          granted: isGiven, // true = add this permission, false = remove this permission
        };
      }).filter(Boolean); // Remove null entries

      // Replace all permission overrides
      if (permissionOverrides.length > 0) {
        await apiClient.put(`/users/${userId}/permissions`, {
          permissions: permissionOverrides,
        });
      } else {
        // If no overrides, clear all overrides (user gets exact role permissions)
        await apiClient.put(`/users/${userId}/permissions`, {
          permissions: [],
        });
      }
    } catch (error: any) {
      console.error("Failed to sync permissions:", error);
      toast.error("Failed to sync permissions");
      throw error;
    }
  };

  // ==================== CRUD OPERATIONS ====================

  const handleCreateUser = async () => {
    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.roleId
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create user
      const response = await apiClient.post("/users", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        roleId: formData.roleId,
        team: formData.team || undefined,
      });

      if (response.data.success) {
        const newUserId = response.data.data.id;

        // ✅ Sync permissions (both adds and removes)
        if (givenPermissions.length > 0 || true) {
          await syncUserPermissions(newUserId);
        }

        toast.success("User created successfully!");
        setIsCreateDialogOpen(false);
        resetForm();
        fetchUsers();
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Failed to create user";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !formData.name || !formData.email || !formData.roleId) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // Update user details
      await apiClient.put(`/users/${editingUser.id}`, {
        name: formData.name,
        email: formData.email,
        roleId: formData.roleId,
        team: formData.team || undefined,
      });

      // ✅ Sync ALL permissions (both additions and removals)
      await syncUserPermissions(editingUser.id);

      toast.success("User updated successfully!");
      setIsEditDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Failed to update user";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    setIsSubmitting(true);
    try {
      const response = await apiClient.delete(`/users/${deletingUser.id}`);

      if (response.data.success) {
        toast.success("User deleted successfully!");
        setDeletingUser(null);
        fetchUsers();
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Failed to delete user";
      toast.error(errorMessage);
      setDeletingUser(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== RENDER ====================
  const availableForAdd = getAvailablePermissions(givenPermissions);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, roles, teams and permissions
          </p>
        </div>
        <Button className="cursor-pointer" onClick={openCreateDialog} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Add New User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={selectedTeamFilter}
          onValueChange={setSelectedTeamFilter}
        >
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Filter by Team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Teams</SelectItem>
            {availableTeams.map((team) => (
              <SelectItem key={team} value={team}>
                {team}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-12 text-muted-foreground"
                      >
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow
                        key={user.id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleUserClick(user)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                              {user.avatarInitials}
                            </div>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              ROLE_COLORS[user.role] ||
                              "bg-gray-100 text-gray-700"
                            }
                            variant="secondary"
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.team || "-"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {user.permissionsCount} permissions
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              className="cursor-pointer"
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(user)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive cursor-pointer"
                              onClick={() => setDeletingUser(user)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ====================== CREATE DIALOG ====================== */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg flex flex-col">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Enter user details and assign permissions
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[70vh]">
            <div className="space-y-6 py-4 pr-4">
              <div className="space-y-2">
                <Label>Full Name*</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="John Doe"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label>Email Address*</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="john@taskflow.com"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label>Password*</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Create a strong password"
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role*</Label>
                  <Select
                    value={formData.roleId}
                    onValueChange={handleRoleChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Team</Label>
                  <Select
                    value={formData.team}
                    onValueChange={(v) => setFormData({ ...formData, team: v })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTeams.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ==================== PERMISSION MANAGEMENT ==================== */}
              <div className="space-y-4">
                {/* ✅ Assigned Permissions (click to remove) */}
                <div>
                  <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                    Assigned Permissions ({givenPermissions.length})
                  </Label>
                  {givenPermissions.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {givenPermissions.map((perm) => (
                        <Badge
                          key={perm}
                          variant="default"
                          className="text-xs bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 pl-3 pr-2 flex items-center gap-1 cursor-pointer hover:bg-red-100 hover:text-red-700 hover:dark:bg-red-950 hover:dark:text-red-300 transition-colors"
                          onClick={() => handleRemovePermission(perm)}
                          title="Click to remove this permission"
                        >
                          {PERMISSION_LABELS[perm]}
                          <X className="h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No permissions assigned yet
                    </p>
                  )}
                </div>

                {/* ✅ Available Permissions to Add */}
                <div>
                  <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <ShieldPlus className="h-4 w-4 text-blue-600" />
                    Available Permissions
                  </Label>
                  {availableForAdd.length > 0 ? (
                    <Select
                      onValueChange={(val: Permission) =>
                        handleAddPermission(val)
                      }
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Click to add a permission..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableForAdd.map((perm) => (
                          <SelectItem key={perm} value={perm}>
                            {PERMISSION_LABELS[perm]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      All permissions already assigned
                    </p>
                  )}
                </div>

                {/* ✅ Info Box */}
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>How it works:</strong> Click on a permission badge
                    to <strong>remove</strong> it from this user. Use the
                    dropdown to <strong>add</strong> new permissions. This only
                    affects this specific user, not other users with the same
                    role.
                  </p>
                </div>
              </div>
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>

          <DialogFooter>
            <Button
              className="cursor-pointer"
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="cursor-pointer"
              onClick={handleCreateUser}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====================== EDIT DIALOG ====================== */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details and permissions
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[70vh]">
            <div className="space-y-6 py-4 pr-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={formData.roleId}
                    onValueChange={handleRoleChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Team</Label>
                  <Select
                    value={formData.team}
                    onValueChange={(v) => setFormData({ ...formData, team: v })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTeams.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ==================== PERMISSION MANAGEMENT ==================== */}
              <div className="space-y-4">
                {/* ✅ Assigned Permissions (click to remove) */}
                <div>
                  <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                    Assigned Permissions ({givenPermissions.length})
                  </Label>
                  {givenPermissions.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {givenPermissions.map((perm) => (
                        <Badge
                          key={perm}
                          variant="default"
                          className="text-xs bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 pl-3 pr-2 flex items-center gap-1 cursor-pointer hover:bg-red-100 hover:text-red-700 hover:dark:bg-red-950 hover:dark:text-red-300 transition-colors"
                          onClick={() => handleRemovePermission(perm)}
                          title="Click to remove this permission from this user"
                        >
                          {PERMISSION_LABELS[perm]}
                          <X className="h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No permissions assigned
                    </p>
                  )}
                </div>

                {/* ✅ Available Permissions to Add */}
                <div>
                  <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <ShieldPlus className="h-4 w-4 text-blue-600" />
                    Available Permissions
                  </Label>
                  {availableForAdd.length > 0 ? (
                    <Select
                      onValueChange={(val: Permission) =>
                        handleAddPermission(val)
                      }
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Click to add a permission..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableForAdd.map((perm) => (
                          <SelectItem key={perm} value={perm}>
                            {PERMISSION_LABELS[perm]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      All permissions assigned
                    </p>
                  )}
                </div>

                {/* ✅ Info Box */}
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>How it works:</strong> Click on a green badge to{" "}
                    <strong>remove</strong> that permission from this user. Use
                    the dropdown to <strong>add</strong> new permissions.
                    Changes only affect this specific user.
                  </p>
                </div>
              </div>
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>

          <DialogFooter>
            <Button
              className="cursor-pointer"
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                resetForm();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="cursor-pointer"
              onClick={handleUpdateUser}
              disabled={isSubmitting}
            >
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
        open={!!deletingUser}
        onOpenChange={() => setDeletingUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deletingUser?.name}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="cursor-pointer"
              disabled={isSubmitting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UserDetailDialog
        open={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />
    </div>
  );
};
