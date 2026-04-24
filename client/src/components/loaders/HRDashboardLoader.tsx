// src/components/loaders/HRDashboardLoader.tsx

export default function HRDashboardLoader() {
  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse mb-1" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>

      {/* Employee Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Employees */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
          <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        {/* Active Employees */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
          <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        {/* On Leave */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        {/* Present Today */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        {/* Absent Today */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        {/* New Hires */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
          <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />

          {/* Horizontal Bar Chart */}
          <div className="space-y-4">
            {[
              "Design",
              "Engineering",
              "Finance",
              "HR",
              "Marketing",
              "Sales",
            ].map((dept, i) => (
              <div key={dept} className="flex items-center gap-3">
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="flex-1">
                  <div
                    className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                    style={{ width: `${[45, 85, 30, 25, 55, 60][i]}%` }}
                  />
                </div>
                <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Attendance Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
          <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />

          {/* Line Chart Skeleton */}
          <div className="relative h-48">
            <svg
              className="w-full h-full"
              viewBox="0 0 400 150"
              preserveAspectRatio="none"
            >
              <polyline
                points="0,80 40,75 80,85 120,70 160,65 200,60 240,55 280,50 320,45 360,40 400,35"
                className="stroke-gray-200 dark:stroke-gray-700 fill-none stroke-2"
              />
            </svg>

            {/* X-axis labels */}
            <div className="flex justify-between mt-2">
              {[
                "Mar 8",
                "Mar 9",
                "Mar 10",
                "Mar 11",
                "Mar 12",
                "Mar 13",
                "Mar 14",
                "Mar 15",
                "Mar 16",
                "Mar 17",
              ].map((date) => (
                <div
                  key={date}
                  className="h-3 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                />
              ))}
            </div>

            {/* Today indicator */}
            <div className="flex items-center gap-2 mt-2">
              <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-3 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
          <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6" />

          {/* Donut Chart with Legend */}
          <div className="flex items-center gap-6">
            <div className="relative w-36 h-36">
              <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-white dark:bg-gray-800" />
            </div>

            <div className="flex-1 space-y-3">
              {["Vacation", "Sick", "Personal"].map((type) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recruitment Pipeline */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <div className="h-5 w-44 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />

          {/* Funnel Chart */}
          <div className="space-y-3">
            {[
              { label: "Applied", width: 100 },
              { label: "Screened", width: 75 },
              { label: "Interviewed", width: 50 },
              { label: "Offered", width: 25 },
            ].map((stage, i) => (
              <div key={stage.label} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div
                  className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                  style={{ width: `${stage.width}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
