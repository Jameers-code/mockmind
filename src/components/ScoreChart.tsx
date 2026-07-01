"use client";

import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface ChartDataPoint {
  name: string;
  score: number;
}

export default function ScoreChart({ data }: { data: ChartDataPoint[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-64 w-full bg-zinc-900/10 animate-pulse rounded-lg border border-zinc-800 flex items-center justify-center">
        <span className="text-xs text-zinc-550">Loading chart...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-64 w-full bg-zinc-950/40 border border-zinc-800 rounded-lg flex items-center justify-center">
        <span className="text-xs text-zinc-500">No score history available yet</span>
      </div>
    );
  }

  return (
    <div className="h-64 w-full text-xs font-sans">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="rgba(255,255,255,0.2)" 
            fontSize={9} 
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.2)" 
            fontSize={9} 
            tickLine={false}
            axisLine={false}
            domain={[0, 10]} 
            ticks={[0, 2, 4, 6, 8, 10]} 
          />
          <Tooltip
            contentStyle={{
              background: "#09090b",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "8px",
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "11px",
              color: "#ffffff"
            }}
            itemStyle={{ color: "#6366f1" }}
            cursor={{ stroke: "rgba(99,102,241,0.08)" }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#6366f1"
            strokeWidth={2}
            dot={{ fill: "#050508", stroke: "#6366f1", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: "#8b5cf6", strokeWidth: 2, fill: "#8b5cf6" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
