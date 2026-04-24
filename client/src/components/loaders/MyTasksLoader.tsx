// src/components/loaders/MyTasksLoader.tsx

export default function MyTasksLoader() {
  return (
    <div className="p-6 space-y-4">
      {/* Header with title and task count */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
        <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="h-10 w-full max-w-md bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>

      {/* Table */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-6 gap-4 p-4 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="h-4 w-12 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
        </div>

        {/* Table Rows */}
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-6 gap-4 p-4 border-b border-gray-200 dark:border-gray-700 last:border-0"
          >
            {/* Task Name */}
            <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />

            {/* Team */}
            <div>
              <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            </div>

            {/* Priority Badge */}
            <div>
              <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            </div>

            {/* Status Badge */}
            <div>
              <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            </div>

            {/* Assignees (Avatar Group) */}
            <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 ring-2 ring-white dark:ring-gray-800 animate-pulse" />
              <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 ring-2 ring-white dark:ring-gray-800 animate-pulse" />
              <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 ring-2 ring-white dark:ring-gray-800 animate-pulse" />
              <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 ring-2 ring-white dark:ring-gray-800 animate-pulse flex items-center justify-center">
                <div className="h-3 w-3 bg-gray-300 dark:bg-gray-600 rounded" />
              </div>
            </div>

            {/* Due Date */}
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
