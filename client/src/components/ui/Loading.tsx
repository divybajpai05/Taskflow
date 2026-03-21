import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <div className="w-dvw h-dvh bg-neutral-950 flex flex-row gap-2 justify-center items-center text-2xl text-white">
      <p className="animate-pulse font-bold">Taskflow...</p>
      <LoaderCircle className="animate-spin" />
    </div>
  );
}
