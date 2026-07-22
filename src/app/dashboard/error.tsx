"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex flex-col min-h-screen bg-black text-white items-center justify-center px-4">
      <div className="text-center space-y-5 max-w-sm">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20">
            <AlertTriangle className="h-6 w-6 text-rose-400" />
          </div>
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white">Dashboard failed to load</h2>
          <p className="text-zinc-500 text-xs">
            Could not fetch your session data. Check your connection and try again.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-black font-semibold text-xs px-5 py-2.5 rounded-lg transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
          <button
            onClick={() => router.push("/")}
            className="border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-all"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
