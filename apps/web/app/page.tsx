"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const TOTAL_SLIDES = 8;

const GITHUB_URL = "https://github.com/josue22almo/agents-fleet";
const TEST_REPORTS_URL = "https://josue22almo.github.io/agents-fleet/";

function SlideHero() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 relative">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-6">
        <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold tracking-tight text-white">
          Agents Fleet
        </h1>
        <p className="text-xl sm:text-2xl text-gray-300 max-w-2xl">
          AI Agent Monitoring Dashboard
        </p>
        <p className="text-lg text-gray-400 mt-2">
          Built by <span className="text-purple-400 font-medium">Josué Alcántara</span>
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-lg border border-gray-700 text-gray-300 hover:border-purple-500 hover:text-white transition-all"
          >
            GitHub Repo
          </a>
          <a
            href={TEST_REPORTS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-lg border border-gray-700 text-gray-300 hover:border-purple-500 hover:text-white transition-all"
          >
            Test Reports
          </a>
          <Link
            href="/login"
            className="px-6 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-500 transition-all"
          >
            Enter App &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

function SlideTheProblem() {
  const cards = [
    {
      icon: (
        <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Performance & Duration",
      desc: "No way to track how long agent runs take or identify bottlenecks across teams.",
    },
    {
      icon: (
        <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Costs & Token Usage",
      desc: "Token consumption and costs are invisible, making budget planning impossible.",
    },
    {
      icon: (
        <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      title: "Failures & Error Rates",
      desc: "Agent failures go unnoticed until users report them — no proactive monitoring.",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">The Problem</h2>
      <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mb-12">
        Engineers run AI agents across their organizations but lack visibility into:
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        {cards.map((c) => (
          <div
            key={c.title}
            className="flex flex-col items-center gap-4 p-8 rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur"
          >
            {c.icon}
            <h3 className="text-lg font-semibold text-white">{c.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideTheSolution() {
  const steps = [
    { label: "Connect Agents", sub: "Register your AI agents" },
    { label: "Ingest Events", sub: "MCP / HTTP protocols" },
    { label: "Monitor Dashboard", sub: "Real-time visibility" },
  ];

  const features = ["Multi-tenant orgs", "Role-based access", "Real-time metrics"];

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <h2 className="text-4xl sm:text-5xl font-bold text-white mb-12">The Solution</h2>
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-2 mb-14 max-w-4xl">
        {steps.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2 sm:gap-0">
            <div className="flex flex-col items-center gap-2 px-6 py-5 rounded-xl border border-purple-500/40 bg-purple-900/20 min-w-[180px]">
              <span className="text-lg font-semibold text-white">{s.label}</span>
              <span className="text-sm text-gray-400">{s.sub}</span>
            </div>
            {i < steps.length - 1 && (
              <svg className="w-6 h-6 text-purple-400 hidden sm:block mx-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        {features.map((f) => (
          <span
            key={f}
            className="px-5 py-2 rounded-full border border-gray-700 text-gray-300 text-sm"
          >
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}

function SlideArchitecture() {
  const contexts = [
    { name: "IAM", desc: "Auth, Users, Orgs, Roles" },
    { name: "Agents", desc: "Agent CRUD, Connections" },
    { name: "Monitoring", desc: "Runs, Metrics, Alarms" },
  ];

  const techBadges = ["Next.js 16", "NestJS", "Supabase", "TypeScript", "Turborepo", "Zod"];

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">Architecture</h2>
      <p className="text-purple-400 font-medium text-lg mb-10">DDD + Hexagonal Architecture</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full mb-8">
        {contexts.map((c) => (
          <div
            key={c.name}
            className="flex flex-col items-center gap-2 p-6 rounded-xl border border-purple-500/30 bg-purple-900/10"
          >
            <span className="text-xl font-bold text-white">{c.name}</span>
            <span className="text-sm text-gray-400">{c.desc}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-3 mb-8">
        <span className="px-3 py-1 rounded-md bg-gray-800 text-gray-300 text-xs border border-gray-700">
          IAMContextPort
        </span>
        <span className="px-3 py-1 rounded-md bg-gray-800 text-gray-300 text-xs border border-gray-700">
          Domain Events
        </span>
        <span className="text-gray-500 text-xs self-center">cross-context communication</span>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {techBadges.map((b) => (
          <span
            key={b}
            className="px-3 py-1 rounded-full bg-purple-600/20 text-purple-300 text-xs font-medium border border-purple-500/20"
          >
            {b}
          </span>
        ))}
      </div>
    </div>
  );
}

function SlideAIFirst() {
  const steps = [
    "PRDs",
    "Mockups",
    "Architecture Docs",
    "Implementation Plans",
    "Parallel Agent Execution",
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <h2 className="text-4xl sm:text-5xl font-bold text-white mb-12">AI-First Development</h2>

      <div className="flex flex-wrap items-center justify-center gap-3 mb-12 max-w-4xl">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <span className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-800/60 text-gray-200 text-sm font-medium">
              {s}
            </span>
            {i < steps.length - 1 && (
              <svg className="w-4 h-4 text-purple-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </div>
        ))}
      </div>

      <p className="text-lg text-gray-300 max-w-2xl mb-6">
        Built with <span className="text-purple-400 font-medium">Claude Code</span> using parallel
        subagents for independent workstreams
      </p>
      <p className="text-gray-500">
        8 workstreams executed in parallel phases
      </p>
    </div>
  );
}

function SlideTestCoverage() {
  const stats = [
    { number: "268+", label: "Unit Tests" },
    { number: "30", label: "E2E Tests" },
    { number: "100%", label: "CI/CD" },
  ];

  const frameworks = ["Vitest", "Playwright", "GitHub Actions"];

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <h2 className="text-4xl sm:text-5xl font-bold text-white mb-12">Test Coverage</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl w-full mb-12">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-2">
            <span className="text-5xl sm:text-6xl font-bold text-purple-400">{s.number}</span>
            <span className="text-gray-400 text-lg">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-3 mb-10">
        {frameworks.map((f) => (
          <span
            key={f}
            className="px-4 py-2 rounded-full border border-gray-700 text-gray-300 text-sm"
          >
            {f}
          </span>
        ))}
      </div>

      <a
        href={TEST_REPORTS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
      >
        View Test Reports &rarr;
      </a>
    </div>
  );
}

function SlideHowToTest() {
  const steps = [
    <>Click &ldquo;Enter App&rdquo; on the next slide</>,
    <>Use the dev toolbar (bottom-right corner) for test credentials</>,
    <>
      Login as <code className="px-2 py-0.5 rounded bg-gray-800 text-purple-300 text-sm">alice@test.com</code>{" "}
      / <code className="px-2 py-0.5 rounded bg-gray-800 text-purple-300 text-sm">password123</code>
    </>,
    <>Explore: Dashboard &rarr; Switch org &rarr; Agents &rarr; Agent detail &rarr; Create agent</>,
    <>
      MCP server available at <code className="px-2 py-0.5 rounded bg-gray-800 text-purple-300 text-sm">/mcp</code> for agent integration
    </>,
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <h2 className="text-4xl sm:text-5xl font-bold text-white mb-12">How to Test</h2>
      <ol className="flex flex-col gap-5 text-left max-w-2xl w-full">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-4 items-start">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600/30 text-purple-300 font-bold text-sm shrink-0 mt-0.5">
              {i + 1}
            </span>
            <span className="text-gray-300 text-lg leading-relaxed">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function SlideCTA() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center relative">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-8">
        <Link
          href="/login"
          className="px-12 py-5 rounded-xl bg-purple-600 text-white text-2xl font-bold hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/25 hover:shadow-purple-500/40"
        >
          Enter App &rarr;
        </Link>
        <div className="flex flex-wrap items-center justify-center gap-6 mt-4">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-purple-400 transition-colors"
          >
            GitHub Repo
          </a>
          <a
            href={TEST_REPORTS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-purple-400 transition-colors"
          >
            Test Reports
          </a>
        </div>
        <p className="text-gray-500 mt-6 text-lg">Thank you for reviewing</p>
      </div>
    </div>
  );
}

const SLIDES = [
  SlideHero,
  SlideTheProblem,
  SlideTheSolution,
  SlideArchitecture,
  SlideAIFirst,
  SlideTestCoverage,
  SlideHowToTest,
  SlideCTA,
];

export default function PresentationPage() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [isAnimating, setIsAnimating] = useState(false);

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= TOTAL_SLIDES || index === current || isAnimating) return;
      setDirection(index > current ? "right" : "left");
      setIsAnimating(true);
      setCurrent(index);
      setTimeout(() => setIsAnimating(false), 400);
    },
    [current, isAnimating],
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [next, prev]);

  const SlideComponent = SLIDES[current] as React.ComponentType;

  return (
    <div className="fixed inset-0 bg-linear-to-br from-gray-950 via-gray-900 to-purple-950 overflow-hidden select-none">
      {/* Slide content */}
      <div
        key={current}
        className="absolute inset-0"
        style={{
          animation: isAnimating
            ? `slideIn${direction === "right" ? "Right" : "Left"} 0.4s ease-out forwards`
            : undefined,
        }}
      >
        <SlideComponent />
      </div>

      {/* Left arrow */}
      {current > 0 && (
        <button
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-gray-800/60 hover:bg-gray-700/80 text-gray-400 hover:text-white transition-all z-20"
          aria-label="Previous slide"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Right arrow */}
      {current < TOTAL_SLIDES - 1 && (
        <button
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-gray-800/60 hover:bg-gray-700/80 text-gray-400 hover:text-white transition-all z-20"
          aria-label="Next slide"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Dots navigation */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === current
                ? "bg-purple-500 w-8"
                : "bg-gray-600 hover:bg-gray-400"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Slide counter */}
      <div className="absolute top-4 right-4 text-gray-500 text-sm z-20">
        {current + 1} / {TOTAL_SLIDES}
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(60px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-60px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
