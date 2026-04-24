// src/components/loaders/TeamsLoader.tsx

export default function TeamsLoader() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse mb-1" />
        <div className="h-4 w-80 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="h-10 w-full max-w-md bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Engineering Team Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-3 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>

          {/* Member Avatars */}
          <div className="flex items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
              <div className="h-3 w-3 bg-gray-300 dark:bg-gray-600 rounded" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
            <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
          </div>
        </div>

        {/* Marketing Team Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-3 w-44 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-3 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>

          {/* Member Avatars */}
          <div className="flex items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
            <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
          </div>
        </div>

        {/* HR & People Team Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-3 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>

          {/* Member Avatars */}
          <div className="flex items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
            <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
          </div>
        </div>
      </div>

      {/* Create New Team Button */}
      <div className="flex justify-center pt-4">
        <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
      </div>
    </div>
  );
}
