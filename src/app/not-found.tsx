import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-8xl font-black text-orange-400">404</h1>
          <h2 className="text-2xl font-bold text-white">Page Not Found</h2>
          <p className="text-zinc-500 text-sm">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-black font-semibold px-6 py-3 rounded-lg transition-all duration-300"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 border border-zinc-800 hover:border-orange-500/30 bg-zinc-900 hover:bg-zinc-850 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300"
          >
            <Search className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
