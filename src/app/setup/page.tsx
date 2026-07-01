"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { Cpu, ArrowRight, Upload, Loader2 } from "lucide-react";
import Header from "@/components/Header";

type InterviewType = "Technical" | "Behavioural" | "Mixed";
type Difficulty = "Junior" | "Mid" | "Senior";

export default function SetupPage() {
  const router = useRouter();
  
  // Form state
  const [profileId, setProfileId] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [jobRole, setJobRole] = useState("Frontend Engineer");
  const [interviewType, setInterviewType] = useState<InterviewType>("Technical");
  const [difficulty, setDifficulty] = useState<Difficulty>("Mid");
  
  // Loading state
  const [loading, setLoading] = useState(false);
  const [loaderStep, setLoaderStep] = useState(0);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [hasApiKey, setHasApiKey] = useState(true);

  const updateProfileId = (newId: string) => {
    setProfileId(newId);
    localStorage.setItem("grill_last_profile_id", newId);

    const keyPrefix = newId ? `grill_profile_${newId}` : "grill_profile_default";
    const savedCV = localStorage.getItem(`${keyPrefix}_cv`) || "";
    const savedRole = localStorage.getItem(`${keyPrefix}_jobRole`) || "Frontend Engineer";
    const savedType = localStorage.getItem(`${keyPrefix}_interviewType`) || "Technical";
    const savedDifficulty = localStorage.getItem(`${keyPrefix}_difficulty`) || "Mid";

    setResumeText(savedCV);
    setJobRole(savedRole);
    setInterviewType(savedType as InterviewType);
    setDifficulty(savedDifficulty as Difficulty);
  };

  const updateResumeText = (newText: string) => {
    setResumeText(newText);
    const keyPrefix = profileId ? `grill_profile_${profileId}` : "grill_profile_default";
    localStorage.setItem(`${keyPrefix}_cv`, newText);
  };

  const updateJobRole = (newRole: string) => {
    setJobRole(newRole);
    const keyPrefix = profileId ? `grill_profile_${profileId}` : "grill_profile_default";
    localStorage.setItem(`${keyPrefix}_jobRole`, newRole);
  };

  const updateInterviewType = (newType: InterviewType) => {
    setInterviewType(newType);
    const keyPrefix = profileId ? `grill_profile_${profileId}` : "grill_profile_default";
    localStorage.setItem(`${keyPrefix}_interviewType`, newType);
  };

  const updateDifficulty = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    const keyPrefix = profileId ? `grill_profile_${profileId}` : "grill_profile_default";
    localStorage.setItem(`${keyPrefix}_difficulty`, newDifficulty);
  };

  React.useEffect(() => {
    const key = localStorage.getItem("grill_api_key");
    const defaultKeySet = process.env.NEXT_PUBLIC_HAS_DEFAULT_KEY === "true";
    setHasApiKey(!!key || defaultKeySet);

    const lastProfileId = localStorage.getItem("grill_last_profile_id") || "";
    setProfileId(lastProfileId);

    const keyPrefix = lastProfileId ? `grill_profile_${lastProfileId}` : "grill_profile_default";
    const savedCV = localStorage.getItem(`${keyPrefix}_cv`) || "";
    const savedRole = localStorage.getItem(`${keyPrefix}_jobRole`) || "Frontend Engineer";
    const savedType = localStorage.getItem(`${keyPrefix}_interviewType`) || "Technical";
    const savedDifficulty = localStorage.getItem(`${keyPrefix}_difficulty`) || "Mid";

    setResumeText(savedCV);
    setJobRole(savedRole);
    setInterviewType(savedType as InterviewType);
    setDifficulty(savedDifficulty as Difficulty);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setParseProgress(0);
    const toastId = toast.loading("EXTRACTING TEXT FROM DOCUMENT: 0%...");

    // Smooth simulated progress interval while waiting for endpoint fetch response
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 8) + 4;
      if (currentProgress >= 96) {
        currentProgress = 96;
        clearInterval(progressInterval);
      }
      setParseProgress(currentProgress);
      toast.loading(`EXTRACTING TEXT FROM DOCUMENT: ${currentProgress}%...`, { id: toastId });
    }, 150);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to parse document");
      }

      const data = await response.json();
      setParseProgress(100);
      toast.success("RESUME EXTRACTED SUCCESSFULLY: 100%", { id: toastId });
      updateResumeText(data.text);
    } catch (err: unknown) {
      clearInterval(progressInterval);
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "PARSING ERROR. PLEASE TRY COPY-PASTING.";
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsParsing(false);
    }
  };

  // Helper messages for loader to make it feel cinematic
  const loaderMessages = [
    "PARSING RESUME STRUCTURE...",
    "EXTRACTING MAIN FRAMEWORKS & PROJECT DETAILS...",
    "CONTACTING GROQ LLAMA-3.1 ENGINE...",
    "GENERATING 10 HIGHLY TAILORED QUESTIONS...",
    "COMPILING INTERVIEW ENVIRONMENT...",
    "SYSTEM READY. LAUNCHING SIMULATOR..."
  ];

  const handleInitialize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeText.trim()) {
      toast.error("PLEASE ENTER RESUME CONTENT");
      return;
    }
    if (!jobRole.trim()) {
      toast.error("PLEASE DEFINE A TARGET JOB ROLE");
      return;
    }

    setLoading(true);
    setLoaderStep(0);
    
    // Increment the loader steps for visual immersion
    const stepInterval = setInterval(() => {
      setLoaderStep((prev) => {
        if (prev < loaderMessages.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1800);

    try {
      const apiKey = localStorage.getItem("grill_api_key") || "";
      const apiProvider = localStorage.getItem("grill_ai_provider") || "groq";

      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "x-ai-provider": apiProvider
        },
        body: JSON.stringify({
          resumeText,
          jobRole,
          interviewType,
          difficulty,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text() || "Failed to generate questions");
      }

      const questions = await response.json();
      
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("Invalid questions array returned.");
      }

      // Save configurations to session storage
      sessionStorage.setItem("grill_resumeText", resumeText);
      sessionStorage.setItem("grill_jobRole", jobRole);
      sessionStorage.setItem("grill_interviewType", interviewType);
      sessionStorage.setItem("grill_difficulty", difficulty);
      sessionStorage.setItem("grill_questions", JSON.stringify(questions));
      sessionStorage.setItem("grill_answers", JSON.stringify([]));
      sessionStorage.removeItem("grill_cachedReport");

      clearInterval(stepInterval);
      
      // Let final step message register briefly
      setLoaderStep(loaderMessages.length - 1);
      await new Promise((resolve) => setTimeout(resolve, 600));

      toast.success("INTERVIEW COMPILED SUCCESSFULLY");
      router.push("/interview");
    } catch (error: unknown) {
      clearInterval(stepInterval);
      setLoading(false);
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "COMPILATION FAILED. CHECK KEY CONFIGURATION.";
      toast.error(errorMessage);
    }
  };

  const [wizardStep, setWizardStep] = useState(1);

  return (
    <div className="flex flex-col min-h-screen bg-background relative bg-grid-pattern">
      <Header />

      {!hasApiKey && (
        <div className="bg-indigo-550/5 border-b border-zinc-800 text-indigo-300 px-4 py-2 text-center text-xs font-sans tracking-wide z-30">
          ⚠️ Sandbox Mode active (mock responses). Click settings ⚙️ in the top bar to configure your Groq or Gemini API key.
        </div>
      )}

      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-20">
        <AnimatePresence mode="wait">
          {!loading ? (
            <motion.div
              key="setup-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-2xl border border-zinc-800 bg-[#18181b] rounded-xl p-6 sm:p-8 shadow-xl relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-5 w-5 text-indigo-400" />
                  <h2 className="text-sm font-semibold tracking-wider text-white uppercase">Configure Interview Simulator</h2>
                </div>
                
                {/* Stepper bubbles */}
                <div className="flex items-center space-x-2">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                    wizardStep >= 1 ? "bg-indigo-600 text-white" : "border border-zinc-800 text-zinc-500"
                  }`}>
                    1
                  </div>
                  <div className="w-4 h-[1px] bg-zinc-800" />
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                    wizardStep === 2 ? "bg-indigo-600 text-white" : "border border-zinc-850 text-zinc-650"
                  }`}>
                    2
                  </div>
                </div>
              </div>
 
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (wizardStep === 1) {
                    if (!resumeText.trim()) {
                      toast.error("Please provide your CV text or document details.");
                      return;
                    }
                    setWizardStep(2);
                  } else {
                    handleInitialize(e);
                  }
                }} 
                className="space-y-6"
              >
                {wizardStep === 1 ? (
                  /* Step 1: Candidate ID & Resume Text */
                  <div className="space-y-6">
                    {/* Profile ID Persistence Field */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-zinc-300">
                          Candidate Profile ID
                        </label>
                        <span className="text-[10px] text-zinc-500 font-medium">Auto-saves configurations</span>
                      </div>
                      <input
                        type="text"
                        value={profileId}
                        onChange={(e) => updateProfileId(e.target.value)}
                        placeholder="Enter profile name or email to auto-save and sync..."
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-4 py-2.5 text-sm text-white outline-none transition-all duration-200 placeholder:text-zinc-650"
                      />
                    </div>

                    {/* Step 1: Resume Text / Upload */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-zinc-300">
                          Resume Document or Text Data
                        </label>
                        <span className="text-[10px] text-zinc-500 font-medium">PDF or TXT format</span>
                      </div>

                      {/* Drag & Drop or click upload */}
                      <div className="relative border border-dashed border-zinc-850 hover:border-indigo-550/40 bg-zinc-950/40 rounded-lg p-5 transition-all duration-200 group">
                        <input
                          type="file"
                          accept=".pdf,.txt"
                          disabled={isParsing}
                          onChange={handleFileUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                        />
                        <div className="flex flex-col items-center justify-center space-y-2 text-center pointer-events-none">
                          {isParsing ? (
                            <>
                              <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
                              <span className="text-xs font-medium text-indigo-400 tracking-wider">
                                Extracting text: {parseProgress}%
                              </span>
                            </>
                          ) : (
                            <>
                              <Upload className="h-6 w-6 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                              <div className="space-y-0.5">
                                <span className="text-xs font-semibold text-zinc-300 block">
                                  Drag & Drop or Choose File
                                </span>
                                <span className="text-[10px] text-zinc-500 block">
                                  Max size 5MB | System extracts details automatically
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Textarea for review/adjust */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-zinc-500 font-medium">
                          <span>OR REVIEW / PASTE RESUME TEXT</span>
                          {resumeText && <span>{resumeText.length} characters loaded</span>}
                        </div>
                        <textarea
                          required
                          value={resumeText}
                          disabled={isParsing}
                          onChange={(e) => updateResumeText(e.target.value)}
                          placeholder="Paste the text of your resume here to refine details manually..."
                          className="w-full h-36 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-4 text-xs text-zinc-350 outline-none transition-all duration-200 placeholder:text-zinc-700 resize-none disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {/* Next button */}
                    <button
                      type="submit"
                      disabled={!resumeText.trim() || isParsing}
                      className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold text-sm py-3.5 rounded-lg transition-all duration-200 mt-8 group"
                    >
                      <span>Continue to Preferences</span>
                      <ArrowRight className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                ) : (
                  /* Step 2: Specs & Roles */
                  <div className="space-y-6">
                    {/* Step 2: Target Role */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-300 block">
                        Target Job Role
                      </label>
                      <select
                        required
                        value={jobRole || "Frontend Engineer"}
                        onChange={(e) => updateJobRole(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-4 py-2.5 text-sm text-white outline-none transition-all duration-200 cursor-pointer"
                      >
                        <option value="Frontend Engineer">Frontend Engineer (React / Next.js)</option>
                        <option value="Backend Engineer">Backend Engineer (Node.js / APIs)</option>
                        <option value="Full Stack Engineer">Full Stack Engineer (TypeScript / Full Stack)</option>
                        <option value="DevOps Engineer">DevOps Engineer (CI/CD / Cloud / Kubernetes)</option>
                        <option value="Data Scientist">Data Scientist (Machine Learning / Python)</option>
                        <option value="Data Analyst">Data Analyst (SQL / Tableau / BI)</option>
                        <option value="Financial Analyst">Financial Analyst (Valuations / DCF)</option>
                        <option value="Corporate Accountant">Corporate Accountant (Ledgers / GAAP)</option>
                        <option value="Product Manager">Product Manager (Metrics / Roadmap)</option>
                      </select>
                    </div>

                    {/* Step 3: Interview Type */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-300 block">
                        Interview Focus Style
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["Technical", "Behavioural", "Mixed"] as InterviewType[]).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => updateInterviewType(type)}
                            className={`py-2.5 rounded-lg font-medium text-xs tracking-wide transition-all duration-205 border ${
                              interviewType === type
                                ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                                : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:text-white"
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Step 4: Difficulty */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-300 block">
                        Targeted Expertise Level
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["Junior", "Mid", "Senior"] as Difficulty[]).map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => updateDifficulty(level)}
                            className={`py-2.5 rounded-lg font-medium text-xs tracking-wide transition-all duration-205 border ${
                              difficulty === level
                                ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                                : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:text-white"
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Navigation Row */}
                    <div className="flex items-center space-x-3 mt-8 pt-4 border-t border-zinc-850">
                      <button
                        type="button"
                        onClick={() => setWizardStep(1)}
                        className="px-6 py-3 rounded-lg text-xs font-semibold border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all duration-200"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="flex-grow flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-3 rounded-lg transition-all duration-200 group"
                      >
                        <span>Initialize Simulator</span>
                        <ArrowRight className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </motion.div>
          ) : (
            /* Cinematic Loading State */
            <motion.div
              key="loading-terminal"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg border border-zinc-800 bg-[#18181b] rounded-xl p-8 shadow-xl relative font-sans text-xs flex flex-col justify-center min-h-[350px]"
            >
              <div className="flex items-center space-x-2 border-b border-zinc-800 pb-4 mb-6">
                <Cpu className="h-4 w-4 text-indigo-500 animate-spin" style={{ animationDuration: "3s" }} />
                <span className="font-semibold text-white tracking-wide">Compiling Interview Questions...</span>
              </div>
              
              <div className="space-y-3 flex-grow flex flex-col justify-center">
                <div className="text-zinc-500">Connecting to LLM services...</div>
                
                {/* Active logs */}
                <div className="border border-zinc-800 bg-zinc-950/60 p-4 rounded-lg text-indigo-400 font-mono text-[10px] space-y-1 mt-2 min-h-[80px]">
                  {loaderMessages.slice(0, loaderStep).map((msg, idx) => (
                    <div key={idx} className="opacity-50 font-sans">✓ {msg}</div>
                  ))}
                  <div className="text-white animate-pulse font-sans">
                    &gt; {loaderMessages[loaderStep]}<span className="terminal-loader"></span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-zinc-800 h-[3px] rounded overflow-hidden mt-8">
                <motion.div 
                  className="bg-indigo-500 h-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 11, ease: "linear" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
