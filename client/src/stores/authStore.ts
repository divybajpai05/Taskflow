// src/stores/authStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Types
// src/stores/authStore.ts

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  team: string | null;
  avatar: string | null;
  permissions: string[];
  avatarInitials: string;
  emailVerified: boolean;
  
  // ✅ NEW: Multiple workspaces support
  workspaces: {
    workspaceId: string;
    workspaceName: string;
    roleId: string;
    roleName: string;
  }[];
  activeWorkspaceId: string;
  activeWorkspaceName: string;
}

export interface AuthState {
  // State - ONLY plain values, NO getters
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isHydrated: boolean;

  // Actions
  setAuth: (user: User, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  updateUser: (userData: Partial<User>) => void;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setHydrated: (hydrated: boolean) => void;

  // Permission Checkers (these are functions, not getters - safe!)
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // ============ Plain State (NO GETTERS) ============
      user: null,
      accessToken: null,
      isLoading: false,
      isAuthenticated: false,
      isHydrated: false,

      // ============ Actions ============
      setAuth: (user, accessToken) => {
        console.log("🔵 setAuth called with:", {
          userName: user.name,
          role: user.role,
        });

        set({
          user,
          accessToken,
          isAuthenticated: true,
          isHydrated: true,
        });

        console.log("🔵 Store after setAuth:", {
          user: get().user?.name,
          isAuthenticated: get().isAuthenticated,
        });
      },

      setAccessToken: (token) => {
        set({ accessToken: token });
      },

      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },

      setHydrated: (hydrated) => {
        console.log("🔵 setHydrated:", hydrated);
        set({ isHydrated: hydrated });
      },

      logout: async () => {
        try {
          const token = get().accessToken;
          if (token) {
            await fetch(
              `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/auth/logout`,
              {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                credentials: "include",
              },
            );
          }
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isHydrated: true,
          });
          localStorage.removeItem("auth-storage");
        }
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      // ============ Permission Checkers (Functions - Safe) ============
      hasPermission: (permission) => {
        const user = get().user;
        if (!user) return false;
        return user.permissions?.includes(permission) ?? false;
      },

      hasAnyPermission: (permissions) => {
        const user = get().user;
        if (!user) return false;
        return permissions.some((p) => user.permissions?.includes(p) ?? false);
      },

      hasAllPermissions: (permissions) => {
        const user = get().user;
        if (!user) return false;
        return permissions.every((p) => user.permissions?.includes(p) ?? false);
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      skipHydration: false,
      onRehydrateStorage: (stateBefore) => {
        console.log("🔵 onRehydrateStorage BEFORE:", {
          hasUser: !!stateBefore?.user,
        });

        return (stateAfter, error) => {
          if (error) {
            console.error("🔴 Rehydration error:", error);
          }

          console.log("🔵 onRehydrateStorage AFTER:", {
            hasUser: !!stateAfter?.user,
            userName: stateAfter?.user?.name,
          });

          if (stateAfter) {
            stateAfter.isHydrated = true;
            stateAfter.isAuthenticated = !!stateAfter.user;
          }
        };
      },
    },
  ),
);

// ✅ Module load check
if (typeof window !== "undefined") {
  const stored = localStorage.getItem("auth-storage");
  console.log("🔵 Module load - localStorage:", stored ? "HAS DATA" : "EMPTY");
}

// ============ Selector Hooks (Computed Values Here - SAFE!) ============
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);
export const useIsLoading = () => useAuthStore((state) => state.isLoading);
export const useIsHydrated = () => useAuthStore((state) => state.isHydrated);

// ✅ Computed values as selectors (NOT getters in store)
export const useWorkspaceId = () => {
  const user = useAuthStore((state) => state.user);
  return user?.activeWorkspaceId || null;
};


export const useUserName = () => {
  const user = useAuthStore((state) => state.user);
  return user?.name || "";
};

export const useUserEmail = () => {
  const user = useAuthStore((state) => state.user);
  return user?.email || "";
};

export const useUserRole = () => {
  const user = useAuthStore((state) => state.user);
  return user?.role || "";
};

export const useUserInitials = () => {
  const user = useAuthStore((state) => state.user);
  return user?.avatarInitials || "";
};

export const usePermissions = () => {
  const user = useAuthStore((state) => state.user);
  return user?.permissions ?? [];
};

export const useUserInfo = () => {
  const user = useAuthStore((state) => state.user);
  return {
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || "",
    initials: user?.avatarInitials || "",
    avatar: user?.avatar,
  };
};

export const useHasPermission = (permission: string) =>
  useAuthStore((state) => state.hasPermission(permission));

export const useHasAnyPermission = (permissions: string[]) =>
  useAuthStore((state) => state.hasAnyPermission(permissions));

export const useHasAllPermissions = (permissions: string[]) =>
  useAuthStore((state) => state.hasAllPermissions(permissions));
