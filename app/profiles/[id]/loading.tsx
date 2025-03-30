export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 animate-pulse">
          <div className="flex items-start justify-between">
            <div>
              <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
              <div className="h-6 w-48 bg-gray-200 rounded"></div>
            </div>
            <div className="text-right">
              <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 w-16 bg-gray-200 rounded"></div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                    <div className="h-6 w-full bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i}>
                    <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                    <div className="h-6 w-full bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
            <div className="h-24 w-full bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
} 