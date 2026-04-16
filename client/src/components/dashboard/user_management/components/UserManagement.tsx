// components/hr/UserManagement.tsx
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";

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
];

type Permission = (typeof ALL_PERMISSIONS)[number];

const DEFAULT_PERMISSIONS_BY_ROLE: Record<
  "Admin" | "HR" | "Manager" | "Employee",
  Permission[]
> = {
  Admin: ALL_PERMISSIONS,
  HR: [
    "dashboard_access",
    "my_tasks",
    "calendar",
    "hr_dashboard",
    "attendance",
    "leave_management",
    "hr_calendar",
    "email_center",
    "team_management",
    "user_management",
  ],
  Manager: [
    "dashboard_access",
    "my_tasks",
    "kanban_board",
    "calendar",
    "analytics",
    "team_management",
  ],
  Employee: ["dashboard_access", "my_tasks", "kanban_board", "calendar"],
};

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
};

// ==================== TYPES ====================
interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "HR" | "Manager" | "Employee";
  team: string;
  joinedAt: string;
  avatarInitials: string;
  permissions: Permission[];
}

const AVAILABLE_TEAMS = [
  "Engineering",
  "Marketing",
  "HR & People",
  "Sales",
  "Product",
  "Design",
];

const ROLE_COLORS: Record<User["role"], string> = {
  Admin: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  HR: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  Manager: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Employee: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
};

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([
    {
      id: "u1",
      name: "Prashant Thakur",
      email: "prashant@taskflow.com",
      role: "Admin",
      team: "HR & People",
      joinedAt: "2025-12-01",
      avatarInitials: "PT",
      permissions: DEFAULT_PERMISSIONS_BY_ROLE.Admin,
    },
    {
      id: "u2",
      name: "Neha Gupta",
      email: "neha@taskflow.com",
      role: "HR",
      team: "HR & People",
      joinedAt: "2026-01-15",
      avatarInitials: "NG",
      permissions: DEFAULT_PERMISSIONS_BY_ROLE.HR,
    },
    {
      id: "u3",
      name: "Vikram Rao",
      email: "vikram@taskflow.com",
      role: "Manager",
      team: "Engineering",
      joinedAt: "2026-02-10",
      avatarInitials: "VR",
      permissions: DEFAULT_PERMISSIONS_BY_ROLE.Manager,
    },
    {
      id: "u4",
      name: "Priya Patel",
      email: "priya@taskflow.com",
      role: "Employee",
      team: "Marketing",
      joinedAt: "2026-03-05",
      avatarInitials: "PP",
      permissions: DEFAULT_PERMISSIONS_BY_ROLE.Employee,
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>("All");

  // Dialog States
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Employee" as User["role"],
    team: "",
  });

  const [extraPermissions, setExtraPermissions] = useState<Permission[]>([]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam =
      selectedTeamFilter === "All" || user.team === selectedTeamFilter;
    return matchesSearch && matchesTeam;
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "Employee",
      team: "",
    });
    setExtraPermissions([]);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      team: user.team,
    });
    const extras = user.permissions.filter(
      (p) => !DEFAULT_PERMISSIONS_BY_ROLE[user.role].includes(p),
    );
    setExtraPermissions(extras);
    setIsEditDialogOpen(true);
  };

  const handleRoleChange = (role: User["role"]) => {
    setFormData({ ...formData, role });
    setExtraPermissions([]);
  };

  const handleAddExtraPermission = (permission: Permission) => {
    if (!extraPermissions.includes(permission)) {
      setExtraPermissions([...extraPermissions, permission]);
    }
  };

  const handleRemoveExtraPermission = (permission: Permission) => {
    setExtraPermissions(extraPermissions.filter((p) => p !== permission));
  };

  const handleSaveUser = (isEdit: boolean) => {
    if (!formData.name || !formData.email || !formData.team) {
      alert("Name, Email and Team are required");
      return;
    }
    if (!isEdit && !formData.password) {
      alert("Password is required for new users");
      return;
    }

    const finalPermissions: Permission[] = [
      ...DEFAULT_PERMISSIONS_BY_ROLE[formData.role],
      ...extraPermissions,
    ].filter((v, i, a) => a.indexOf(v) === i);

    if (isEdit) {
      setUsers((prev) =>
        prev.map((u) =>
          u.email === formData.email
            ? {
                ...u,
                name: formData.name,
                role: formData.role,
                team: formData.team,
                permissions: finalPermissions,
              }
            : u,
        ),
      );
      setIsEditDialogOpen(false);
    } else {
      const newUser: User = {
        id: `u${Date.now()}`,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        team: formData.team,
        joinedAt: new Date().toISOString().split("T")[0],
        avatarInitials: formData.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
        permissions: finalPermissions,
      };
      setUsers((prev) => [...prev, newUser]);
      setIsCreateDialogOpen(false);
    }
    resetForm();
  };

  const handleDelete = () => {
    if (deletingUser) {
      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      setDeletingUser(null);
    }
  };

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
            {AVAILABLE_TEAMS.map((team) => (
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
                    <TableRow key={user.id}>
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
                          className={ROLE_COLORS[user.role]}
                          variant="secondary"
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.team}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.joinedAt}
                      </TableCell>
                      <TableCell>
                        {user.permissions.length} permissions
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
        </CardContent>
      </Card>

      {/* ====================== CREATE DIALOG ====================== */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg flex flex-col">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Enter user details and assign access
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
                  placeholder="John Doe"
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
                  placeholder="john@taskflow.com"
                />
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Create a strong password"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={handleRoleChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Employee">Employee</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Team</Label>
                  <Select
                    value={formData.team}
                    onValueChange={(v) => setFormData({ ...formData, team: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_TEAMS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Default Permissions */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Default Permissions for {formData.role}
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {DEFAULT_PERMISSIONS_BY_ROLE[formData.role].map((perm) => (
                    <Badge key={perm} variant="secondary" className="text-xs">
                      {PERMISSION_LABELS[perm]}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Extra Permissions */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Additional Permissions
                </Label>
                <Select
                  onValueChange={(val: Permission) =>
                    handleAddExtraPermission(val)
                  }
                >
                  <SelectTrigger className="mb-3">
                    <SelectValue placeholder="Add extra permission..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_PERMISSIONS.filter(
                      (p) =>
                        !DEFAULT_PERMISSIONS_BY_ROLE[formData.role].includes(p),
                    ).map((perm) => (
                      <SelectItem key={perm} value={perm}>
                        {PERMISSION_LABELS[perm]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {extraPermissions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {extraPermissions.map((perm) => (
                      <Badge
                        key={perm}
                        variant="outline"
                        className="pl-3 pr-2 flex items-center gap-1 text-xs"
                      >
                        {PERMISSION_LABELS[perm]}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 text-destructive cursor-pointer"
                          onClick={() => handleRemoveExtraPermission(perm)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
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
            >
              Cancel
            </Button>
            <Button className="cursor-pointer" onClick={() => handleSaveUser(false)}>Create User</Button>
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
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={handleRoleChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Employee">Employee</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Team</Label>
                  <Select
                    value={formData.team}
                    onValueChange={(v) => setFormData({ ...formData, team: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_TEAMS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Default Permissions */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Default Permissions for {formData.role}
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {DEFAULT_PERMISSIONS_BY_ROLE[formData.role].map((perm) => (
                    <Badge key={perm} variant="secondary" className="text-xs">
                      {PERMISSION_LABELS[perm]}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Extra Permissions - Same as Create */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Additional Permissions
                </Label>
                <Select
                  onValueChange={(val: Permission) =>
                    handleAddExtraPermission(val)
                  }
                >
                  <SelectTrigger className="mb-3">
                    <SelectValue placeholder="Add extra permission..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_PERMISSIONS.filter(
                      (p) =>
                        !DEFAULT_PERMISSIONS_BY_ROLE[formData.role].includes(p),
                    ).map((perm) => (
                      <SelectItem key={perm} value={perm}>
                        {PERMISSION_LABELS[perm]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {extraPermissions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {extraPermissions.map((perm) => (
                      <Badge
                        key={perm}
                        variant="outline"
                        className="pl-3 pr-2 flex items-center gap-1 text-xs"
                      >
                        {PERMISSION_LABELS[perm]}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 text-destructive cursor-pointer"
                          onClick={() => handleRemoveExtraPermission(perm)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
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
            >
              Cancel
            </Button>
            <Button className="cursor-pointer" onClick={() => handleSaveUser(true)}>Save Changes</Button>
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
