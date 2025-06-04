export default function Loading() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow animate-pulse">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-12"></div>
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
            <div className="flex gap-4">
              <div className="h-10 bg-gray-200 rounded w-64 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {[...Array(6)].map((_, i) => (
                    <th key={i} className="px-6 py-3">
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-200">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}