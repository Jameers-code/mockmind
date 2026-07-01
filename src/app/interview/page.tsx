"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { Terminal, Send, AlertTriangle, Code2, Clock } from "lucide-react";
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const LANGUAGE_MAP: Record<string, string> = {
  "JavaScript": "javascript",
  "TypeScript": "typescript",
  "Python": "python",
  "Java": "java",
  "C++": "cpp",
  "Go": "go",
  "SQL": "sql",
};

const STARTER_TEMPLATES: Record<string, string> = {
  "JavaScript": "// Write your solution here\nfunction solution() {\n  \n}\n",
  "TypeScript": "// Write your solution here\nfunction solution(): void {\n  \n}\n",
  "Python": "# Write your solution here\ndef solution():\n    pass\n",
  "Java": "// Write your solution here\nclass Solution {\n    public static void main(String[] args) {\n        \n    }\n}\n",
  "C++": "// Write your solution here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n",
  "Go": "// Write your solution here\npackage main\n\nimport \"fmt\"\n\nfunc main() {\n    fmt.Println()\n}\n",
  "SQL": "-- Write your SQL query here\nSELECT * \nFROM table_name\nWHERE condition;\n",
};

const SPREADSHEET_TEMPLATES: Record<string, string[][]> = {
  "statements": [
    ["Metric", "Year 1", "Year 2", "Year 3", "Notes"],
    ["Revenue", "$100,000", "", "", ""],
    ["Expenses", "$60,000", "", "", ""],
    ["Net Income", "", "", "", ""],
    ["Cash Flow", "", "", "", ""],
  ],
  "npv": [
    ["Year", "Cash Flow", "Discount Factor (10%)", "Present Value", ""],
    ["0 (Outlay)", "-$500,000", "1.0000", "", ""],
    ["1", "$150,000", "", "", ""],
    ["2", "$200,000", "", "", ""],
    ["3", "$250,000", "", "", ""],
    ["4", "$300,000", "", "", ""],
  ],
  "reconcile": [
    ["Item Description", "GL Book Balance", "Bank Statement", "Adjustment", ""],
    ["Unadjusted Balance", "$50,000", "$48,500", "", ""],
    ["Outstanding Checks", "", "", "", ""],
    ["Deposits in Transit", "", "", "", ""],
    ["Adjusted Balance", "", "", "", ""],
  ],
  "wacc": [
    ["Component", "Market Value", "Weight", "Cost", "WACC Contribution"],
    ["Equity", "$600,000", "", "12%", ""],
    ["Debt", "$400,000", "", "6%", ""],
    ["Tax Rate", "25%", "", "", ""],
    ["Total WACC", "", "", "", ""],
  ],
  "default": [
    ["Label", "Value A", "Value B", "Formula/Total", ""],
    ["Row 1", "", "", "", ""],
    ["Row 2", "", "", "", ""],
    ["Row 3", "", "", "", ""],
    ["Total", "", "", "", ""],
  ]
};

const getSpreadsheetTemplateForQuestion = (q: string): string[][] => {
  const qLower = q.toLowerCase();
  if (qLower.includes("3-statement") || qLower.includes("statements") || qLower.includes("income statement")) {
    return SPREADSHEET_TEMPLATES["statements"];
  }
  if (qLower.includes("npv") || qLower.includes("present value") || qLower.includes("discount")) {
    return SPREADSHEET_TEMPLATES["npv"];
  }
  if (qLower.includes("reconcile") || qLower.includes("ledger") || qLower.includes("discrepancies")) {
    return SPREADSHEET_TEMPLATES["reconcile"];
  }
  if (qLower.includes("wacc") || qLower.includes("cost of capital")) {
    return SPREADSHEET_TEMPLATES["wacc"];
  }
  return SPREADSHEET_TEMPLATES["default"];
};

interface AnsweredQuestion {
  question: string;
  answer: string;
  score: number;
  feedback: string;
  idealAnswer: string;
}

