"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, Cpu, ChevronRight } from "lucide-react";

interface DbSession {
  id: string;
  role: string;
  type: string;
  difficulty: string;
  overallScore: number;
  communication: number;
  technicalDepth: number;
  clarity: number;
  confidence: number;
  questions: unknown; // Stored Q&A array
  strengths: unknown; // Stored strengths array
  improvements: unknown; // Stored improvements array
  createdAt: string | Date;
}

export default function SessionList({ sessions }: { sessions: DbSession[] }) {
  const router = useRouter();

  const handleSessionClick = (session: DbSession) => {
    // Populate session storage with old session values
    sessionStorage.setItem("grill_jobRole", session.role);
    sessionStorage.setItem("grill_difficulty", session.difficulty);
    sessionStorage.setItem("grill_interviewType", session.type);
    
    // Storing past Q&A
    const questionsList = typeof session.questions === "string" 
      ? JSON.parse(session.questions) 
      : session.questions;
    sessionStorage.setItem("grill_answers", JSON.stringify(questionsList));

    // Construct cached report
    const reportData = {
      overallScore: session.overallScore,
      communication: session.communication,
      technicalDepth: session.technicalDepth,
      clarity: session.clarity,
      confidence: session.confidence,
      strengths: typeof session.strengths === "string" ? JSON.parse(session.strengths) : session.strengths,
      improvements: typeof session.improvements === "string" ? JSON.parse(session.improvements) : session.improvements,
    };
    sessionStorage.setItem("grill_cachedReport", JSON.stringify(reportData));

    router.push("/results");
  };

  const getScoreBadgeStyles = (score: number) => {
    if (score >= 7.0) {
      return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
    } else if (score >= 5.0) {
      return "bg-amber-500/10 border-amber-500/20 text-amber-400";
    } else {
      return "bg-rose-500/10 border-rose-500/20 text-rose-450";
    }
  };

  const formatDate = (dateValue: string | Date) => {
    const date = new Date(dateValue);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  if (sessions.length === 0) {
    return (
      <div className="border border-zinc-800 bg-[#09090b]/80 backdrop-blur-xl rounded-xl p-12 text-center">
        <span className="text-xs text-zinc-500 block mb-4">No completed practice runs found</span>
        <button
          onClick={() => router.push("/setup")}
          className="bg-indigo-600 hover:bg-indigo-700 px-6 py-2.5 rounded-lg text-xs font-semibold text-white transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20"
        >
          Initialize First Session
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sessions.map((session, index) => (
        <motion.div
          key={session.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          onClick={() => handleSessionClick(session)}
          className="border border-zinc-800 bg-[#09090b]/80 backdrop-blur-xl hover:bg-zinc-900/40 hover:border-indigo-500/30 rounded-xl p-5 flex justify-between items-center cursor-pointer transition-all duration-300 group shadow-md"
        >
          <div className="space-y-2 max-w-[70%]">
            <h4 className="font-semibold text-white uppercase text-sm truncate group-hover:text-indigo-400 transition-colors font-sans">
              {session.role}
            </h4>
            
            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[10px] text-zinc-500 font-medium">
              <span className="flex items-center">
                <Calendar className="h-3 w-3 mr-1 text-zinc-650" />
                {formatDate(session.createdAt)}
              </span>
              <span className="flex items-center">
                <Cpu className="h-3 w-3 mr-1 text-zinc-650" />
                {session.difficulty}
              </span>
              <span className="border border-zinc-800 bg-zinc-900/50 px-2 py-0.5 rounded-md text-[9px] text-zinc-400">
                {session.type}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Score pill */}
            <div className={`border text-xs font-bold px-3 py-1.5 rounded-lg ${getScoreBadgeStyles(session.overallScore)}`}>
              {session.overallScore.toFixed(1)}
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-700 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
