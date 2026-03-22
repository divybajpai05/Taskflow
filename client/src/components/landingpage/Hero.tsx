import { RadialGlow } from "@/components/ui/gloweffect";
import { Button } from "../ui/button";
import { Building2, ClipboardList, Users } from "lucide-react";
import AuthDialogs from "./AuthDialog";

const HeroSectionHightlight = [
  {
    icon: <Building2 />,
    value: "50+",
    text: "Organization",
  },
  {
    icon: <ClipboardList />,
    value: "1000+",
    text: "Tasks created",
  },
  {
    icon: <Users />,
    value: "200+",
    text: "Team managed",
  },
];

export default function Hero() {
  return (
    <div className="relative h-full sm:h-screen">
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

      <div className="flex items-center relative py-10 sm:pt-0 px-4 sm:px-10 xl:px-40 text-center h-full bg-neutral-950/60 backdrop-blur-2xl">
        <div className="text-white mt-12 sm:mt-18">
          <h1 className=" text-4xl lg:text-7xl font-bold text-white mb-8 sm:leading-20">
            <span className="">Professional</span>{" "}
            <span className="pacifico-regular text-orange-600">
              Task Management
            </span>{" "}
            <span></span>
            <br />
            For Your <span className="">Organization</span>
          </h1>
          <p className="special-font text-sm lg:text-lg sm:max-w-2/4 m-auto whitespace-pre-line">
            A powerful, enterprise-grade task management platform. Streamline
            workflows, enhance collaboration, and boost productivity across your
            teams.
          </p>
          <div className="mt-8 flex flex-row gap-2 justify-center">
            <AuthDialogs
              trigger={
                <Button className="shine-glass px-6 py-4 sm:px-20 sm:py-5 border border-dashed border-neutral-400/40 text-white hover:bg-neutral-400/10 cursor-pointer backdrop-blur-lg rounded-full bg-transparent">
                  Try for free
                </Button>
              }
              renderDefaultButtons={false}
            />
            <Button
              className="px-4 py-4 sm:px-10 sm:py-5 cursor-pointer rounded-full"
              variant={"secondary"}
            >
              Explore
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 items-center">
            {HeroSectionHightlight.map((item) => (
              <div className="shine-glass flex flex-col w-full sm:w-auto gap-1 border border-dashed border-neutral-400/40 p-4 rounded-lg items-center font-light">
                {item.icon}
                <p className="text-orange-600 font-bold text-2xl">
                  {item.value}
                </p>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
