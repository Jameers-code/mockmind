import { RefreshCw } from "lucide-react";

export default function ResultsLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-background relative text-white bg-grid-pattern">
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
        <div className="w-full max-w-md border border-zinc-800 bg-[#18181b] rounded-xl p-8 shadow-lg text-center space-y-4">
          <RefreshCw className="h-6 w-6 text-indigo-500 animate-spin mx-auto" />
          <h3 className="text-sm font-semibold tracking-wide text-white">Evaluating Performance...</h3>
          <div className="text-zinc-500 space-y-1 text-xs font-medium font-sans">
            <div>Analyzing candidate answers...</div>
            <div>Computing metric scores (depth, clarity)...</div>
            <div>Compiling specific feedback logs...</div>
          </div>
          <div className="w-full bg-zinc-850 h-[3px] rounded overflow-hidden mt-4">
            <div className="bg-indigo-500 h-full animate-[loading_4s_ease-in-out_infinite]" style={{ width: "60%" }} />
          </div>
        </div>
      </main>
    </div>
  );
}
