import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore, useIsHydrated } from "@/stores";
import Loading from "@/components/ui/Loading";
import { toast } from "sonner";

interface ProtectedRouteProps {
  requiredPermission?: string;
  requiredPermissions?: string[];
  requireAll?: boolean;
  children?: React.ReactNode;
}

export default function ProtectedRoute({
  requiredPermission,
  requiredPermissions,
  requireAll = false,
  children,
}: ProtectedRouteProps) {
  const location = useLocation();

  const isHydrated = useIsHydrated();

  const user = useAuthStore((state) => state.user);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const permissions = user?.permissions ?? [];

  // =========================================
  // Wait for hydration
  // =========================================

  if (!isHydrated) {
    return <Loading />;
  }

  // =========================================
  // Not authenticated
  // =========================================

  if (!isAuthenticated || !user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // =========================================
  // Permission checker
  // =========================================

  const hasPermission = (permission: string) => {
    return permissions.includes(permission);
  };

  // =========================================
  // Single permission
  // =========================================

  if (requiredPermission && !hasPermission(requiredPermission)) {
    toast.error("Access Denied", {
      description: "You don't have permission to access this page.",
    });

    return <Navigate to="/dashboard" replace />;
  }

  // =========================================
  // Multiple permissions (ANY)
  // =========================================

  if (requiredPermissions && !requireAll) {
    const hasAny = requiredPermissions.some((p) => hasPermission(p));

    if (!hasAny) {
      toast.error("Access Denied", {
        description: "You don't have the required permissions.",
      });

      return <Navigate to="/dashboard" replace />;
    }
  }

  // =========================================
  // Multiple permissions (ALL)
  // =========================================

  if (requiredPermissions && requireAll) {
    const hasAll = requiredPermissions.every((p) => hasPermission(p));

    if (!hasAll) {
      toast.error("Access Denied", {
        description: "You need all required permissions.",
      });

      return <Navigate to="/dashboard" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
}
