"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#0d9488", "#f59e0b", "#e11d48", "#64748b", "#0ea5e9"];

export function BarStat({ data, dataKey, labelKey }: { data: Record<string, any>[]; dataKey: string; labelKey: string }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <XAxis dataKey={labelKey} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey={dataKey} fill="#0d9488" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PieStat({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
