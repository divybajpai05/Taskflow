import { cn } from "@/lib/utils";

interface RadialGlowProps {
  className?: string;
  color?: string;
  size?: "sm" | "md" | "lg" | "xl";
  opacity?: "light" | "medium" | "strong";
}

export function RadialGlow({
  className,
  color = "purple",
  size = "lg",
  opacity = "medium",
}: RadialGlowProps) {
  const sizeClasses = {
    sm: "w-64 h-64",
    md: "w-96 h-96",
    lg: "w-[32rem] h-[32rem]",
    xl: "w-[48rem] h-[48rem]",
  };

  const opacityClasses = {
    light: "opacity-20",
    medium: "opacity-40",
    strong: "opacity-60",
  };

  const colorClasses = {
    purple: "from-purple-600 via-purple-500 to-transparent",
    blue: "from-blue-600 via-blue-500 to-transparent",
    pink: "from-pink-600 via-pink-500 to-transparent",
    cyan: "from-cyan-600 via-cyan-500 to-transparent",
  };

  return (
    <div
      className={cn(
        "absolute rounded-full bg-gradient-radial blur-3xl",
        sizeClasses[size],
        colorClasses[color as keyof typeof colorClasses],
        opacityClasses[opacity],
        className,
      )}
    />
  );
}
