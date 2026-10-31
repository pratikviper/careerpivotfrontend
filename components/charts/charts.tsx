"use client"

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--foreground)",
}

export function BarCompareChart({
  data,
  xKey,
  bars,
  height = 240,
}: {
  data: Array<Record<string, string | number | null>>
  xKey: string
  bars: Array<{ key: string; name: string; color: string }>
  height?: number
}) {
  if (data.length === 0) return null
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey={xKey} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} width={32} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
          {bars.map((bar) => (
            <Bar key={bar.key} dataKey={bar.key} name={bar.name} fill={bar.color} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ScoreBars({ data }: { data: Array<{ name: string; score: number }> }) {
  if (data.length === 0) return null
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" horizontal={false} />
          <XAxis type="number" domain={[0, 10]} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={148} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="score" name="Score" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function TrendChart({ data }: { data: Array<{ label: string; score: number }> }) {
  if (data.length === 0) return null
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 10]} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} width={32} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="score" name="Score" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
