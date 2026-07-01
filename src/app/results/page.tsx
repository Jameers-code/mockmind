"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { RefreshCw, Plus, Share2, Check, AlertCircle } from "lucide-react";
import Header from "@/components/Header";

interface AnsweredQuestion {
  question: string;
  answer: string;
  score: number;
  feedback: string;
  idealAnswer: string;
}

interface FinalReport {
  overallScore: number;
  communication: number;
  technicalDepth: number;
  clarity: number;
  confidence: number;
  strengths: string[];
  improvements: string[];
  id?: string; // Saved session ID
}

// CountUp component
function CountUpScore({ score }: { score: number }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = score;
    const duration = 1200; // 1.2s
    const step = 30;
    const steps = duration / step;
    const increment = end / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCurrent(end);
        clearInterval(timer);
      } else {
        setCurrent(Number(start.toFixed(1)));
      }
    }, step);

    return () => clearInterval(timer);
  }, [score]);

  return <span>{current.toFixed(1)}</span>;
}

export default function ResultsPage() {
  const router = useRouter();

  const [answersList, setAnswersList] = useState<AnsweredQuestion[]>([]);
  const [jobRole, setJobRole] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [interviewType, setInterviewType] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<FinalReport | null>(null);

  useEffect(() => {
    const storedAnswers = sessionStorage.getItem("grill_answers");
    const storedRole = sessionStorage.getItem("grill_jobRole");
    const storedDiff = sessionStorage.getItem("grill_difficulty");
    const storedType = sessionStorage.getItem("grill_interviewType");

    if (!storedAnswers || !storedRole) {
      toast.error("NO INTERVIEW DATA FOUND. REDIRECTING...");
      router.push("/setup");
      return;
    }

    const parsedAnswers = JSON.parse(storedAnswers);
    setAnswersList(parsedAnswers);
    setJobRole(storedRole);
    setDifficulty(storedDiff || "Mid");
    setInterviewType(storedType || "Mixed");

    // Check if we already have a cached report in sessionStorage (e.g. from Dashboard or previous page load)
    const cachedReport = sessionStorage.getItem("grill_cachedReport");
    if (cachedReport) {
      try {
        setReport(JSON.parse(cachedReport));
        setLoading(false);
        return;
      } catch (e) {
        console.error("Failed to parse cached report", e);
      }
    }

    // Fetch report from API
    const fetchReport = async () => {
      try {
        const apiKey = localStorage.getItem("grill_api_key") || "";
        const apiProvider = localStorage.getItem("grill_ai_provider") || "groq";

        const response = await fetch("/api/generate-report", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "x-ai-provider": apiProvider
          },
          body: JSON.stringify({
            answersList: parsedAnswers,
            jobRole: storedRole,
            difficulty: storedDiff || "Mid",
            interviewType: storedType || "Mixed",
          }),
        });

        if (!response.ok) {
          throw new Error("Report generation failed");
        }

        const data = await response.json();
        setReport(data);
        
        // Cache report to sessionStorage
        sessionStorage.setItem("grill_cachedReport", JSON.stringify(data));

        // Save to localStorage for persistent dashboard display (read-only database bypass)
        try {
          const localSessionsRaw = localStorage.getItem("grill_local_sessions");
          const localSessions = localSessionsRaw ? JSON.parse(localSessionsRaw) : [];
          
          // Avoid duplicates
          const isDuplicate = localSessions.some((s: {
            id: string;
            role: string;
            overallScore: number;
            createdAt: string;
          }) => 
            s.id === data.id || 
            (s.role === storedRole && Math.abs(s.overallScore - data.overallScore) < 0.01 && Date.now() - new Date(s.createdAt).getTime() < 20000)
          );
          
          if (!isDuplicate) {
            localSessions.push({
              id: data.id || `local-${Date.now()}`,
              role: storedRole,
              type: storedType || "Mixed",
              difficulty: storedDiff || "Mid",
              overallScore: data.overallScore,
              communication: data.communication,
              technicalDepth: data.technicalDepth,
              clarity: data.clarity,
              confidence: data.confidence,
              createdAt: new Date().toISOString()
            });
            localStorage.setItem("grill_local_sessions", JSON.stringify(localSessions));
          }
        } catch (e) {
          console.error("Failed to save local session to localStorage", e);
        }
        
        setLoading(false);
        toast.success("PERFORMANCE REPORT GENERATED");
      } catch (err) {
        console.error(err);
        toast.error("ERROR GENERATING PERFORMANCE REPORT. RETRYING...");
      }
    };

    fetchReport();
  }, [router]);

  const handleShare = () => {
    if (!report) return;
    const summary = `GrillAI Interview Report - ${jobRole} (${difficulty})
Overall Score: ${report.overallScore}/10
- Communication: ${report.communication}/10
- Technical Depth: ${report.technicalDepth}/10
- Clarity: ${report.clarity}/10
- Confidence: ${report.confidence}/10

Strengths:
1. ${report.strengths[0]}
2. ${report.strengths[1]}

Practice your interviews at GrillAI!`;

    navigator.clipboard.writeText(summary);
    toast.success("SUMMARY COPIED TO CLIPBOARD");
  };

  const handleTryAgain = () => {
    // Keep configurations, clear answers and restart
    sessionStorage.setItem("grill_answers", JSON.stringify([]));
    sessionStorage.removeItem("grill_cachedReport");
    toast.success("RE-INITIALIZING SIMULATOR...");
    router.push("/setup");
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background relative text-white bg-grid-pattern">
        <Header />
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

  const scoreLabel = report ? report.overallScore : 0;

  return (
    <div className="flex flex-col min-h-screen bg-background relative text-white bg-grid-pattern">
      <Header />

      <main className="flex-grow max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 relative z-20">
        
        {/* Top Section: Score Breakdown */}
        <section className="border border-zinc-800 bg-[#18181b] rounded-xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden shadow-sm">
          <div className="text-center md:text-left space-y-2">
            <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg uppercase">
              Session Completed
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white uppercase mt-2">
              {jobRole}
            </h2>
            <p className="text-xs text-zinc-500 font-medium">
              Difficulty: {difficulty} | Style: {interviewType}
            </p>
          </div>

          {/* Big overall score */}
          <div className="flex flex-col items-center justify-center border border-zinc-800 bg-zinc-950/40 rounded-xl px-8 py-6 min-w-[200px]">
            <span className="text-[10px] text-zinc-500 font-semibold tracking-wider mb-1">OVERALL RATING</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-5xl font-black text-white tracking-tight">
                <CountUpScore score={scoreLabel} />
              </span>
              <span className="text-zinc-550 text-lg">/ 10</span>
            </div>
          </div>
        </section>

        {/* Competency Metric Progress Bars */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-zinc-800 bg-[#18181b] rounded-xl p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-semibold tracking-wider text-indigo-400 border-b border-zinc-850 pb-2 uppercase">Competency Matrix</h3>
            
            <div className="space-y-4 text-xs font-medium">
              {/* Comm */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-300">
                  <span>Communication</span>
                  <span>{report?.communication}/10</span>
                </div>
                <div className="w-full bg-zinc-850 h-2 rounded overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(report?.communication || 0) * 10}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="bg-indigo-500 h-full"
                  />
                </div>
              </div>

              {/* Tech Depth */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-300">
                  <span>Technical Depth</span>
                  <span>{report?.technicalDepth}/10</span>
                </div>
                <div className="w-full bg-zinc-850 h-2 rounded overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(report?.technicalDepth || 0) * 10}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.1, ease: "easeOut" }}
                    className="bg-indigo-500 h-full"
                  />
                </div>
              </div>

              {/* Clarity */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-300">
                  <span>Clarity of Thought</span>
                  <span>{report?.clarity}/10</span>
                </div>
                <div className="w-full bg-zinc-850 h-2 rounded overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(report?.clarity || 0) * 10}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                    className="bg-indigo-500 h-full"
                  />
                </div>
              </div>

              {/* Confidence */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-300">
                  <span>Confidence</span>
                  <span>{report?.confidence}/10</span>
                </div>
                <div className="w-full bg-zinc-850 h-2 rounded overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(report?.confidence || 0) * 10}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                    className="bg-indigo-500 h-full"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Quick Actions */}
          <div className="border border-zinc-800 bg-[#18181b] rounded-xl p-6 flex flex-col justify-between space-y-6 shadow-sm">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold tracking-wider text-indigo-400 border-b border-zinc-850 pb-2 uppercase">Actions</h3>
              <p className="text-zinc-500 text-xs leading-relaxed font-medium">
                Copy the compiled report summary to share or restart another custom simulation to improve your scoring parameters.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-medium">
              <button
                onClick={handleShare}
                className="flex items-center justify-center space-x-2 border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 px-4 py-3 rounded-lg text-white transition-all duration-200"
              >
                <Share2 className="h-4 w-4 text-zinc-450" />
                <span>Copy Summary</span>
              </button>

              <button
                onClick={handleTryAgain}
                className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg transition-all duration-205"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </button>

              <button
                onClick={() => router.push("/setup")}
                className="col-span-1 sm:col-span-2 flex items-center justify-center space-x-2 border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 px-4 py-3 rounded-lg text-white transition-all duration-200"
              >
                <Plus className="h-4 w-4 text-zinc-450" />
                <span>New Simulation Profile</span>
              </button>
            </div>
          </div>
        </section>

        {/* Strengths & Improvements */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="border border-zinc-800 bg-[#18181b] rounded-xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center space-x-2 text-emerald-400 border-b border-zinc-850 pb-2">
              <Check className="h-4 w-4" />
              <h3 className="text-xs font-semibold tracking-wider uppercase text-zinc-200">Key Strengths</h3>
            </div>
            <ul className="space-y-3 text-xs text-zinc-300">
              {report?.strengths.map((str, idx) => (
                <li key={idx} className="flex items-start space-x-2 leading-relaxed">
                  <span className="text-emerald-450 font-bold select-none">✓</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Improvements */}
          <div className="border border-zinc-800 bg-[#18181b] rounded-xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center space-x-2 text-rose-400 border-b border-zinc-850 pb-2">
              <AlertCircle className="h-4 w-4" />
              <h3 className="text-xs font-semibold tracking-wider uppercase text-zinc-200">Areas to Improve</h3>
            </div>
            <ul className="space-y-3 text-xs text-zinc-300">
              {report?.improvements.map((imp, idx) => (
                <li key={idx} className="flex items-start space-x-2 leading-relaxed">
                  <span className="text-rose-450 font-bold select-none">!</span>
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Detailed Question breakdown */}
        <section className="space-y-4">
          <h3 className="text-xs font-semibold tracking-wider text-indigo-400 uppercase">Detailed Feedback Logs</h3>

          <div className="space-y-6">
            {answersList.map((item, idx) => (
              <div key={idx} className="border border-zinc-800 bg-[#18181b] rounded-xl p-6 space-y-4 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 bg-zinc-900 border-b border-l border-zinc-800 px-3 py-1 text-[10px] text-zinc-400 rounded-bl font-semibold">
                  SCORE: {item.score?.toFixed(1)} / 10
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-550 font-bold tracking-wider">QUESTION 0{idx + 1}</span>
                  <p className="text-white font-semibold text-sm sm:text-base pr-20 font-sans">{item.question}</p>
                </div>

                <div className="space-y-1 border-t border-zinc-800/60 pt-3">
                  <span className="text-[10px] text-indigo-400 font-bold tracking-wider font-sans">CANDIDATE RESPONSE</span>
                  <p className="text-zinc-350 text-xs leading-relaxed italic bg-zinc-950/40 p-3 rounded-lg border border-zinc-850/30">
                    &ldquo;{item.answer}&rdquo;
                  </p>
                </div>

                <div className="space-y-1 border-t border-zinc-800/60 pt-3">
                  <span className="text-[10px] text-zinc-450 font-bold tracking-wider font-sans">AI EVALUATION SUMMARY</span>
                  <p className="text-zinc-350 text-xs leading-relaxed font-sans">
                    {item.feedback}
                  </p>
                </div>

                <div className="space-y-1 border-t border-zinc-800/60 pt-3">
                  <span className="text-[10px] text-zinc-500 font-bold tracking-wider font-sans">EXPECTED MODEL RESPONSE</span>
                  <p className="text-zinc-400 text-xs leading-relaxed bg-indigo-500/5 border border-indigo-500/10 p-3 rounded-lg font-sans">
                    {item.idealAnswer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
