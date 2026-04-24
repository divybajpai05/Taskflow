// src/components/loaders/WorkspaceLoader.tsx

export default function WorkspaceLoader() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse mb-1" />
          <div className="h-4 w-80 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="h-10 w-full max-w-md bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>

      {/* Workspace Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Acme Corp Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div>
                <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
                <div className="h-4 w-16 bg-green-200 dark:bg-green-900/30 rounded-full animate-pulse" />
              </div>
            </div>
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
          </div>

          <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-3 w-4/5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-1">
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>

        {/* StartupHub Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div>
                <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
                <div className="h-4 w-16 bg-green-200 dark:bg-green-900/30 rounded-full animate-pulse" />
              </div>
            </div>
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
          </div>

          <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-1">
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>

        {/* Freelance Projects Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div>
                <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
                <div className="h-4 w-16 bg-green-200 dark:bg-green-900/30 rounded-full animate-pulse" />
              </div>
            </div>
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
          </div>

          <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-3 w-5/6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-1">
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
