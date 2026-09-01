"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Row {
  name: string;
  score: number;
  isYou: boolean;
}

export function CompetitorBarChart({ data }: { data: Row[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={36} />
        <Tooltip
          cursor={{ fill: "hsl(var(--secondary))" }}
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="score" radius={[6, 6, 0, 0]}>
          {data.map((row) => (
            <Cell key={row.name} fill={row.isYou ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.4)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
