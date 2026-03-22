"use client";

import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface SimulationLog {
  step: number;
  total: number;
  label: string;
  status: "pending" | "running" | "success" | "error";
  detail?: string;
  durationMs?: number;
}

interface SimulationState {
  isRunning: boolean;
  isDone: boolean;
  logs: SimulationLog[];
  createdAgentId: string | null;
}

async function ingestEvent(
  connectionToken: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_URL}/ingest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${connectionToken}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new Error(errBody?.error?.message ?? `Ingest failed with status ${res.status}`);
  }
  return res.json();
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useMcpSimulation(organizationId: string) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<SimulationState>({
    isRunning: false,
    isDone: false,
    logs: [],
    createdAgentId: null,
  });
  const abortRef = useRef(false);

  const TOTAL_STEPS = 13;

  const addLog = useCallback(
    (step: number, label: string, status: SimulationLog["status"], detail?: string) => {
      setState((prev) => {
        const existing = prev.logs.findIndex((l) => l.step === step);
        const entry: SimulationLog = { step, total: TOTAL_STEPS, label, status, detail };
        if (existing >= 0) {
          const updated = [...prev.logs];
          updated[existing] = entry;
          return { ...prev, logs: updated };
        }
        return { ...prev, logs: [...prev.logs, entry] };
      });
    },
    [],
  );

  const updateLog = useCallback(
    (step: number, updates: Partial<SimulationLog>) => {
      setState((prev) => {
        const updated = prev.logs.map((l) => (l.step === step ? { ...l, ...updates } : l));
        return { ...prev, logs: updated };
      });
    },
    [],
  );

  const startSimulation = useCallback(async () => {
    abortRef.current = false;
    setState({ isRunning: true, isDone: false, logs: [], createdAgentId: null });

    const timestamp = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    if (!organizationId) {
      addLog(1, "No organization selected", "error");
      setState((prev) => ({ ...prev, isRunning: false, isDone: true }));
      return;
    }

    try {
      // Step 1: Create agent
      addLog(1, "Creating agent...", "running");
      const t0 = performance.now();
      const agent = await api.agents.create({
        name: `Simulation Agent \u2014 ${timestamp}`,
        type: "claude",
        organizationId,
      });
      const agentId = agent.id;
      const connectionToken = agent.connectionToken;
      updateLog(1, {
        status: "success",
        durationMs: Math.round(performance.now() - t0),
        detail: `Agent created: ${agent.name} (token: ${connectionToken.slice(0, 8)}...)`,
      });
      setState((prev) => ({ ...prev, createdAgentId: agentId }));
      if (abortRef.current) return;

      // Step 2: start_session
      addLog(2, 'start_session("Demo: Code Review")', "running");
      const t2 = performance.now();
      const sessionResult = await ingestEvent(connectionToken, {
        event: "session.started",
        timestamp: new Date().toISOString(),
        data: { name: "Demo: Code Review" },
      });
      const sessionId = (sessionResult as { id?: string }).id;
      updateLog(2, {
        status: "success",
        durationMs: Math.round(performance.now() - t2),
        detail: `Session created: ${sessionId}`,
      });
      if (abortRef.current) return;

      // Step 3: report_run_started (run_001)
      addLog(3, "report_run_started(run_001)", "running");
      const t3 = performance.now();
      await ingestEvent(connectionToken, {
        event: "run.started",
        runId: "sim_run_001",
        sessionId,
        timestamp: new Date().toISOString(),
      });
      updateLog(3, {
        status: "success",
        durationMs: Math.round(performance.now() - t3),
      });
      if (abortRef.current) return;

      // Step 4: Wait 2s
      addLog(4, "Simulating work... (2s delay)", "running");
      await wait(2000);
      updateLog(4, { status: "success", durationMs: 2000 });
      if (abortRef.current) return;

      // Step 5: report_run_completed (run_001)
      addLog(5, "report_run_completed(run_001)", "running");
      const t5 = performance.now();
      await ingestEvent(connectionToken, {
        event: "run.completed",
        runId: "sim_run_001",
        timestamp: new Date().toISOString(),
        data: { durationMs: 2300, tokensUsed: 450, cost: 0.12 },
      });
      updateLog(5, {
        status: "success",
        durationMs: Math.round(performance.now() - t5),
        detail: "Completed: 2.3s, 450 tokens, $0.12",
      });
      if (abortRef.current) return;

      // Step 6: report_run_started (run_002)
      addLog(6, "report_run_started(run_002)", "running");
      const t6 = performance.now();
      await ingestEvent(connectionToken, {
        event: "run.started",
        runId: "sim_run_002",
        sessionId,
        timestamp: new Date().toISOString(),
      });
      updateLog(6, {
        status: "success",
        durationMs: Math.round(performance.now() - t6),
      });
      if (abortRef.current) return;

      // Step 7: Wait 1s
      addLog(7, "Simulating work... (1s delay)", "running");
      await wait(1000);
      updateLog(7, { status: "success", durationMs: 1000 });
      if (abortRef.current) return;

      // Step 8: report_run_failed (run_002)
      addLog(8, "report_run_failed(run_002)", "running");
      const t8 = performance.now();
      await ingestEvent(connectionToken, {
        event: "run.failed",
        runId: "sim_run_002",
        timestamp: new Date().toISOString(),
        data: { error: "Rate limit exceeded" },
      });
      updateLog(8, {
        status: "error",
        durationMs: Math.round(performance.now() - t8),
        detail: "Error: Rate limit exceeded (intentional)",
      });
      if (abortRef.current) return;

      // Step 9: report_run_started (run_003 — retry)
      addLog(9, "report_run_started(run_003) — retry", "running");
      const t9 = performance.now();
      await ingestEvent(connectionToken, {
        event: "run.started",
        runId: "sim_run_003",
        sessionId,
        timestamp: new Date().toISOString(),
      });
      updateLog(9, {
        status: "success",
        durationMs: Math.round(performance.now() - t9),
      });
      if (abortRef.current) return;

      // Step 10: Wait 1.5s
      addLog(10, "Simulating work... (1.5s delay)", "running");
      await wait(1500);
      updateLog(10, { status: "success", durationMs: 1500 });
      if (abortRef.current) return;

      // Step 11: report_run_completed (run_003)
      addLog(11, "report_run_completed(run_003)", "running");
      const t11 = performance.now();
      await ingestEvent(connectionToken, {
        event: "run.completed",
        runId: "sim_run_003",
        timestamp: new Date().toISOString(),
        data: { durationMs: 1800, tokensUsed: 380, cost: 0.09 },
      });
      updateLog(11, {
        status: "success",
        durationMs: Math.round(performance.now() - t11),
        detail: "Completed: 1.8s, 380 tokens, $0.09",
      });
      if (abortRef.current) return;

      // Step 12: end_session
      addLog(12, "end_session(completed)", "running");
      const t12 = performance.now();
      await ingestEvent(connectionToken, {
        event: "session.completed",
        sessionId,
        timestamp: new Date().toISOString(),
      });
      updateLog(12, {
        status: "success",
        durationMs: Math.round(performance.now() - t12),
        detail: "Session completed",
      });
      if (abortRef.current) return;

      // Step 13: get_my_sessions
      addLog(13, "get_my_sessions()", "running");
      const t13 = performance.now();
      const sessions = await api.agents.sessions(agentId);
      const sessionData = sessions.data[0];
      updateLog(13, {
        status: "success",
        durationMs: Math.round(performance.now() - t13),
        detail: sessionData
          ? `Session "${sessionData.name}": ${sessionData.runCount} runs, Status: ${sessionData.status}`
          : `Sessions: ${sessions.total} total`,
      });

      // Invalidate caches
      await queryClient.invalidateQueries({ queryKey: ["agents"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });

      setState((prev) => ({ ...prev, isRunning: false, isDone: true }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setState((prev) => {
        const runningStep = prev.logs.find((l) => l.status === "running");
        if (runningStep) {
          const updated = prev.logs.map((l) =>
            l.step === runningStep.step ? { ...l, status: "error" as const, detail: message } : l,
          );
          return { ...prev, logs: updated, isRunning: false, isDone: true };
        }
        return { ...prev, isRunning: false, isDone: true };
      });
    }
  }, [organizationId, queryClient, addLog, updateLog]);

  const reset = useCallback(() => {
    abortRef.current = true;
    setState({ isRunning: false, isDone: false, logs: [], createdAgentId: null });
  }, []);

  return {
    ...state,
    startSimulation,
    reset,
  };
}
