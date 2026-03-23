"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  data: { bucket: string; count: number }[];
}

export function RunDurationHistogram({ data }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-sm font-semibold mb-4">Run Duration Distribution</h3>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data}>
            <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
