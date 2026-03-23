"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#f87171", "#fb923c", "#a78bfa", "#d1d5db"];

interface Props {
  data: { type: string; count: number }[];
}

export function ErrorBreakdownChart({ data }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-sm font-semibold mb-4">Error Breakdown</h3>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No errors recorded</p>
      ) : (
        <div className="flex items-center gap-6">
          <ResponsiveContainer width={128} height={128}>
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={56}
                strokeWidth={0}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2">
            {data.map((row, i) => (
              <div key={row.type} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-muted-foreground">{row.type}</span>
                <span className="font-medium">{row.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
