import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const activities = [
  {
    id: 1,
    user: "Shiva",
    action: "completed",
    target: "Submission form",
    time: "11:46 PM",
    status: "success",
  },
  {
    id: 2,
    user: "Prashant Thakur",
    action: "completed",
    target: "Update Signin/signup page",
    time: "4:43 PM",
    status: "success",
  },
  {
    id: 3,
    user: "Prashant Thakur",
    action: "completed",
    target: "Taskflow Home Page",
    time: "4:41 PM",
    status: "success",
  },
  {
    id: 3,
    user: "Prashant Thakur",
    action: "completed",
    target: "Taskflow Home Page",
    time: "4:41 PM",
    status: "success",
  },
  {
    id: 3,
    user: "Prashant Thakur",
    action: "completed",
    target: "Taskflow Home Page",
    time: "4:41 PM",
    status: "success",
  },
  {
    id: 3,
    user: "Prashant Thakur",
    action: "completed",
    target: "Taskflow Home Page",
    time: "4:41 PM",
    status: "success",
  },
  {
    id: 3,
    user: "Prashant Thakur",
    action: "completed",
    target: "Taskflow Home Page",
    time: "4:41 PM",
    status: "success",
  },
  {
    id: 3,
    user: "Prashant Thakur",
    action: "completed",
    target: "Taskflow Home Page",
    time: "4:41 PM",
    status: "success",
  },
];

export function LiveActivity() {
  const date = new Date();

  const [isExpanded, setIsExpanded] = useState(false);

  const displayedActivity = isExpanded ? activities : activities.slice(0, 3);
  const formattedDate = date.toLocaleDateString("en-GB");

  return (
    <Card className="border-none bg-white/50 backdrop-blur-sm text-neutral-800 ">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-bold uppercase tracking-wider ">
          Live Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-6">
          {/* Vertical Timeline Line */}
          <div className="absolute left-2.75 top-2 h-[calc(100%-16px)] w-[1.5px] bg-neutral-100" />

          {displayedActivity.map((activity) => (
            <div key={activity.id} className="relative flex gap-4 pl-0">
              {/* Timeline Dot */}
              <div className="relative z-10 flex items-center justify-center">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white ring-1 ring-neutral-100">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                </div>
              </div>

              {/* Activity Content */}
              <div className="flex flex-col gap-1 pt-0.5">
                <p className="text-sm leading-none text-neutral-800">
                  <span className="">{activity.user}</span>{" "}
                  <span className="text-neutral-500">{activity.action}</span>{" "}
                  <span className=" text-blue-600 hover:underline cursor-pointer text-xs">
                    {activity.target}
                  </span>
                </p>
                <div className="flex flex-row gap-2 text-[11px]">
                  <time className="text-[11px] font-medium  uppercase tracking-tight">
                    {activity.time}
                  </time>
                  <p>{formattedDate}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-0">
        {activities.length > 3 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="cursor-pointer p-3 w-full text-xs font-semibold text-blue-600  flex items-center justify-center gap-1 transition-all"
          >
            {isExpanded ? (
              <>
                View Less <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                View All ({activities.length - 3} more){" "}
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </CardFooter>
    </Card>
  );
}
