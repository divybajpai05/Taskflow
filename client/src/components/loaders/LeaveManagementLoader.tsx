// src/components/loaders/LeaveManagementLoader.tsx

export default function LeaveManagementLoader() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse mb-1" />
        <div className="h-4 w-72 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="h-9 w-28 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
        <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
        <div className="h-9 w-28 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
        <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
        <div className="h-9 w-20 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
        <div className="h-9 w-20 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Requests */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        {/* Pending */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        {/* Approved */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        {/* Rejected */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>

      {/* Table */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-6 gap-4 p-4 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
        </div>

        {/* Table Rows */}
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-6 gap-4 p-4 border-b border-gray-200 dark:border-gray-700 last:border-0"
          >
            {/* Employee (Name + Department) */}
            <div className="space-y-1">
              <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>

            {/* Leave Type */}
            <div>
              <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            </div>

            {/* Duration */}
            <div className="space-y-1">
              <div className="h-3 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>

            {/* Reason */}
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />

            {/* Status Badge */}
            <div>
              <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination & Footer */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
      </div>
    </div>
  );
}
