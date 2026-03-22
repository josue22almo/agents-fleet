"use client";

import { useState } from "react";
import { Copy, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AgentWithTokenResponse } from "@repo/contracts/agents";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function TokenDisplay({ agent }: { agent: AgentWithTokenResponse }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"mcp" | "http">("mcp");

  async function copyToken() {
    await navigator.clipboard.writeText(agent.connectionToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const truncatedToken = agent.connectionToken.length > 20
    ? agent.connectionToken.substring(0, 20) + "..."
    : agent.connectionToken;

  const mcpConfig = JSON.stringify(
    {
      mcpServers: {
        "agents-fleet": {
          url: `${API_URL}/mcp`,
          headers: {
            Authorization: `Bearer ${truncatedToken}`,
          },
        },
      },
    },
    null,
    2,
  );

  const httpExample = `curl -X POST ${API_URL}/ingest \\
  -H "Authorization: Bearer ${truncatedToken}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "event": "run.completed",
    "runId": "run_abc123",
    "data": {
      "durationMs": 2340,
      "tokensUsed": 1520,
      "cost": 0.0124
    }
  }'`;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold">Connection Token</h2>
        <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-0.5 text-xs font-medium">
          Created
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 rounded-lg bg-muted border border-border px-4 py-3 font-mono text-sm select-all break-all">
          {agent.connectionToken}
        </div>
        <Button variant="outline" size="icon" onClick={copyToken} className="shrink-0">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 mb-6">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
        <p className="text-sm text-amber-800">Save this token now. It won&apos;t be shown again.</p>
      </div>

      <div className="border-b border-border mb-4">
        <div className="flex gap-4">
          <button
            className={`text-sm font-medium pb-3 border-b-2 -mb-px transition-colors ${
              activeTab === "mcp"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("mcp")}
          >
            MCP Config
          </button>
          <button
            className={`text-sm font-medium pb-3 border-b-2 -mb-px transition-colors ${
              activeTab === "http"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("http")}
          >
            HTTP Usage
          </button>
        </div>
      </div>

      {activeTab === "mcp" ? (
        <div>
          <p className="text-sm text-muted-foreground mb-3">Add this to your MCP client configuration:</p>
          <div className="rounded-lg bg-gray-900 text-gray-100 p-4 font-mono text-sm overflow-x-auto">
            <pre>{mcpConfig}</pre>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm text-muted-foreground mb-3">Or use the HTTP API directly:</p>
          <div className="rounded-lg bg-gray-900 text-gray-100 p-4 font-mono text-sm overflow-x-auto">
            <pre>{httpExample}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
