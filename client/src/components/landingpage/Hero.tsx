import { RadialGlow } from "@/components/ui/gloweffect";
import { Button } from "../ui/button";
import { Building2, ClipboardList, Users } from "lucide-react";
import { Activity } from "react";

export default function Hero() {
  return (
    <div className="relative h-screen">
      <div className="fixed inset-0 overflow-hidden">
        <RadialGlow
          color="purple"
          size="xl"
          opacity="medium"
          className="lg:top-1/2 lg:-left-1/4 sm:top-[70%] sm:-left-[70%] top-[90%] -left-[90%]"
        />
        <RadialGlow
          color="blue"
          size="lg"
          opacity="medium"
          className="lg:bottom-1/4 lg:-right-1/4 sm:bottom-[60%] sm:-right-[50%] bottom-[80%] -right-[90%]"
        />
        <RadialGlow
          color="pink"
          size="md"
          opacity="strong"
          className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        />
      </div>

      <div className="flex items-center relative px-10 xl:px-40 text-center h-dvh bg-neutral-950/60 backdrop-blur-2xl">
        <div className="text-white">
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-8 leading-16">
            Professional Task Management <br />
            For Your Organization
          </h1>
          <p className="text-sm lg:text-xl text-gray-300 antialiased max-w-2/3 m-auto whitespace-pre-line">
            A powerful, enterprise-grade task management platform. Streamline
            workflows, enhance collaboration, and boost productivity across your
            teams.
          </p>
          <div className="mt-8 flex flex-row gap-2 justify-center">
            <Button className="px-6 py-4 sm:px-20 sm:py-5 border-neutral-400/50 text-white hover:bg-neutral-400/10 cursor-pointer backdrop-blur-lg rounded-full bg-transparent">
              Try for free
            </Button>
            <Button
              className="px-4 py-4 sm:px-10 sm:py-5 cursor-pointer rounded-full"
              variant={"secondary"}
            >
              Explore
            </Button>
          </div>
          <div className="flex flex-row gap-4 justify-center mt-8 items-center">
            <div className="flex flex-col gap-1 border border-neutral-400/50 p-4 rounded-lg items-center bg-neutral-400/10">
              <Building2 />
              <p>50+</p>
              <p>Organization</p>
            </div>

            <div className="flex flex-col gap-1 border border-neutral-400/50 p-4 rounded-lg items-center bg-neutral-400/10">
              <ClipboardList />
              <p>1000+</p>
              <p>Tasks created</p>
            </div>

            <div className="flex flex-col gap-1 border border-neutral-400/50 p-4 rounded-lg items-center bg-neutral-400/10">
              <Users />
              <p>200+</p>
              <p>Team managed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
