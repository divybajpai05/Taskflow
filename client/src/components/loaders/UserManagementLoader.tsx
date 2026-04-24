// src/components/loaders/UserManagementLoader.tsx

export default function UserManagementLoader() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-44 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse mb-1" />
          <div className="h-4 w-72 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="h-10 w-full max-w-md bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>

      {/* Section Header */}
      <div className="flex items-center gap-2">
        <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-5 w-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
      </div>

      {/* Table */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-6 gap-4 p-4 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="h-4 w-12 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          <div className="h-4 w-12 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
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
            {/* User (Avatar + Name + Email) */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
                <div className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded" />
              </div>
              <div className="space-y-1">
                <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-3 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>

            {/* Role Badge */}
            <div className="flex items-center">
              <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            </div>

            {/* Team */}
            <div className="flex items-center">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>

            {/* Joined Date */}
            <div className="flex items-center">
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>

            {/* Permissions Count */}
            <div className="flex items-center">
              <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end">
              <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
