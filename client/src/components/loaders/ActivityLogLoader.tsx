// src/components/loaders/ActivityLogLoader.tsx

export default function ActivityLogLoader() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-36 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse mb-1" />
          <div className="h-4 w-80 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
          <div className="h-9 w-28 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="h-10 w-full max-w-md bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>

      {/* Section Header */}
      <div className="flex items-center gap-2">
        <div className="h-5 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-5 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
      </div>

      {/* Table */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-5 gap-4 p-4 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
        </div>

        {/* Table Rows */}
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-5 gap-4 p-4 border-b border-gray-200 dark:border-gray-700 last:border-0"
          >
            {/* Timestamp */}
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />

            {/* User (Name + Email) */}
            <div className="space-y-1">
              <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-3 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>

            {/* Action Badge */}
            <div>
              <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            </div>

            {/* Details */}
            <div className="space-y-1">
              <div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              {i === 1 && (
                <div className="h-3 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              )}
            </div>

            {/* IP Address */}
            <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
