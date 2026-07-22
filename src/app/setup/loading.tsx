import { Cpu } from "lucide-react";

export default function SetupLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-background relative bg-grid-pattern">
      {/* Header skeleton */}
      <div className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse" />
        </div>
      </div>

      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-2xl border border-zinc-800 bg-[#18181b] rounded-xl p-6 sm:p-8 shadow-xl space-y-6">
          {/* Header row */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center space-x-2">
              <Cpu className="h-5 w-5 text-indigo-400 animate-pulse" />
              <div className="h-4 w-48 bg-zinc-800 rounded animate-pulse" />
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 rounded-full bg-indigo-600/40 animate-pulse" />
              <div className="w-4 h-[1px] bg-zinc-800" />
              <div className="h-6 w-6 rounded-full bg-zinc-800 animate-pulse" />
            </div>
          </div>

          {/* Fields skeleton */}
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="h-3 w-32 bg-zinc-800 rounded animate-pulse" />
              <div className="h-10 w-full bg-zinc-900 rounded-lg animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-40 bg-zinc-800 rounded animate-pulse" />
              <div className="h-24 w-full bg-zinc-900 rounded-lg animate-pulse" />
              <div className="h-36 w-full bg-zinc-900 rounded-lg animate-pulse" />
            </div>
            <div className="h-12 w-full bg-indigo-600/30 rounded-lg animate-pulse" />
          </div>
        </div>
      </main>
    </div>
  );
}
