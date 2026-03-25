import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./sidebar/AppSidebar";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Bell } from "lucide-react";

export default function DashboardLayout() {
  const location = useLocation();

  const notification = false;

  const getPageTitle = (path: string) => {
    const segments = path.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1] || "Dashboard";

    return lastSegment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  return (
    <SidebarProvider className="">
      <AppSidebar />
      <main className="w-full">
        <div className="flex flex-row justify-between items-center p-4 pr-10 border-b">
          <div className="flex flex-row items-center">
            <SidebarTrigger className="cursor-pointer" />
            <h1 className="ml-4 font-semibold">
              {getPageTitle(location.pathname)}
            </h1>
          </div>
          <div className="relative inline-flex items-center cursor-pointer">
            <Link to={"/dashboard/notifications"}>
              <Bell size={22} className="text-gray-600 " />
            </Link>
            {notification && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white">
                21
              </span>
            )}
          </div>
        </div>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </SidebarProvider>
  );
}
