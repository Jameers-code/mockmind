"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import ScoreChart from "@/components/ScoreChart";
import SessionList from "@/components/SessionList";
import { Terminal, Activity, Play, RefreshCw } from "lucide-react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

interface SessionData {
  id: string;
  role: string;
  type: string;
  difficulty: string;
  overallScore: number;
  communication: number;
  technicalDepth: number;
  clarity: number;
  confidence: number;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Load and merge database + local storage sessions
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.email) return;

    const fetchSessions = async () => {
      try {
        // 1. Fetch DB sessions
        const res = await fetch("/api/user/sessions");
        const dbData: SessionData[] = res.ok ? await res.json() : [];

        // 2. Fetch local storage sessions
        let localData: SessionData[] = [];
        try {
          const localRaw = localStorage.getItem("grill_local_sessions");
          if (localRaw) {
            localData = JSON.parse(localRaw);
          }
        } catch (e) {
          console.error("Failed to parse local storage sessions", e);
        }

        // 3. Merge sessions (avoiding duplicates based on id or signature)
        const mergedMap = new Map<string, SessionData>();
        
        // Add DB sessions first
        dbData.forEach((s) => mergedMap.set(s.id, s));

        // Add local sessions
        localData.forEach((s) => {
          if (!mergedMap.has(s.id)) {
            mergedMap.set(s.id, s);
          }
        });

        // Convert to array and sort chronologically (newest first)
        const sortedSessions = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setSessions(sortedSessions);
      } catch (err) {
        console.error("Error loading sessions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [status, session]);

  if (status === "loading" || loading) {
    return (
      <div className="flex flex-col min-h-screen bg-black text-white">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <RefreshCw className="h-8 w-8 text-orange-500 animate-spin" />
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Loading dashboard portal...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!session) return null;

  const totalSessions = sessions.length;

  // Compute stats
  const avgScore = totalSessions > 0
    ? Number((sessions.reduce((sum, s) => sum + s.overallScore, 0) / totalSessions).toFixed(1))
    : 0;

  const bestScore = totalSessions > 0
    ? Number(Math.max(...sessions.map((s) => s.overallScore)).toFixed(1))
    : 0;

  // Calculate most practiced role
  let mostPracticedRole = "N/A";
  if (totalSessions > 0) {
    const roleCounts: Record<string, number> = {};
    sessions.forEach((s) => {
      const role = s.role.trim();
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });
    
    let maxCount = 0;
    Object.entries(roleCounts).forEach(([role, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostPracticedRole = role;
      }
    });
  }

  // Chart data: chronological order (oldest to newest), limited to last 10
  const chartData = [...sessions]
    .slice(0, 10)
    .reverse()
    .map((s) => {
      const date = new Date(s.createdAt);
      const name = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return {
        name,
        score: s.overallScore,
      };
    });

  return (
    <div className="flex flex-col min-h-screen bg-black relative text-white">
      <Header />

      <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 relative z-20">
        
        {/* Welcome row */}
        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-orange-400 tracking-wider uppercase">Candidate Portal</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white uppercase">
              Welcome back, {session.user?.name || "Candidate"}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <LogoutButton />
            
            <Link
              href="/setup"
              className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-400 text-black font-semibold text-xs tracking-wider px-6 py-3 rounded-lg shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 transition-all duration-300"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>NEW PRACTICE SESSION</span>
            </Link>
          </div>
        </section>

        {/* Stats Row */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="border border-zinc-900 bg-zinc-950/80 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[110px] shadow-lg">
            <div className="text-[10px] text-zinc-500 font-semibold tracking-wider">TOTAL SESSIONS</div>
            <div className="text-3xl font-black text-white mt-2">{totalSessions}</div>
            <div className="text-[10px] text-zinc-400 font-medium mt-1">Completed runs</div>
          </div>

          {/* Card 2 */}
          <div className="border border-zinc-900 bg-zinc-950/80 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[110px] shadow-lg">
            <div className="text-[10px] text-zinc-500 font-semibold tracking-wider">AVERAGE RATING</div>
            <div className="text-3xl font-black text-orange-400 mt-2">{avgScore.toFixed(1)}</div>
            <div className="text-[10px] text-zinc-400 font-medium mt-1">Out of 10.0</div>
          </div>

          {/* Card 3 */}
          <div className="border border-zinc-900 bg-zinc-950/80 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[110px] shadow-lg">
            <div className="text-[10px] text-zinc-500 font-semibold tracking-wider">BEST RATING</div>
            <div className="text-3xl font-black text-white mt-2">{bestScore.toFixed(1)}</div>
            <div className="text-[10px] text-zinc-400 font-medium mt-1">Record score</div>
          </div>

          {/* Card 4 */}
          <div className="border border-zinc-900 bg-zinc-950/80 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[110px] shadow-lg">
            <div className="text-[10px] text-zinc-500 font-semibold tracking-wider">MOST PRACTICED</div>
            <div className="text-sm font-bold text-white uppercase truncate mt-4 leading-none">
              {mostPracticedRole}
            </div>
            <div className="text-[10px] text-zinc-400 font-medium mt-1">Target pathway</div>
          </div>
        </section>

        {/* Chart Section */}
        <section className="border border-zinc-900 bg-zinc-950/80 rounded-xl p-6 space-y-4 shadow-lg">
          <div className="flex items-center space-x-2 border-b border-zinc-900 pb-3">
            <Activity className="h-4 w-4 text-orange-450" />
            <h3 className="text-xs font-semibold tracking-wider text-white uppercase">Performance Trend (Last 10 Sessions)</h3>
          </div>
          
          <div className="pt-2">
            <ScoreChart data={chartData} />
          </div>
        </section>

        {/* Sessions List */}
        <section className="space-y-4">
          <div className="flex items-center space-x-2">
            <Terminal className="h-4 w-4 text-orange-400" />
            <h3 className="text-xs font-semibold tracking-wider text-white uppercase">Past Simulations History</h3>
          </div>

          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <SessionList sessions={sessions as any[]} />
        </section>

      </main>
    </div>
  );
}
