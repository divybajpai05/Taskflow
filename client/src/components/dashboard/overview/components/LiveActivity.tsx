// components/dashboard/overview/components/LiveActivity.tsx
import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import apiClient from "@/api/client";

interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  date: string;
  status: string;
}

export function LiveActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchActivities = useCallback(async () => {
    try {
      setIsLoading(true);
      const limit = isExpanded ? 20 : 4;
      const response = await apiClient.get(
        `/dashboard/live-activity?limit=${limit}`,
      );

      if (response.data.success) {
        setActivities(response.data.data);
        console.log(response)
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const displayedActivity = isExpanded ? activities : activities.slice(0, 3);

  // ✅ Helper: Remove user name from action if already present (avoids duplication)
  const formatActivityText = (activity: Activity) => {
    const action = activity.action || "";
    const user = activity.user || "";

    // If action already starts with the user's name, just show the action
    if (action.toLowerCase().startsWith(user.toLowerCase())) {
      return {
        displayUser: null,
        displayAction: action,
      };
    }

    // Otherwise show user + action separately
    return {
      displayUser: user,
      displayAction: action,
    };
  };

  return (
    <Card className="border-none bg-white/50 backdrop-blur-sm text-neutral-800">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-bold uppercase tracking-wider">
          Live Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : activities.length === 0 ? (
          <div className="flex justify-center py-8 text-sm text-muted-foreground">
            No recent activity
          </div>
        ) : (
          <div className="relative space-y-6">
            {displayedActivity.length > 1 && (
              <div className="absolute left-2.75 top-2 h-[calc(100%-16px)] w-[1.5px] bg-neutral-100" />
            )}

            {displayedActivity.map((activity) => {
              const { displayUser, displayAction } =
                formatActivityText(activity);

              return (
                <div key={activity.id} className="relative flex gap-4 pl-0">
                  <div className="relative z-10 flex items-center justify-center">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white ring-1 ring-neutral-100">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          activity.status === "success"
                            ? "bg-green-500 animate-pulse"
                            : activity.status === "error"
                              ? "bg-red-500"
                              : "bg-blue-500 animate-pulse"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 pt-0.5">
                    <p className="text-sm leading-none text-neutral-800">
                      {displayUser && (
                        <span className="font-medium">{displayUser}</span>
                      )}
                      <span
                        className={
                          displayUser
                            ? "text-neutral-500 ml-1"
                            : "text-neutral-700"
                        }
                      >
                        {displayAction}
                      </span>
                      {activity.target && activity.target !== "user" && (
                        <span className="text-blue-600 hover:underline cursor-pointer text-xs ml-1">
                          {activity.target}
                        </span>
                      )}
                    </p>
                    <div className="flex flex-row gap-2 text-[11px]">
                      <time className="text-[11px] font-medium uppercase tracking-tight">
                        {activity.time}
                      </time>
                      <p className="text-muted-foreground">{activity.date}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      {activities.length > 3 && (
        <CardFooter className="p-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="cursor-pointer p-3 w-full text-xs font-semibold text-blue-600 flex items-center justify-center gap-1 transition-all"
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
        </CardFooter>
      )}
    </Card>
  );
}
