// src/components/loaders/HRCalendarLoader.tsx

export default function HRCalendarLoader() {
  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div>
        <div className="h-7 w-40 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse mb-1" />
        <div className="h-4 w-80 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>

      {/* Month Header */}
      <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />

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

        {/* Row 1 (Mar 29 - Apr 4) */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {[29, 30, 31, 1, 2, 3, 4].map((day, i) => (
            <div
              key={`row1-${i}`}
              className="min-h-28 p-2 border-r border-gray-200 dark:border-gray-700 last:border-r-0"
            >
              <div className="h-5 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              {i === 5 && ( // Good Friday holiday on Apr 3
                <div className="space-y-1">
                  <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Row 2 (Apr 5 - Apr 11) */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {[5, 6, 7, 8, 9, 10, 11].map((day, i) => (
            <div
              key={`row2-${i}`}
              className="min-h-28 p-2 border-r border-gray-200 dark:border-gray-700 last:border-r-0"
            >
              <div className="h-5 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Row 3 (Apr 12 - Apr 18) */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {[12, 13, 14, 15, 16, 17, 18].map((day, i) => (
            <div
              key={`row3-${i}`}
              className="min-h-28 p-2 border-r border-gray-200 dark:border-gray-700 last:border-r-0"
            >
              <div className="h-5 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              {i === 3 && ( // Daily Attendance card on Apr 15
                <div className="bg-gray-50 dark:bg-gray-900/30 rounded p-2 space-y-1">
                  <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="space-y-0.5">
                    <div className="flex justify-between">
                      <div className="h-2 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-2 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                    <div className="flex justify-between">
                      <div className="h-2 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-2 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                    <div className="flex justify-between">
                      <div className="h-2 w-14 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-2 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                    <div className="flex justify-between">
                      <div className="h-2 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-2 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              )}
              {i === 4 && ( // Daily Attendance card on Apr 16
                <div className="bg-gray-50 dark:bg-gray-900/30 rounded p-2 space-y-1 mt-1">
                  <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="space-y-0.5">
                    {[...Array(5)].map((_, j) => (
                      <div key={j} className="flex justify-between">
                        <div className="h-2 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-2 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {i === 5 && ( // Low Attendance Alert on Apr 17
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded p-2 space-y-1 mt-1">
                  <div className="h-3 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="space-y-0.5">
                    {[...Array(5)].map((_, j) => (
                      <div key={j} className="flex justify-between">
                        <div className="h-2 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-2 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {i === 6 && ( // New Joiner & Sick Leave on Apr 18
                <div className="space-y-1 mt-1">
                  <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Row 4 (Apr 19 - Apr 25) */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {[19, 20, 21, 22, 23, 24, 25].map((day, i) => (
            <div
              key={`row4-${i}`}
              className="min-h-28 p-2 border-r border-gray-200 dark:border-gray-700 last:border-r-0"
            >
              <div className="h-5 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              {i === 0 && ( // Rahul Sharma leave on Apr 19
                <div className="space-y-1">
                  <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              )}
              {i === 3 && ( // Cyber Security Training on Apr 22
                <div className="mt-1">
                  <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Row 5 (Apr 26 - May 2) */}
        <div className="grid grid-cols-7">
          {[26, 27, 28, 29, 30, 1, 2].map((day, i) => (
            <div
              key={`row5-${i}`}
              className="min-h-28 p-2 border-r border-gray-200 dark:border-gray-700 last:border-r-0"
            >
              <div className="h-5 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              {i === 0 && ( // Q2 Performance Reviews on Apr 26
                <div className="mt-1 space-y-1">
                  <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legend / Footer */}
      <div className="flex flex-wrap items-center gap-4 pt-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
