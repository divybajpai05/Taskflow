// src/components/dashboard/sidebar/AppSidebar.tsx
import {
  Building2,
  CalendarCheck,
  CalendarDays,
  ChartColumnBig,
  ChevronUp,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  Logs,
  Mail,
  NotebookText,
  Settings,
  ShieldCheck,
  UserCog,
  UserMinus,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore, useIsHydrated, useHasPermission } from "@/stores";

// =========================================
// Menu Items Definition
// =========================================

const Application = [
  {
    title: "Overview",
    url: "/",
    icon: LayoutDashboard,
    permission: "dashboard_access",
  },
  {
    title: "My Tasks",
    url: "tasks",
    icon: NotebookText,
    permission: "my_tasks",
  },
  {
    title: "Kanban board",
    url: "kanban",
    icon: KanbanSquare,
    permission: "kanban_board",
  },
  {
    title: "Calendar",
    url: "calendar",
    icon: CalendarDays,
    permission: "calendar",
  },
];

const HrManagement = [
  {
    title: "HR Dashboard",
    url: "hr-dashboard",
    icon: LayoutDashboard,
    permission: "hr_dashboard",
  },
  {
    title: "Attendance",
    url: "attendance-management",
    icon: CalendarCheck,
    permission: "attendance",
  },
  {
    title: "Leave Management",
    url: "leave-management",
    icon: UserMinus,
    permission: "leave_management",
  },
  {
    title: "HR Calendar",
    url: "hr-calendar",
    icon: CalendarDays,
    permission: "hr_calendar",
  },
  {
    title: "Email Center",
    url: "email-center",
    icon: Mail,
    permission: "email_center",
  },
  {
    title: "Teams",
    url: "teams",
    icon: Users,
    permission: "team_management",
  },
];

const Admin = [
  {
    title: "Analytics",
    url: "analytics",
    icon: ChartColumnBig,
    permission: "analytics",
  },
  {
    title: "Workspaces",
    url: "workspaces",
    icon: Building2,
    permission: "workspaces",
  },
  {
    title: "User Management",
    url: "user-management",
    icon: UserCog,
    permission: "user_management",
  },
  {
    title: "Role Management",
    url: "role-management",
    icon: ShieldCheck,
    permission: "role_management",
  },
];

// ✅ NEW: General Section (Available to everyone)
const General = [
  {
    title: "Activity Logs",
    url: "activity",
    icon: Logs,
    permission: "activity_logs",
  },
];

// ✅ Export all routes for DashboardLayout header
export const allDashboardRoutes = [
  ...Application,
  ...HrManagement,
  ...Admin,
  ...General,
];

// =========================================
// AppSidebar Component
// =========================================

export function AppSidebar() {
  const navigate = useNavigate();

  const isHydrated = useIsHydrated();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const userName = user?.name || "";
  const userEmail = user?.email || "";
  const userInitials = user?.avatarInitials || "";
  const userRole = user?.role || "";

  const hasPermission = useHasPermission;

  const filteredApplication = user
    ? Application.filter(
        (item) => !item.permission || hasPermission(item.permission),
      )
    : Application;

  const filteredHrManagement = user
    ? HrManagement.filter(
        (item) => !item.permission || hasPermission(item.permission),
      )
    : HrManagement;

  const filteredAdmin = user
    ? Admin.filter((item) => !item.permission || hasPermission(item.permission))
    : Admin;

  // ✅ General section - filtered like others
  const filteredGeneral = user
    ? General.filter(
        (item) => !item.permission || hasPermission(item.permission),
      )
    : General;

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const getAvatarColor = () => {
    if (userRole === "Admin") return "bg-red-500";
    if (userRole === "HR") return "bg-purple-500";
    if (userRole === "Manager") return "bg-blue-500";
    return "bg-green-500";
  };

  // Loading State
  if (!isHydrated) {
    return (
      <Sidebar className="h-full">
        <SidebarHeader>
          <div className="flex flex-row items-center gap-1 p-2">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-6 w-24" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          {[1, 2, 3].map((i) => (
            <SidebarGroup key={i}>
              <SidebarGroupLabel>
                <Skeleton className="h-4 w-20" />
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {[1, 2, 3, 4].map((j) => (
                    <SidebarMenuItem key={j}>
                      <SidebarMenuButton>
                        <Skeleton className="size-4 mr-2" />
                        <Skeleton className="h-4 w-24" />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="h-auto py-2">
                <Skeleton className="size-5 rounded-full mr-2" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <ChevronUp className="ml-auto size-4" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    );
  }

  const displayName = userName || "User";
  const displayEmail = userEmail || "";
  const displayInitials = userInitials || "U";
  const displayRole = userRole || "";

  return (
    <Sidebar className="h-full">
      <SidebarHeader>
        <div className="flex flex-row items-center gap-1 p-2">
          <div className="flex aspect-square size-8 items-center justify-center">
            <img
              src="/logo.png"
              alt="logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="sm:flex flex-col cursor-pointer">
            <span className="pacifico-regular text-xl tracking-wider text-neutral-800/90">
              Taskflow
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Application Section */}
        {filteredApplication.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Application</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredApplication.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        to={`/dashboard${item.url === "/" ? "" : `/${item.url}`}`}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* HR Management Section */}
        {filteredHrManagement.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>HR Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredHrManagement.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link to={`/dashboard/${item.url}`}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* ✅ General Section - Activity Logs (Everyone) */}
        {filteredGeneral.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>General</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredGeneral.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link to={`/dashboard/${item.url}`}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin Section */}
        {filteredAdmin.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredAdmin.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link to={`/dashboard/${item.url}`}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground h-auto py-2">
                  <div
                    className={`w-5 h-5 rounded-full ${getAvatarColor()} text-white flex items-center justify-center text-[10px] font-medium`}
                  >
                    {displayInitials}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium truncate">
                      {displayName}
                    </p>
                    {displayEmail && (
                      <p className="text-xs text-muted-foreground truncate">
                        {displayEmail}
                      </p>
                    )}
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width] mb-2"
              >
                <div className="px-2 py-1.5 text-xs text-muted-foreground border-b border-border mb-1">
                  <p className="font-medium text-foreground">{displayName}</p>
                  <p>{displayEmail}</p>
                  {displayRole && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] rounded-full bg-primary/10 text-primary">
                      {displayRole}
                    </span>
                  )}
                </div>
                <DropdownMenuItem asChild>
                  <Link
                    to="/dashboard/settings"
                    className="flex items-center gap-2 cursor-pointer w-full"
                  >
                    <Settings className="size-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={handleLogout}
                >
                  <div className="flex items-center gap-2 w-full">
                    <LogOut className="size-4" />
                    <span>Log out</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
