"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight, Upload, Brain, BarChart3, Code2, TrendingUp, Database, Palette, Shield, LineChart, Briefcase } from "lucide-react";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";

const ROLES = [
  "Frontend Engineer",
  "Data Analyst",
  "Product Manager",
  "DevOps Engineer",
  "Financial Analyst",
  "Backend Developer",
  "ML Engineer",
  "UX Researcher",
];

const STEPS = [
  {
    num: "01",
    icon: Upload,
    title: "Upload your resume",
    desc: "Paste your CV or upload a PDF. Our parser extracts your skills, experience, and projects to personalize every question.",
  },
  {
    num: "02",
    icon: Brain,
    title: "AI generates questions",
    desc: "Choose a role, difficulty, and question type. The AI crafts 10 targeted questions based on your actual background.",
  },
  {
    num: "03",
    icon: BarChart3,
    title: "Get scored & improve",
    desc: "Each answer is evaluated on technical depth, communication, and clarity. Get actionable feedback to close your gaps.",
  },
];

const ROLE_CARDS = [
  { icon: Code2, name: "Frontend Engineer", color: "text-orange-400" },
  { icon: Database, name: "Backend Developer", color: "text-amber-400" },
  { icon: LineChart, name: "Data Analyst", color: "text-orange-300" },
  { icon: Brain, name: "ML Engineer", color: "text-yellow-400" },
  { icon: Briefcase, name: "Product Manager", color: "text-amber-300" },
  { icon: Shield, name: "DevOps Engineer", color: "text-orange-400" },
  { icon: TrendingUp, name: "Financial Analyst", color: "text-yellow-300" },
  { icon: Palette, name: "UX Researcher", color: "text-amber-400" },
];

