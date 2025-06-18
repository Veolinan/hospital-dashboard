// src/components/FlaggedLineChart.jsx
import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function FlaggedLineChart({ data, loading }) {
  if (loading) return <div className="h-48 flex justify-center items-center">No data yet.</div>;
  if (data.length === 0) return <div className="h-48 flex justify-center items-center">No flagged cases recorded.</div>;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <XAxis dataKey="date" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
