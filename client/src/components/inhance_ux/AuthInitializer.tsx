// src/components/AuthInitializer.tsx
import { useEffect } from "react";
import { useIsHydrated, useAuthStore } from "@/stores";
import Loading from "@/components/ui/Loading";

export default function AuthInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  const isHydrated = useIsHydrated();
  const setHydrated = useAuthStore((state) => state.setHydrated);

  // Fallback: Force hydration after timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentState = useAuthStore.getState();
      if (!currentState.isHydrated) {
        console.log("⚠️ Rehydration timeout - forcing hydration");
        setHydrated(true);
      }
    }, 2000); // 2 second timeout

    return () => clearTimeout(timer);
  }, [setHydrated]);

  if (!isHydrated) {
    return <Loading />;
  }

  return <>{children}</>;
}
