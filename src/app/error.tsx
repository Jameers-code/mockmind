"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-4">
      <div className="text-center space-y-6 max-w-md w-full">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <AlertTriangle className="h-8 w-8 text-rose-400" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
          <p className="text-zinc-500 text-sm leading-relaxed">
            An unexpected error occurred. This has been noted.
            Try refreshing the page or return home.
          </p>
          {error?.digest && (
            <p className="text-[11px] text-zinc-600 font-mono mt-2">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-black font-semibold px-6 py-3 rounded-lg transition-all duration-300"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 border border-zinc-800 hover:border-orange-500/30 bg-zinc-900 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
