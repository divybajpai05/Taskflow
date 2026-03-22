import {
  BellRing,
  BriefcaseBusiness,
  CalendarDays,
  ChartColumn,
  FingerprintPattern,
  SquareKanban,
} from "lucide-react";

const capabilityItems = [
  {
    icon: <SquareKanban />,
    title: "Kanban board",
    description: "Visualize your workflow in easy to understand coloumns",
  },
  {
    icon: <CalendarDays />,
    title: "Calender view",
    description: "Track deadlines and milestones in an intuitive calendar",
  },

  {
    icon: <BellRing />,
    title: "Realtime notification",
    description: "Stay updated with instant notifications and alerts!",
  },
  {
    icon: <ChartColumn />,
    title: "Analytics Dashboard",
    description: "Gain insights with comprehensive analytics and reports",
  },
  {
    icon: <FingerprintPattern />,
    title: "Role-Based Access",
    description: "Secure your data with granular permission controls",
  },
  {
    icon: <BriefcaseBusiness />,
    title: "Multi Workspace",
    description: "Manage multiple projects and teams in one place",
  },
];

export default function Capabilities() {
  return (
    <div className=" flex flex-col gap-10 justify-center items-center">
      <div className="">
        <h1 className="text-4xl text-center font-bold mb-2">
          Enterprise Grade{" "}
          <span className="text-orange-600 special-font">Capabilities</span>
        </h1>
        <p className="text-center special-font font-light text-xl">
          Comprehensive tools designed for professional teams and organizations
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {capabilityItems.map((item, index) => (
          <div
            key={index}
            className="shine-glass w-full sm:w-auto flex flex-col gap-4 border border-dashed border-neutral-400/40 p-4 rounded-lg"
          >
            {item.icon}
            <p className="text-orange-600 font-bold special-font text-2xl">{item.title}</p>
            <p className="font-light text-neutral-400">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
