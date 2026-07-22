import { RefreshCw } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Header skeleton */}
      <div className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse" />
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 bg-zinc-800 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-8 w-8 text-orange-500 animate-spin" />
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Loading dashboard...</p>
        </div>
      </main>
    </div>
  );
}