// Simple typewriter component
function TypewriterText({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    setDisplayedText("");
    if (!text) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayedText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
      }
    }, 10); // 10ms per character for readable pacing
    return () => clearInterval(interval);
  }, [text]);

  return <span>{displayedText}</span>;
}

export default function InterviewPage() {
  const router = useRouter();

  // Settings from sessionStorage
  const [resumeText, setResumeText] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  
  // State
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [timer, setTimer] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answersList, setAnswersList] = useState<AnsweredQuestion[]>([]);
  
  // feedback popup state
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [currentHint, setCurrentHint] = useState("");
  const [hasApiKey, setHasApiKey] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("JavaScript");

  // Spreadsheet state for finance/accounting roles
  const [spreadsheetData, setSpreadsheetData] = useState<string[][]>([
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
  ]);
  const [activeCell, setActiveCell] = useState<{ row: number; col: number }>({ row: 0, col: 0 });

  const serializeSpreadsheet = (grid: string[][]) => {
    const headers = ["A", "B", "C", "D", "E"];
    let md = "| Cell | " + headers.join(" | ") + " |\n";
    md += "| --- | " + headers.map(() => "---").join(" | ") + " |\n";
    grid.forEach((row, rIdx) => {
      md += `| **Row ${rIdx + 1}** | ` + row.map(cell => cell || " ").join(" | ") + " |\n";
    });
    return md;
  };

  const handleSpreadsheetChange = (rowIdx: number, colIdx: number, val: string) => {
    const newData = spreadsheetData.map((row, r) => 
      row.map((cell, c) => (r === rowIdx && c === colIdx ? val : cell))
    );
    setSpreadsheetData(newData);
    setUserAnswer(serializeSpreadsheet(newData));
  };

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Load config on mount
  useEffect(() => {
    const storedResume = sessionStorage.getItem("grill_resumeText");
    const storedRole = sessionStorage.getItem("grill_jobRole");
    const storedDiff = sessionStorage.getItem("grill_difficulty");
    const storedQuestionsStr = sessionStorage.getItem("grill_questions");

    if (!storedResume || !storedRole || !storedQuestionsStr) {
      toast.error("NO ACTIVE SESSION DETECTED. REDIRECTING...");
      router.push("/setup");
      return;
    }

    setResumeText(storedResume);
    setJobRole(storedRole);
    setDifficulty(storedDiff || "Mid");
    const parsedQuestions = JSON.parse(storedQuestionsStr);
    setQuestions(parsedQuestions);

    // Pre-fill starter template if the first question is a coding/query/spreadsheet question
    const firstQ = parsedQuestions[0] || "";
    const firstIsSQL = firstQ.startsWith("[SQL]") || firstQ.toLowerCase().includes("write a query");
    const firstIsCoding = firstIsSQL || firstQ.startsWith("[CODING]") || 
      firstQ.toLowerCase().includes("write a function") || 
      firstQ.toLowerCase().includes("implement a") || 
      firstQ.toLowerCase().includes("write a custom");

    const firstIsFinance = storedRole.toLowerCase().includes("finance") || 
      storedRole.toLowerCase().includes("accountant") || 
      storedRole.toLowerCase().includes("financial");
    const firstIsSpreadsheet = firstIsFinance && (
      firstQ.startsWith("[SPREADSHEET]") || 
      firstQ.toLowerCase().includes("spreadsheet") ||
      firstQ.toLowerCase().includes("model") ||
      firstQ.toLowerCase().includes("reconcile") ||
      firstQ.toLowerCase().includes("npv") ||
      firstQ.toLowerCase().includes("wacc") ||
      firstQ.toLowerCase().includes("balance sheet") ||
      firstQ.toLowerCase().includes("debit") ||
      firstQ.toLowerCase().includes("ledger")
    );

    if (firstIsCoding) {
      const defaultL = firstIsSQL ? "SQL" : "JavaScript";
      setSelectedLanguage(defaultL);
      setUserAnswer(STARTER_TEMPLATES[defaultL]);
    } else if (firstIsSpreadsheet) {
      const template = getSpreadsheetTemplateForQuestion(firstQ);
      setSpreadsheetData(template);
      setUserAnswer(serializeSpreadsheet(template));
    }

    const key = localStorage.getItem("grill_api_key");
    const defaultKeySet = process.env.NEXT_PUBLIC_HAS_DEFAULT_KEY === "true";
    setHasApiKey(!!key || defaultKeySet);
  }, [router]);

  // Timer increment
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timerInterval);
  }, []);

  // Scroll terminal logs to bottom when answers change
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [answersList, currentIdx]);

  // Format timer into MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerSubmit = async () => {
    if (isSubmitting) return;
    
    const trimmedAnswer = userAnswer.trim();
    if (!trimmedAnswer) {
      toast.error("PLEASE ENTER AN ANSWER OR CLICK SKIP");
      return;
    }

    setIsSubmitting(true);
    const currentQuestion = questions[currentIdx];

    try {
      const apiKey = localStorage.getItem("grill_api_key") || "";
      const apiProvider = localStorage.getItem("grill_ai_provider") || "groq";

      const isCodingQuestion = currentQuestion.startsWith("[CODING]") || 
        currentQuestion.startsWith("[SQL]") ||
        currentQuestion.toLowerCase().includes("write a function") || 
        currentQuestion.toLowerCase().includes("implement a") || 
        currentQuestion.toLowerCase().includes("write a query") || 
        currentQuestion.toLowerCase().includes("write a custom");

      const response = await fetch("/api/evaluate-answer", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "x-ai-provider": apiProvider
        },
        body: JSON.stringify({
          question: currentQuestion,
          answer: trimmedAnswer,
          resumeText,
          jobRole,
          language: isCodingQuestion ? selectedLanguage : undefined,
          difficulty
        }),
      });

      if (!response.ok) {
        throw new Error("Evaluation request failed");
      }

      const evalData = await response.json();
      
      const newAnswer: AnsweredQuestion = {
        question: currentQuestion,
        answer: trimmedAnswer,
        score: evalData.score,
        feedback: evalData.feedback,
        idealAnswer: evalData.idealAnswer,
      };

      const updatedAnswers = [...answersList, newAnswer];
      setAnswersList(updatedAnswers);
      sessionStorage.setItem("grill_answers", JSON.stringify(updatedAnswers));

      // Display feedback transition
      setCurrentScore(evalData.score);
      setCurrentHint(evalData.feedback);
      setShowFeedback(true);
      setUserAnswer("");

      // Delay to view score before advancing
      setTimeout(() => {
        advanceInterview();
      }, 2000);

    } catch (err) {
      console.error(err);
      toast.error("API EVALUATION ERROR. RETRYING...");
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (isSubmitting) return;

    // Fast-track skip without calling LLM to save quota and increase speed
    const currentQuestion = questions[currentIdx];
    const skippedAnswer: AnsweredQuestion = {
      question: currentQuestion,
      answer: "[Candidate skipped this question]",
      score: 1.0,
      feedback: "You skipped this question. An ideal answer would address the specific project details.",
      idealAnswer: "Candidate skipped. A great response would detail direct methodologies and project metrics relating to the topic.",
    };

    const updatedAnswers = [...answersList, skippedAnswer];
    setAnswersList(updatedAnswers);
    sessionStorage.setItem("grill_answers", JSON.stringify(updatedAnswers));

    setCurrentScore(1.0);
    setCurrentHint("Question skipped.");
    setShowFeedback(true);
    setUserAnswer("");

    setTimeout(() => {
      advanceInterview();
    }, 2000);
  };

  const advanceInterview = () => {
    setIsSubmitting(false);
    setShowFeedback(false);
    setCurrentScore(null);
    setCurrentHint("");
    setSelectedLanguage("JavaScript");

    if (currentIdx < 9) {
      const nextIdx = currentIdx + 1;
      const nextQuestion = questions[nextIdx] || "";
      const nextIsSQL = nextQuestion.startsWith("[SQL]") || nextQuestion.toLowerCase().includes("write a query");
      const nextIsCoding = nextIsSQL || nextQuestion.startsWith("[CODING]") || 
        nextQuestion.toLowerCase().includes("write a function") || 
        nextQuestion.toLowerCase().includes("implement a") || 
        nextQuestion.toLowerCase().includes("write a custom");
      
      const nextIsFinance = jobRole.toLowerCase().includes("finance") || 
        jobRole.toLowerCase().includes("accountant") || 
        jobRole.toLowerCase().includes("financial");
      const nextIsSpreadsheet = nextIsFinance && (
        nextQuestion.startsWith("[SPREADSHEET]") || 
        nextQuestion.toLowerCase().includes("spreadsheet") ||
        nextQuestion.toLowerCase().includes("model") ||
        nextQuestion.toLowerCase().includes("reconcile") ||
        nextQuestion.toLowerCase().includes("npv") ||
        nextQuestion.toLowerCase().includes("wacc") ||
        nextQuestion.toLowerCase().includes("balance sheet") ||
        nextQuestion.toLowerCase().includes("debit") ||
        nextQuestion.toLowerCase().includes("ledger")
      );

      if (nextIsCoding) {
        const defaultLang = nextIsSQL ? "SQL" : "JavaScript";
        setSelectedLanguage(defaultLang);
        setUserAnswer(STARTER_TEMPLATES[defaultLang]);
      } else if (nextIsSpreadsheet) {
        const template = getSpreadsheetTemplateForQuestion(nextQuestion);
        setSpreadsheetData(template);
        setUserAnswer(serializeSpreadsheet(template));
      } else {
        setUserAnswer("");
      }
      setCurrentIdx(nextIdx);
    } else {
      // Completed all 10 questions
      toast.success("SIMULATION COMPLETE. COMPUTING PERFORMANCE REPORT...");
      router.push("/results");
    }
  };

  const currentQuestion = questions[currentIdx] || "";
  const wordCount = userAnswer.trim() === "" ? 0 : userAnswer.trim().split(/\s+/).length;
  
  const isCodingQuestion = currentQuestion.startsWith("[CODING]") || 
    currentQuestion.startsWith("[SQL]") ||
    currentQuestion.toLowerCase().includes("write a function") || 
    currentQuestion.toLowerCase().includes("implement a") || 
    currentQuestion.toLowerCase().includes("write a query") || 
    currentQuestion.toLowerCase().includes("write a custom");

  const isFinanceRole = jobRole.toLowerCase().includes("finance") || 
    jobRole.toLowerCase().includes("accountant") || 
    jobRole.toLowerCase().includes("financial");

  const isSpreadsheetQuestion = isFinanceRole && (
    currentQuestion.startsWith("[SPREADSHEET]") || 
    currentQuestion.toLowerCase().includes("spreadsheet") ||
    currentQuestion.toLowerCase().includes("model") ||
    currentQuestion.toLowerCase().includes("reconcile") ||
    currentQuestion.toLowerCase().includes("npv") ||
    currentQuestion.toLowerCase().includes("wacc") ||
    currentQuestion.toLowerCase().includes("balance sheet") ||
    currentQuestion.toLowerCase().includes("debit") ||
    currentQuestion.toLowerCase().includes("ledger")
  );

  return (
    <div className="flex flex-col min-h-screen bg-background relative text-white bg-grid-pattern">
      {/* Dynamic top bar */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-850 bg-zinc-950/80 backdrop-blur-md px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg uppercase">
              {difficulty}
            </span>
            <h1 className="text-sm font-semibold tracking-tight text-white uppercase max-w-xs truncate sm:max-w-md">
              {jobRole || "Loading role..."}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-xs text-zinc-400 flex items-center space-x-1.5 font-medium">
              <Clock className="h-3.5 w-3.5 text-zinc-500" />
              <span>Elapsed:</span>
              <span className="text-white">{formatTime(timer)}</span>
            </div>
            <div className="flex items-center space-x-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1 text-[10px] font-medium tracking-wide text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <span>Live Simulation</span>
            </div>
          </div>
        </div>
      </header>

      {!hasApiKey && (
        <div className="bg-indigo-550/5 border-b border-zinc-800 text-indigo-300 px-4 py-2 text-center text-xs font-sans tracking-wide z-30">
          ⚠️ Sandbox Mode active (mock responses). Click settings ⚙️ in the top bar to configure your Groq or Gemini API key.
        </div>
      )}

      {/* Main Container */}
      <main className="flex-grow max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 relative z-20">
        
        {/* Top Horizontal Progress Stepper */}
        <section className="border border-zinc-800 bg-[#18181b] rounded-xl p-4 sm:px-6 shadow-sm overflow-x-auto">
          <div className="flex items-center justify-between w-full min-w-[550px] relative">
            {/* line backdrop */}
            <div className="absolute top-[18px] left-6 right-6 h-[1px] bg-zinc-800/80 -z-10" />
            
            {Array.from({ length: 10 }).map((_, idx) => {
              const isAnswered = idx < answersList.length;
              const isActive = idx === currentIdx;
              const score = isAnswered ? answersList[idx].score : null;
              
              return (
                <div key={idx} className="flex flex-col items-center space-y-1.5 relative z-10">
                  {/* Stepper Node */}
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? "bg-indigo-600 border border-indigo-600 text-white shadow-md shadow-indigo-600/10"
                      : isAnswered
                      ? "bg-zinc-900 border border-emerald-500/20 text-emerald-400"
                      : "bg-zinc-950 border border-zinc-850 text-zinc-600"
                  }`}>
                    {isAnswered ? "✓" : idx + 1}
                  </div>
                  
                  {/* score tag or index */}
                  <div className="text-[9px] font-semibold tracking-wider min-h-[14px]">
                    {isActive ? (
                      <span className="text-indigo-400 uppercase">Active</span>
                    ) : isAnswered && score !== null ? (
                      <span className="text-emerald-400">{score.toFixed(1)}/10</span>
                    ) : (
                      <span className="text-zinc-600">Q{idx + 1}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Workspace Container */}
        <section className="flex flex-col space-y-6">
          {/* Question Card */}
          <div className="border border-zinc-800 bg-[#18181b] rounded-xl p-6 sm:p-8 min-h-[120px] relative overflow-hidden flex flex-col justify-center shadow-sm">
            <div className="absolute top-0 left-0 w-1 bg-indigo-500 h-full" />
            <div className="text-[10px] text-zinc-500 font-semibold tracking-wider mb-2 uppercase">AI Interviewer Prompt</div>
            <h3 className="text-lg sm:text-xl font-medium tracking-tight text-white leading-relaxed font-sans">
              {currentQuestion ? (
                <TypewriterText text={currentQuestion} />
              ) : (
                <span className="text-zinc-650">Initializing question...</span>
              )}
            </h3>
          </div>

          {/* User Answer Card */}
          <div className="border border-zinc-800 bg-[#18181b] rounded-xl p-6 sm:p-8 space-y-4 relative shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex flex-col space-y-0.5">
                <label className="text-xs font-semibold text-zinc-300">
                  {isCodingQuestion ? (
                    <span className="flex items-center gap-1.5"><Code2 className="h-3.5 w-3.5 text-indigo-400" /> Interactive Code Workspace</span>
                  ) : isSpreadsheetQuestion ? (
                    <span className="flex items-center gap-1.5"><Terminal className="h-3.5 w-3.5 text-indigo-400" /> Financial Spreadsheet Workspace</span>
                  ) : (
                    "Your Answer Input"
                  )}
                </label>
                <span className="text-[10px] text-zinc-500">
                  {isCodingQuestion ? "Write your code implementation below" : isSpreadsheetQuestion ? "Enter labels, values, and formulas in cell grid" : "Provide a detailed text answer. Markdown supported."}
                </span>
              </div>
              
              {isCodingQuestion && (
                <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs">
                  <span className="text-zinc-500">LANGUAGE:</span>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => {
                      const newLang = e.target.value;
                      setSelectedLanguage(newLang);
                      const currentIsTemplate = Object.values(STARTER_TEMPLATES).some(t => userAnswer.trim() === t.trim());
                      if (!userAnswer.trim() || currentIsTemplate) {
                        setUserAnswer(STARTER_TEMPLATES[newLang] || "");
                      }
                    }}
                    className="bg-transparent text-indigo-400 px-2 py-0.5 rounded outline-none cursor-pointer text-xs font-medium"
                  >
                    <option value="JavaScript">JavaScript</option>
                    <option value="TypeScript">TypeScript</option>
                    <option value="Python">Python</option>
                    <option value="Java">Java</option>
                    <option value="C++">C++</option>
                    <option value="Go">Go</option>
                    <option value="SQL">SQL</option>
                  </select>
                </div>
              )}
            </div>

            {isCodingQuestion ? (
              <div className="border border-zinc-800 rounded-lg overflow-hidden" style={{ height: 340 }}>
                <MonacoEditor
                  height="100%"
                  language={LANGUAGE_MAP[selectedLanguage] || "javascript"}
                  theme="vs-dark"
                  value={userAnswer || STARTER_TEMPLATES[selectedLanguage] || ""}
                  onChange={(value) => setUserAnswer(value || "")}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    wordWrap: "on",
                    padding: { top: 12, bottom: 12 },
                    readOnly: isSubmitting || showFeedback,
                    renderLineHighlight: "gutter",
                    bracketPairColorization: { enabled: true },
                    cursorBlinking: "smooth",
                    smoothScrolling: true,
                  }}
                />
              </div>
            ) : isSpreadsheetQuestion ? (
              <div className="space-y-3">
                {/* Excel style Formula Bar */}
                <div className="flex items-center space-x-2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white">
                  <span className="text-indigo-400 font-bold bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/20 uppercase font-mono">
                    {String.fromCharCode(65 + activeCell.col)}${activeCell.row + 1}
                  </span>
                  <span className="text-zinc-650 font-bold">:</span>
                  <input
                    type="text"
                    disabled={isSubmitting || showFeedback}
                    value={spreadsheetData[activeCell.row]?.[activeCell.col] || ""}
                    onChange={(e) => handleSpreadsheetChange(activeCell.row, activeCell.col, e.target.value)}
                    placeholder="Enter value or formula (e.g. 150000 or =A2*B2)..."
                    className="flex-grow bg-transparent outline-none text-zinc-300 placeholder:text-zinc-700 select-text font-mono"
                  />
                </div>

                {/* Spreadsheet Grid */}
                <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950/40">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse font-mono text-xs select-none">
                      <thead>
                        <tr className="bg-zinc-900 border-b border-zinc-800">
                          <th className="w-12 p-2 border-r border-zinc-800 text-center text-zinc-500 font-bold">
                            #
                          </th>
                          {Array.from({ length: spreadsheetData[0]?.length || 5 }).map((_, cIdx) => (
                            <th key={cIdx} className="p-2 border-r border-zinc-800 text-center text-zinc-400 font-bold uppercase tracking-wider min-w-[120px]">
                              {String.fromCharCode(65 + cIdx)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {spreadsheetData.map((row, rIdx) => (
                          <tr key={rIdx} className="border-b border-zinc-800/50 hover:bg-zinc-900/10 transition-colors">
                            <td className="p-2 border-r border-zinc-800 text-center text-zinc-500 font-bold bg-zinc-900/30">
                              {rIdx + 1}
                            </td>
                            {row.map((cell, cIdx) => {
                              const isActive = activeCell.row === rIdx && activeCell.col === cIdx;
                              return (
                                <td 
                                  key={cIdx} 
                                  onClick={() => setActiveCell({ row: rIdx, col: cIdx })}
                                  className={`p-1 border-r border-zinc-800 min-w-[120px] transition-all relative cursor-pointer ${
                                    isActive 
                                      ? "bg-indigo-500/5 ring-1 ring-indigo-500/40 ring-inset" 
                                      : "hover:bg-zinc-900/20"
                                  }`}
                                >
                                  <input
                                    type="text"
                                    disabled={isSubmitting || showFeedback}
                                    value={cell}
                                    onChange={(e) => handleSpreadsheetChange(rIdx, cIdx, e.target.value)}
                                    className="w-full bg-transparent border-none outline-none text-zinc-300 text-center px-1 py-1 focus:ring-0 font-mono"
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="text-[10px] text-zinc-500 flex justify-between px-1 font-medium">
                  <span>* Click cell or formula bar to edit</span>
                  <span>5 X 5 Interactive Ledger</span>
                </div>
              </div>
            ) : (
              <textarea
                disabled={isSubmitting || showFeedback}
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your detailed response here. Explain methodologies, technical aspects, and project references..."
                className="w-full h-56 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-4 text-sm text-zinc-200 outline-none transition-all duration-200 placeholder:text-zinc-700 resize-none disabled:opacity-40"
              />
            )}

            {/* Word count indicator */}
            <div className="flex justify-between items-center text-[10px] text-zinc-500 font-medium">
              <div className="flex items-center space-x-1">
                {!isCodingQuestion && !isSpreadsheetQuestion && wordCount < 25 && wordCount > 0 && (
                  <span className="text-amber-500 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Provide a more thorough explanation.
                  </span>
                )}
                {isCodingQuestion && (
                  <span className="text-indigo-400 font-mono">
                    {userAnswer.split("\n").length} LINES
                  </span>
                )}
                {isSpreadsheetQuestion && (
                  <span className="text-indigo-400">
                    Ledger cells active
                  </span>
                )}
              </div>
              <span className="font-mono">
                {isCodingQuestion
                  ? `${selectedLanguage.toUpperCase()} · ${userAnswer.length} CHARS`
                  : isSpreadsheetQuestion
                  ? `SUBMITTING STRUCTURE`
                  : `${wordCount} words`
                }
              </span>
            </div>

            {/* Buttons */}
            <div className="flex justify-end items-center space-x-3 pt-2">
              <button
                type="button"
                disabled={isSubmitting || showFeedback}
                onClick={handleSkip}
                className="px-6 py-2.5 rounded-lg text-xs font-semibold border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all duration-200 disabled:opacity-40"
              >
                Skip Question
              </button>
              
              <button
                type="button"
                disabled={isSubmitting || showFeedback || !userAnswer.trim()}
                onClick={handleAnswerSubmit}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200 disabled:opacity-30"
              >
                <span>Submit Answer</span>
                <Send className="h-3 w-3" />
              </button>
            </div>

            {/* Real-time rating/hint popup overlay */}
            <AnimatePresence>
              {showFeedback && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md rounded-xl flex flex-col justify-center items-center p-6 text-center z-30"
                >
                  <motion.div
                    initial={{ scale: 0.98 }}
                    animate={{ scale: 1 }}
                    className="space-y-4 max-w-md"
                  >
                    <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider font-sans">Evaluation Result</div>
                    
                    <div className="flex justify-center items-baseline space-x-1">
                      <span className="text-5xl font-black text-white">{currentScore?.toFixed(1)}</span>
                      <span className="text-zinc-500 text-sm">/ 10</span>
                    </div>

                    <div className="w-16 h-[1px] bg-zinc-850 mx-auto" />

                    <p className="text-xs text-zinc-300 leading-relaxed italic">
                      &ldquo;{currentHint}&rdquo;
                    </p>

                    <div className="text-[10px] text-zinc-500 pt-4 animate-pulse">
                      Loading next question...
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

      </main>
    </div>
  );
}
