// src/components/loaders/CalendarLoader.tsx

export default function CalendarLoader() {
  return (
    <div className="p-6 space-y-4">
      {/* Header with Today and Month */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
        </div>
      </div>

      {/* View Toggle (Month/Week/Day) */}
      <div className="flex items-center gap-2">
        <div className="h-9 w-16 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
        <div className="h-9 w-16 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
        <div className="h-9 w-16 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
      </div>

      {/* Calendar Grid */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-3 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0"
            >
              <div className="h-4 w-8 mx-auto bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Calendar Cells */}
        <div className="grid grid-cols-7">
          {/* Row 1 */}
          {[29, 30, 31, 1, 2, 3, 4].map((day, i) => (
            <div
              key={`row1-${i}`}
              className="h-28 p-2 border-b border-r border-gray-200 dark:border-gray-700"
            >
              <div className="h-5 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}

          {/* Row 2 */}
          {[5, 6, 7, 8, 9, 10, 11].map((day, i) => (
            <div
              key={`row2-${i}`}
              className="h-28 p-2 border-b border-r border-gray-200 dark:border-gray-700"
            >
              <div className="h-5 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}

          {/* Row 3 */}
          {[12, 13, 14, 15, 16, 17, 18].map((day, i) => (
            <div
              key={`row3-${i}`}
              className="h-28 p-2 border-b border-r border-gray-200 dark:border-gray-700"
            >
              <div className="h-5 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}

          {/* Row 4 */}
          {[19, 20, 21, 22, 23, 24, 25].map((day, i) => (
            <div
              key={`row4-${i}`}
              className="h-28 p-2 border-b border-r border-gray-200 dark:border-gray-700"
            >
              <div className="h-5 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}

          {/* Row 5 */}
          {[26, 27, 28, 29, 30, 1, 2].map((day, i) => (
            <div
              key={`row5-${i}`}
              className="h-28 p-2 border-r border-gray-200 dark:border-gray-700"
            >
              <div className="h-5 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
