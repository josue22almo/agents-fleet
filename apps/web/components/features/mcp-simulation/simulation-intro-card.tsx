"use client";

import { Play, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SimulationIntroCardProps {
  onStart: () => void;
  isRunning: boolean;
}

export function SimulationIntroCard({ onStart, isRunning }: SimulationIntroCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm mb-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100">
          <Terminal className="h-5 w-5 text-violet-700" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold mb-2">MCP Simulation</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Run a live end-to-end simulation that demonstrates how agents report data through the
            MCP ingest API. This creates a real agent and sends real events.
          </p>

          <ol className="text-sm text-muted-foreground space-y-1.5 mb-4 list-none">
            <li className="flex items-start gap-2">
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 text-xs font-medium">
                1
              </span>
              <span>Create a new agent and obtain a connection token</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 text-xs font-medium">
                2
              </span>
              <span>Report a successful run via the ingest API</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 text-xs font-medium">
                3
              </span>
              <span>Report a failed run (intentional error) and a retry</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 text-xs font-medium">
                4
              </span>
              <span>Fetch final agent metrics to verify everything worked</span>
            </li>
          </ol>

          <p className="text-xs text-muted-foreground mb-4">
            Uses the real API with a live connection token &mdash; not mocked.
          </p>

          <Button onClick={onStart} disabled={isRunning}>
            <Play className="h-4 w-4 mr-2" />
            {isRunning ? "Running..." : "Start Simulation"}
          </Button>
        </div>
      </div>
    </div>
  );
}
