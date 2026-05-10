import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { allDashboardRoutes, AppSidebar } from "./sidebar/AppSidebar";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";

export default function DashboardLayout() {
  const location = useLocation();

  const notification = false;

  const getPageTitle = (pathname: string) => {
    const cleanPath = pathname.replace(/\/$/, "");

    const match = allDashboardRoutes.find((route) => {
      if (route.url === "/") return cleanPath === "/dashboard";
      return cleanPath.endsWith(route.url);
    });

    return match ? match.title : "Page Not Found";
  };

  return (
    <SidebarProvider className="min-h-screen">
      <div className="flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <div className="flex flex-row justify-between items-center p-4 pr-10 border-b">
            <div className="flex flex-row items-center">
              <SidebarTrigger className="cursor-pointer" />
              <h1 className="ml-4 sm:text-xl font-semibold">
                {getPageTitle(location.pathname)}
              </h1>
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
              <Button className="cursor-pointer" variant={"ghost"} onClick={() => toast.message("Feature coming soon")}>
                <Bell size={22} className="text-gray-600 " />
              </Button>
              {notification && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white">
                  0
                </span>
              )}
            </div>
          </div>
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
