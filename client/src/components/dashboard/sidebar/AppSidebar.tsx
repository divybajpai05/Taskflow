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
  User2,
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
import { Link } from "react-router-dom"; // Use Link for SPA navigation
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Application = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
  { title: "My Tasks", url: "tasks", icon: NotebookText },
  { title: "Kanban board", url: "kanban", icon: KanbanSquare },
  { title: "Calender", url: "calender", icon: CalendarDays },
  { title: "Analytics", url: "analytics", icon: ChartColumnBig },
];

// Not present in sidebar, but in header of dashboardLayout. the purpose to this here for dashboardLayout header title.
const Nofications = [{ title: "Notifications", url: "notifications" }];

const HrManagement = [
  { title: "HR Dashboard", url: "hr-dashboard", icon: LayoutDashboard },
  { title: "Attendance", url: "attendance-management", icon: CalendarCheck },
  { title: "Leave Management", url: "leave-management", icon: UserMinus },
  { title: "HR Calendar", url: "hr-calendar", icon: CalendarDays },
  { title: "Email Center", url: "email-center", icon: Mail },
  { title: "Teams", url: "teams", icon: Users },
  { title: "User Management", url: "user-management", icon: UserCog },
];

const Admin = [
  { title: "Workspaces", url: "workspaces", icon: Building2 },
  { title: "Activity Logs", url: "activity", icon: Logs },
];

export const allDashboardRoutes = [
  ...Application,
  ...HrManagement,
  ...Admin,
  ...Nofications,
];

export function AppSidebar() {
  return (
    <Sidebar className="h-full">
      <SidebarHeader className="">
        <div className="flex flex-row items-center gap-1">
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
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {Application.map((item) => (
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

        <SidebarGroup>
          <SidebarGroupLabel>HR Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {HrManagement.map((item) => (
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

        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {Admin.map((item) => (
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
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {/* Use SidebarMenuButton directly as the trigger */}
                <SidebarMenuButton className="cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  <User2 className="size-4" />
                  <span className="font-medium">Prashant Thakur</span>
                  <ChevronUp className="ml-auto size-4" />{" "}
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="top" // Opens upwards since it's in the footer
                className="w-[--radix-popper-anchor-width] mb-2"
              >
                <DropdownMenuItem asChild>
                  <Link
                    to="/dashboard/settings"
                    className="flex items-center gap-2 cursor-pointer w-full"
                  >
                    <Settings className="size-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
                  <div
                    className="flex items-center gap-2 w-full"
                    onClick={() => console.log("Logout")}
                  >
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
