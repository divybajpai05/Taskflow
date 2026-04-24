// src/components/loaders/KanbanBoardLoader.tsx

export default function KanbanBoardLoader() {
  return (
    <div className="p-6 space-y-4">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse mb-1" />
          <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>

      {/* Kanban Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {/* HR Column */}
        <div className="flex-shrink-0 w-80">
          {/* Column Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            </div>
            <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>

          {/* Todo Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-5 w-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            </div>
            <div className="h-20 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 animate-pulse" />
          </div>

          {/* In Progress Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-5 w-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            </div>

            {/* Task Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
              {/* Priority Badge */}
              <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />

              {/* Task Title */}
              <div className="h-5 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />

              {/* Task Description */}
              <div className="space-y-1">
                <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-3 w-4/5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>

              {/* Due Date */}
              <div className="flex items-center gap-2 pt-2">
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* On Hold Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-5 w-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            </div>
            <div className="h-20 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 animate-pulse" />
          </div>

          {/* Done Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-5 w-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            </div>
            <div className="h-20 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 animate-pulse" />
          </div>
        </div>

        {/* Additional Column Hint (collapsed) */}
        <div className="flex-shrink-0 w-80 opacity-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-5 w-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="h-20 bg-gray-100 dark:bg-gray-800/50 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
