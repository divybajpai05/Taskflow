import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
];

export function LiveActivity() {
  return (
    <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm text-neutral-800">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-bold uppercase tracking-wider ">
          Live Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-6">
          {/* Vertical Timeline Line */}
          <div className="absolute left-2.75 top-2 h-[calc(100%-16px)] w-[1.5px] bg-neutral-100" />

          {activities.map((activity, index) => (
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
                  <span className=" text-blue-600 hover:underline cursor-pointer">
                    {activity.target}
                  </span>
                </p>
                <time className="text-[11px] font-medium text-neutral-400 uppercase tracking-tight">
                  {activity.time}
                </time>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
