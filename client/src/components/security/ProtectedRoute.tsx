// src/components/security/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore, useIsHydrated, useHasPermission } from "@/stores";
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

  // ✅ CRITICAL: Wait for hydration before checking auth
  const isHydrated = useIsHydrated();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const hasPermission = useHasPermission;

  // ✅ Show loading while store is hydrating
  if (!isHydrated) {
    console.log("🔵 ProtectedRoute: Waiting for hydration...");
    return <Loading />;
  }

  // ✅ Only check auth AFTER hydration is complete
  if (!isAuthenticated || !user) {
    console.log("🔴 ProtectedRoute: Not authenticated, redirecting to /");
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check single permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    console.log(
      `🔴 ProtectedRoute: Missing permission "${requiredPermission}"`,
    );

    toast.error("Access Denied", {
      description: `You don't have permission to access this page.`,
      duration: 5000,
    });

    return <Navigate to="/dashboard" replace />;
  }

  // Check multiple permissions (ANY)
  if (requiredPermissions && !requireAll) {
    const hasAny = requiredPermissions.some((p) => hasPermission(p));

    if (!hasAny) {
      console.log(
        `🔴 ProtectedRoute: Missing any of: ${requiredPermissions.join(", ")}`,
      );

      toast.error("Access Denied", {
        description: `You don't have the required permissions.`,
        duration: 5000,
      });

      return <Navigate to="/dashboard" replace />;
    }
  }

  // Check multiple permissions (ALL)
  if (requiredPermissions && requireAll) {
    const hasAll = requiredPermissions.every((p) => hasPermission(p));

    if (!hasAll) {
      console.log(
        `🔴 ProtectedRoute: Missing all: ${requiredPermissions.join(", ")}`,
      );

      toast.error("Access Denied", {
        description: `You need all required permissions.`,
        duration: 5000,
      });

      return <Navigate to="/dashboard" replace />;
    }
  }

  // ✅ User is authenticated and authorized
  return children ? <>{children}</> : <Outlet />;
}
