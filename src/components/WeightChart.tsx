"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface WeightRecordPoint {
  date: string;
  weight_kg: number;
}

interface WeightChartProps {
  data: WeightRecordPoint[];
  height?: number;
}

export default function WeightChart({ data, height = 200 }: WeightChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          angle={-45}
          textAnchor="end"
          height={60}
          tick={{ fontSize: 12 }}
        />
        <YAxis domain={["dataMin - 1", "dataMax + 1"]} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="weight_kg"
          stroke="#d6a27a"
          strokeWidth={3}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
