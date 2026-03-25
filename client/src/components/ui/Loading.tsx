import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <div className="w-dvw h-dvh bg-neutral-950 flex flex-row gap-2 justify-center items-center text-2xl text-white">
      <div className="h-10 w-10">
        <img src="/logo.png" alt="logo" className="object-cover" />
      </div>
      <p className="special-font font-bold ">Taskflow</p>
      <LoaderCircle className="animate-spin" />
    </div>
  );
}
