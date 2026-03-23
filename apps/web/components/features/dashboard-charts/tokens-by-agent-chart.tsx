"use client";

interface Props {
  data: { agentId: string; agentName?: string; tokens: number }[];
}

export function TokensByAgentChart({ data }: Props) {
  const max = Math.max(...data.map((d) => d.tokens), 1);

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-sm font-semibold mb-4">Token Usage by Agent</h3>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data</p>
      ) : (
        <div className="space-y-3">
          {data.map((row) => (
            <div key={row.agentId} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-24 truncate" title={row.agentName ?? row.agentId}>
                {row.agentName ?? row.agentId.slice(0, 8)}
              </span>
              <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full"
                  style={{ width: `${(row.tokens / max) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium w-16 text-right tabular-nums">
                {row.tokens.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
