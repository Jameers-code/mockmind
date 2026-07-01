"use client";

import React, { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { LogIn, LogOut, Terminal, User as UserIcon, Settings, Mail } from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
  const { data: session, status } = useSession();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mockEmail, setMockEmail] = useState("candidate@grillai.io");
  const [mockName, setMockName] = useState("Candidate One");
  const [isBypassing, setIsBypassing] = useState(false);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [provider, setProvider] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("grill_ai_provider") || "groq";
    }
    return "groq";
  });
  const [apiKeyInput, setApiKeyInput] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("grill_api_key") || process.env.NEXT_PUBLIC_GROQ_API_KEY || "";
    }
    return "";
  });

  React.useEffect(() => {
    const handleTrigger = () => {
      if (status !== "authenticated") {
        setShowAuthModal(true);
      }
    };
    window.addEventListener("trigger-login-modal", handleTrigger);
    return () => window.removeEventListener("trigger-login-modal", handleTrigger);
  }, [status]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("grill_ai_provider", provider);
    localStorage.setItem("grill_api_key", apiKeyInput);
    toast.success("AI CONFIGURATION UPDATED");
    setShowSettingsModal(false);
    // Reload page to apply key configuration
    window.location.reload();
  };

  const handleMockLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBypassing(true);
    await signIn("credentials", {
      email: mockEmail,
      name: mockName,
      callbackUrl: "/dashboard",
    });
    setIsBypassing(false);
    setShowAuthModal(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <Terminal className="h-5 w-5 text-orange-400 group-hover:rotate-12 transition-transform duration-300" />
            <span className="text-lg font-bold tracking-widest text-white group-hover:text-orange-400 transition-colors">
              GRILL<span className="text-orange-400">AI</span>
            </span>
          </Link>
 
          {/* Nav / Actions */}
          <div className="flex items-center space-x-4">
            {/* Status Indicator */}
            <div className="hidden sm:flex items-center space-x-2 rounded-full border border-zinc-800 bg-zinc-900/40 px-3.5 py-1 text-[11px] font-medium tracking-wide text-zinc-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              <span>System Online</span>
            </div>
 
            {/* AI Key Settings button */}
            <button
              type="button"
              onClick={() => {
                setProvider(localStorage.getItem("grill_ai_provider") || "groq");
                setApiKeyInput(localStorage.getItem("grill_api_key") || process.env.NEXT_PUBLIC_GROQ_API_KEY || "");
                setShowSettingsModal(true);
              }}
              className="flex items-center justify-center p-1.5 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900 hover:border-zinc-750 text-zinc-400 hover:text-white transition-all duration-300"
              title="Configure LLM API Keys"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
 
            {status === "authenticated" && session?.user ? (
              <div className="flex items-center space-x-4 font-medium">
                <Link
                  href="/dashboard"
                  className="text-xs text-zinc-400 hover:text-orange-400 transition-colors"
                >
                  Dashboard
                </Link>
                <div className="flex items-center space-x-2">
                  {session.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      className="h-7 w-7 rounded-full border border-zinc-800"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900">
                      <UserIcon className="h-3.5 w-3.5 text-zinc-400" />
                    </div>
                  )}
                  <span className="hidden md:inline text-xs text-zinc-300">
                    {session.user.name}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center space-x-1 border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 hover:border-rose-500/30 px-3 py-1.5 rounded-lg text-xs text-zinc-300 transition-all duration-300"
                >
                  <LogOut className="h-3 w-3 text-rose-500" />
                  <span className="hidden sm:inline">Exit</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center space-x-1.5 border border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10 hover:border-orange-500 px-4 py-1.5 rounded-lg text-xs font-semibold text-orange-400 transition-all duration-300 animate-pulse"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>
 
      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            {/* Background glowing orb */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-orange-500/[0.04] blur-[80px] pointer-events-none" />

            <motion.div
              initial={{ scale: 0.96, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 15, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="w-full max-w-md border border-zinc-900 bg-[#09090b]/90 backdrop-blur-xl p-8 rounded-2xl relative shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-7 z-10"
            >
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-6 right-6 text-zinc-500 hover:text-white text-base transition-colors duration-200"
                aria-label="Close modal"
              >
                ✕
              </button>
              
              <div className="space-y-2 text-center">
                <h3 className="text-2xl font-bold tracking-tight text-white">Get Started Practice</h3>
                <p className="text-zinc-500 text-sm">Enter your credentials to initialize candidate dashboard access.</p>
              </div>
   
              <form onSubmit={handleMockLogin} className="space-y-5">
                {/* Name field */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">Candidate Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-650" />
                    <input
                      type="text"
                      required
                      value={mockName}
                      onChange={(e) => setMockName(e.target.value)}
                      className="w-full bg-black/40 border border-zinc-850 focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/20 rounded-lg pl-10 pr-4 py-3 text-sm text-white outline-none transition-all duration-200 placeholder:text-zinc-700"
                      placeholder="Jane Doe"
                    />
                  </div>
                </div>

                {/* Email field */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-650" />
                    <input
                      type="email"
                      required
                      value={mockEmail}
                      onChange={(e) => setMockEmail(e.target.value)}
                      className="w-full bg-black/40 border border-zinc-850 focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/20 rounded-lg pl-10 pr-4 py-3 text-sm text-white outline-none transition-all duration-200 placeholder:text-zinc-700"
                      placeholder="jane@company.com"
                    />
                  </div>
                </div>
                
                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isBypassing}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-450 text-black py-3.5 rounded-xl text-sm font-bold tracking-wider transition-all duration-300 transform active:scale-[0.98] shadow-[0_4px_20px_rgba(249,115,22,0.2)] hover:shadow-[0_4px_30px_rgba(249,115,22,0.35)]"
                >
                  {isBypassing ? "Accessing Portal..." : "ENTER PORTAL SIMULATOR →"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
 
      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md border border-zinc-800 bg-black/90 backdrop-blur-md p-6 rounded-xl relative shadow-2xl">
            <button
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white text-xs font-medium"
            >
              Close
            </button>
            
            <div className="flex items-center space-x-2 mb-6">
              <Settings className="h-5 w-5 text-orange-400 animate-[spin_6s_linear_infinite]" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Configuration Settings</h3>
            </div>
 
            <form onSubmit={handleSaveSettings} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-zinc-400 tracking-wider uppercase">Select LLM Provider</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProvider("groq")}
                    className={`py-2 rounded-lg text-xs font-semibold transition-all border ${
                       provider === "groq"
                        ? "bg-orange-500/10 border-orange-500 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.1)]"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
                    }`}
                  >
                    Groq Cloud
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvider("gemini")}
                    className={`py-2 rounded-lg text-xs font-semibold transition-all border ${
                      provider === "gemini"
                        ? "bg-orange-500/10 border-orange-500 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.1)]"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
                    }`}
                  >
                    Google Gemini
                  </button>
                </div>
              </div>
 
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                  <label className="text-zinc-400 font-semibold tracking-wider uppercase">{provider} API KEY</label>
                  <a
                    href={provider === "groq" ? "https://console.groq.com/keys" : "https://aistudio.google.com/"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-400 hover:underline flex items-center space-x-1"
                  >
                    <span>Get Free Key ↗</span>
                  </a>
                </div>
                <input
                  type="password"
                  placeholder={provider === "groq" ? "gsk_..." : "AIzaSy..."}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded-lg px-3 py-2 text-xs text-white outline-none placeholder:text-zinc-700"
                />
                <span className="block text-[10px] text-zinc-500 leading-relaxed">
                  Both keys have generous free tiers. All computations run in the cloud with no local installation or system resource usage.
                </span>
              </div>
              
              <button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-400 text-black px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-300"
              >
                Save Configuration
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
