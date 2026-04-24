// src/components/loaders/AnalyticsLoader.tsx

export default function AnalyticsLoader() {
  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse mb-1" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Tasks Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          <div className="flex items-end justify-between">
            <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 bg-green-200 dark:bg-green-900/30 rounded animate-pulse" />
              <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-3 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1" />
        </div>

        {/* Completed Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          <div className="flex items-end justify-between">
            <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 bg-green-200 dark:bg-green-900/30 rounded animate-pulse" />
              <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-3 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1" />
        </div>

        {/* Overdue Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          <div className="h-10 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1" />
        </div>

        {/* On-Time Completion Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          <div className="flex items-end justify-between">
            <div className="h-10 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 bg-green-200 dark:bg-green-900/30 rounded animate-pulse" />
              <div className="h-4 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1" />
        </div>

        {/* Avg Completion Time Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          <div className="flex items-end justify-between">
            <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 bg-red-200 dark:bg-red-900/30 rounded animate-pulse" />
              <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-3 w-44 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1" />
        </div>

        {/* In Progress Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          <div className="h-10 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-3 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-700">
        {["Overview", "Team Performance", "Task Details", "Insights"].map(
          (tab) => (
            <div
              key={tab}
              className="h-9 w-28 bg-gray-200 dark:bg-gray-700 rounded-t-lg animate-pulse"
            />
          ),
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Completion Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
          <div className="h-3 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6" />

          {/* Line Chart Skeleton */}
          <div className="relative h-64">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between">
              {[32, 24, 16, 8, 0].map((val) => (
                <div
                  key={val}
                  className="h-3 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                />
              ))}
            </div>

            {/* Chart Area */}
            <div className="ml-8 h-full">
              <svg
                className="w-full h-full"
                viewBox="0 0 400 200"
                preserveAspectRatio="none"
              >
                <polyline
                  points="0,150 50,130 100,120 150,100 200,90 250,80 300,70 350,60 400,50"
                  className="stroke-gray-200 dark:stroke-gray-700 fill-none stroke-2"
                />
                <polyline
                  points="0,180 50,170 100,160 150,140 200,130 250,120 300,110 350,100 400,90"
                  className="stroke-gray-300 dark:stroke-gray-600 fill-none stroke-2"
                />
              </svg>
            </div>

            {/* X-axis labels */}
            <div className="ml-8 flex justify-between mt-2">
              {[
                "Mar 29",
                "Mar 30",
                "Mar 31",
                "Apr 1",
                "Apr 2",
                "Apr 3",
                "Apr 4",
                "Apr 5",
                "Apr 6",
              ].map((date) => (
                <div
                  key={date}
                  className="h-3 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
          <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6" />

          {/* Donut Chart Skeleton */}
          <div className="flex items-center gap-4">
            <div className="relative w-32 h-32">
              <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-white dark:bg-gray-800" />
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1 ml-5" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1 ml-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Priority Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
        <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {["Low", "Medium", "High", "Urgent"].map((priority) => (
            <div key={priority} className="space-y-2">
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