function useTilt() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { damping: 20, stiffness: 150 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { damping: 20, stiffness: 150 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const onLeave = () => { x.set(0); y.set(0); };

  return { rotateX, rotateY, onMove, onLeave };
}

function StepCard({ step, i }: { step: typeof STEPS[0]; i: number }) {
  const { rotateX, rotateY, onMove, onLeave } = useTilt();
  return (
    <motion.div
      initial={{ opacity: 0, x: i === 0 ? -60 : i === 2 ? 60 : 0, y: i === 1 ? 60 : 0 }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay: i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="group relative p-8 rounded-2xl border border-zinc-800/60 bg-zinc-900/20 hover:border-orange-500/30 hover:bg-zinc-900/50 hover:shadow-[0_0_40px_rgba(249,115,22,0.06)] transition-all duration-500 cursor-default"
    >
      <div className="flex items-center gap-4 mb-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 group-hover:bg-orange-500/20 group-hover:scale-110 transition-all duration-300">
          <step.icon className="h-7 w-7" />
        </div>
        <span className="text-sm font-bold text-zinc-600 group-hover:text-orange-400/60 transition-colors duration-300">{step.num}</span>
      </div>
      <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-orange-50 transition-colors duration-300">{step.title}</h3>
      <p className="text-base text-zinc-500 leading-relaxed">{step.desc}</p>
    </motion.div>
  );
}

function RoleCard({ role, i }: { role: typeof ROLE_CARDS[0]; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: i * 0.07 }}
      whileHover={{ y: -6, scale: 1.03 }}
      className="group flex flex-col items-center gap-4 p-7 rounded-xl border border-zinc-800/50 bg-zinc-900/10 hover:border-orange-500/30 hover:bg-zinc-900/40 hover:shadow-[0_8px_30px_rgba(249,115,22,0.08)] transition-all duration-300 cursor-default"
    >
      <motion.div whileHover={{ rotate: 12, scale: 1.15 }} transition={{ type: "spring", stiffness: 300 }}>
        <role.icon className={`h-9 w-9 ${role.color} opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />
      </motion.div>
      <span className="text-sm font-medium text-zinc-400 group-hover:text-white transition-colors duration-300 text-center">
        {role.name}
      </span>
    </motion.div>
  );
}

export default function LandingPage() {
  const { status } = useSession();
  const [hasApiKey, setHasApiKey] = useState(true);
  const [roleIndex, setRoleIndex] = useState(0);

  const handleStartPractice = (e: React.MouseEvent) => {
    if (status !== "authenticated") {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("trigger-login-modal"));
    }
  };

  // Scroll parallax refs
  const stepsRef = useRef<HTMLElement>(null);
  const rolesRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  // Page Scroll Progress
  const { scrollYProgress: pageScrollProgress } = useScroll();
  const scaleX = useSpring(pageScrollProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Parallax drifting orbs
  const { scrollY } = useScroll();
  const orb1Y = useTransform(scrollY, [0, 1000], [0, 180]);
  const orb2Y = useTransform(scrollY, [0, 1000], [0, -180]);

  // Section specific parallax shifts
  const { scrollYProgress: stepsProgress } = useScroll({ target: stepsRef, offset: ["start end", "end start"] });
  const stepsY = useTransform(stepsProgress, [0, 1], [80, -80]);

  const { scrollYProgress: rolesProgress } = useScroll({ target: rolesRef, offset: ["start end", "end start"] });
  const rolesY = useTransform(rolesProgress, [0, 1], [60, -60]);

  const { scrollYProgress: statsProgress } = useScroll({ target: statsRef, offset: ["start end", "end start"] });
  const statsScale = useTransform(statsProgress, [0, 0.5, 1], [0.92, 1, 0.92]);

  const { scrollYProgress: ctaProgress } = useScroll({ target: ctaRef, offset: ["start end", "end start"] });
  const ctaY = useTransform(ctaProgress, [0, 1], [60, -60]);

  useEffect(() => {
    const key = localStorage.getItem("grill_api_key");
    const defaultKeySet = process.env.NEXT_PUBLIC_HAS_DEFAULT_KEY === "true";
    setHasApiKey(!!key || defaultKeySet);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setRoleIndex((prev) => (prev + 1) % ROLES.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-black text-white relative">
      {/* Top Scroll Indicator Line */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-orange-500 origin-left z-50 shadow-[0_0_10px_rgba(249,115,22,0.5)]"
        style={{ scaleX }}
      />
      
      <Header />

      {!hasApiKey && (
        <div className="border-b border-zinc-800/60 text-zinc-500 px-4 py-2 text-center text-sm font-medium z-30">
          Running in sandbox mode — configure your API key via ⚙️ settings for live AI responses.
        </div>
      )}

      {/* ─── HERO ─── */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 overflow-hidden">
        {/* Background orbs with scroll parallax drift */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            style={{ y: orb1Y }}
            className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-orange-500/[0.06] blur-[140px]" 
          />
          <motion.div 
            style={{ y: orb2Y }}
            className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-amber-500/[0.04] blur-[120px]" 
          />
        </div>

        <div className="max-w-4xl w-full text-center space-y-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-6"
          >
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-[1.05]">
              <span className="text-white">Get grilled.</span>
              <br />
              <span className="text-white">Get </span>
              <motion.span
                key={roleIndex}
                initial={{ y: 40, opacity: 0, filter: "blur(8px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="inline-block bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent"
              >
                hired.
              </motion.span>
            </h1>

            <p className="text-zinc-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
              Upload your resume, pick a role, and face 10 AI-generated
              interview questions tailored to your experience.
            </p>
          </motion.div>

          {/* Rotating role pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex justify-center"
          >
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-zinc-800/80 bg-zinc-900/30 hover:border-orange-500/20 transition-colors duration-300">
              <span className="text-sm text-zinc-500 font-medium">Preparing for</span>
              <motion.span
                key={roleIndex}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="text-sm font-semibold text-orange-400"
              >
                {ROLES[roleIndex]}
              </motion.span>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link onClick={handleStartPractice} href="/setup" className="group relative inline-flex items-center gap-2.5 bg-orange-500 text-black font-semibold text-base px-9 py-3.5 rounded-full overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(249,115,22,0.3)]">
              <span className="relative z-10">Start practice</span>
              <ArrowRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1" />
              <motion.div
                className="absolute inset-0 bg-orange-400"
                initial={{ x: "-100%" }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 border border-zinc-800 text-zinc-400 hover:text-white font-medium text-base px-9 py-3.5 rounded-full hover:border-orange-500/30 hover:shadow-[0_0_20px_rgba(249,115,22,0.06)] transition-all duration-300"
            >
              View dashboard
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-10 rounded-full border-2 border-zinc-700 flex items-start justify-center pt-2"
          >
            <div className="w-1.5 h-2 rounded-full bg-zinc-500" />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section ref={stepsRef} className="py-32 px-6 relative overflow-hidden">
        <motion.div style={{ y: stepsY }} className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="text-center mb-20"
          >
            <span className="text-sm font-semibold text-orange-400 uppercase tracking-widest">How it works</span>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mt-4">Three steps to interview-ready</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <StepCard key={step.num} step={step} i={i} />
            ))}
          </div>
        </motion.div>
      </section>

      {/* ─── SUPPORTED ROLES ─── */}
      <section ref={rolesRef} className="py-32 px-6 border-t border-zinc-800/40 overflow-hidden">
        <motion.div style={{ y: rolesY }} className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="text-center mb-20"
          >
            <span className="text-sm font-semibold text-orange-400 uppercase tracking-widest">Roles</span>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mt-4">Practice for any position</h2>
            <p className="text-zinc-500 text-lg mt-4 max-w-xl mx-auto">
              Each role generates domain-specific questions — coding challenges for engineers,
              case studies for PMs, modeling for analysts.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {ROLE_CARDS.map((role, i) => (
              <RoleCard key={role.name} role={role} i={i} />
            ))}
          </div>
        </motion.div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section ref={statsRef} className="py-28 px-6 border-t border-zinc-800/40 overflow-hidden">
        <motion.div
          style={{ scale: statsScale }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-12 sm:gap-8"
        >
          {[
            { val: "10", label: "Tailored questions per session" },
            { val: "3", label: "Scoring dimensions per answer" },
            { val: "∞", label: "Practice sessions, no limits" },
          ].map((stat, i) => (
            <React.Fragment key={stat.val}>
              {i > 0 && <div className="hidden sm:block w-px h-16 bg-zinc-800" />}
              <motion.div
                className="text-center flex-1 group cursor-default"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                whileHover={{ scale: 1.08 }}
              >
                <div className="text-6xl font-bold text-white group-hover:text-orange-400 transition-colors duration-300">{stat.val}</div>
                <div className="text-base text-zinc-500 mt-2">{stat.label}</div>
              </motion.div>
            </React.Fragment>
          ))}
        </motion.div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section ref={ctaRef} className="py-36 px-6 border-t border-zinc-800/40 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-orange-500/[0.05] blur-[140px]" />
        </div>

        <motion.div
          style={{ y: ctaY }}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto text-center relative z-10 space-y-8"
        >
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-bold text-white">Ready to get grilled?</h2>
          <p className="text-zinc-400 text-lg sm:text-xl max-w-lg mx-auto">
            Your next interview doesn&apos;t have to be your first practice run.
          </p>
          <Link onClick={handleStartPractice} href="/setup" className="group relative inline-flex items-center gap-2.5 bg-orange-500 text-black font-semibold text-base px-10 py-4 rounded-full overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(249,115,22,0.3)]">
            <span className="relative z-10">Start your first session</span>
            <ArrowRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1" />
            <motion.div
              className="absolute inset-0 bg-orange-400"
              initial={{ x: "-100%" }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.3 }}
            />
          </Link>
        </motion.div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-zinc-900 bg-black py-16 px-6 relative overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10">
          <div className="space-y-2">
            <span className="text-2xl font-bold tracking-wider text-white">
              GRILL<span className="text-orange-400">AI</span>
            </span>
            <p className="text-xs font-semibold text-zinc-550 tracking-widest uppercase">
              Fueled by Fire. Powered by AI.
            </p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-xs text-zinc-600 font-semibold tracking-wider uppercase">
              © 2026 GrillAI • Built by Sahaj Sharma
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
