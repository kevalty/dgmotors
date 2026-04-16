"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";

interface BarData { label: string; value: number; value2?: number }

export function SimpleBarChart({
  data,
  height = 200,
  color = "hsl(var(--primary))",
  label = "Total",
}: {
  data: BarData[];
  height?: number;
  color?: string;
  label?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data.map((d) => ({ name: d.label, total: d.value }))} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false}
          tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
        <Tooltip
          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
          formatter={(v) => [`$${Number(v ?? 0).toLocaleString("es-EC", { minimumFractionDigits: 2 })}`, label]}
        />
        <Bar dataKey="total" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DualLineChart({
  data,
  height = 200,
  label1 = "Ventas",
  label2 = "Compras",
}: {
  data: { label: string; v1: number; v2: number }[];
  height?: number;
  label1?: string;
  label2?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data.map((d) => ({ name: d.label, [label1]: d.v1, [label2]: d.v2 }))} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false}
          tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
        <Tooltip
          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
          formatter={(v) => [`$${Number(v ?? 0).toLocaleString("es-EC", { minimumFractionDigits: 2 })}`, ""]}
        />
        <Legend />
        <Line type="monotone" dataKey={label1} stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey={label2} stroke="#f97316" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
