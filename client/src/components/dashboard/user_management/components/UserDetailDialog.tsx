// components/dashboard/users/UserDetailDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Mail,
  Phone,
  Shield,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  Key,
  Clock,
  Users,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UserDetail {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  team?: string | null;
  department?: string;
  isActive: boolean;
  emailVerified: boolean;
  avatar?: string | null;
  avatarInitials: string;
  permissions: string[];
  permissionsCount: number;
  workspaceId?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

interface UserDetailDialogProps {
  open: boolean;
  onClose: () => void;
  user: UserDetail | null;
}

const PERMISSION_LABELS: Record<string, string> = {
  dashboard_access: "Dashboard Access",
  my_tasks: "My Tasks",
  kanban_board: "Kanban Board",
  calendar: "Calendar",
  hr_dashboard: "HR Dashboard",
  attendance: "Attendance",
  leave_management: "Leave Management",
  leave_type_management: "Leave Type Management",
  hr_calendar: "HR Calendar",
  email_center: "Email Center",
  team_management: "Team Management",
  analytics: "Analytics",
  user_management: "User Management",
  workspaces: "Workspaces",
  role_management: "Role Management",
  activity_logs: "Activity Logs",
};

const PERMISSION_MODULES: Record<string, { label: string; color: string }> = {
  general: { label: "General", color: "bg-blue-100 text-blue-700" },
  tasks: { label: "Tasks", color: "bg-emerald-100 text-emerald-700" },
  hr: { label: "HR", color: "bg-purple-100 text-purple-700" },
  admin: { label: "Admin", color: "bg-red-100 text-red-700" },
  teams: { label: "Teams", color: "bg-amber-100 text-amber-700" },
  communication: {
    label: "Communication",
    color: "bg-indigo-100 text-indigo-700",
  },
  analytics: { label: "Analytics", color: "bg-cyan-100 text-cyan-700" },
};

function getModuleForPermission(permission: string): string {
  if (
    permission.startsWith("hr_") ||
    ["attendance", "leave_management", "leave_type_management"].includes(
      permission,
    )
  )
    return "hr";
  if (
    [
      "user_management",
      "workspaces",
      "role_management",
      "activity_logs",
    ].includes(permission)
  )
    return "admin";
  if (["my_tasks", "kanban_board", "calendar"].includes(permission))
    return "tasks";
  if (permission === "team_management") return "teams";
  if (permission === "email_center") return "communication";
  if (permission === "analytics") return "analytics";
  return "general";
}

function getRoleColor(role: string) {
  switch (role) {
    case "Admin":
      return "bg-red-100 text-red-700";
    case "HR":
      return "bg-purple-100 text-purple-700";
    case "Manager":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-green-100 text-green-700";
  }
}

function getAvatarColor(role: string) {
  switch (role) {
    case "Admin":
      return "bg-red-500";
    case "HR":
      return "bg-purple-500";
    case "Manager":
      return "bg-blue-500";
    default:
      return "bg-green-500";
  }
}

export function UserDetailDialog({
  open,
  onClose,
  user,
}: UserDetailDialogProps) {
  if (!user) return null;

  // Group permissions by module
  const permissionGroups: Record<string, string[]> = {};
  user.permissions.forEach((perm) => {
    const module = getModuleForPermission(perm);
    if (!permissionGroups[module]) permissionGroups[module] = [];
    permissionGroups[module].push(perm);
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <ScrollArea className="max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback
                  className={`${getAvatarColor(user.role)} text-white text-xl font-bold`}
                >
                  {user.avatarInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl">{user.name}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getRoleColor(user.role)}>
                    <Shield className="h-3 w-3 mr-1" />
                    {user.role}
                  </Badge>
                  {user.isActive ? (
                    <Badge className="bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700">
                      <XCircle className="h-3 w-3 mr-1" /> Inactive
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Contact Info */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Contact Information
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                  <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                  <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium">
                      {user.phone || "Not set"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Organization Info */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Organization
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                  <Building2 className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Team</p>
                    <p className="text-sm font-medium">
                      {user.team || "Not assigned"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                  <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Joined</p>
                    <p className="text-sm font-medium">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                  <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Last Login</p>
                    <p className="text-sm font-medium">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleString()
                        : "Never"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                  <Key className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Email Verified</p>
                    <p className="text-sm font-medium">
                      {user.emailVerified ? (
                        <span className="text-emerald-600">Yes</span>
                      ) : (
                        <span className="text-red-600">No</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Permissions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Permissions
                </h4>
                <Badge variant="secondary">
                  <Users className="h-3 w-3 mr-1" />
                  {user.permissionsCount} permissions
                </Badge>
              </div>

              {Object.entries(permissionGroups).map(([module, perms]) => {
                const moduleInfo =
                  PERMISSION_MODULES[module] || PERMISSION_MODULES.general;
                return (
                  <div key={module} className="space-y-1.5">
                    <Badge className={moduleInfo.color + " text-xs"}>
                      {moduleInfo.label}
                    </Badge>
                    <div className="flex flex-wrap gap-1.5 pl-1">
                      {perms.map((perm) => (
                        <Badge
                          key={perm}
                          variant="outline"
                          className="text-xs bg-white"
                        >
                          {PERMISSION_LABELS[perm] || perm}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
