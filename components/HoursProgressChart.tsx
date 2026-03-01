"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type ChartData = {
  month: string;
  hours: number;
};

type HoursProgressChartProps = {
  data: ChartData[];
  width: number;
  height: number;
};

export default function HoursProgressChart({
  data,
  width,
  height,
}: HoursProgressChartProps) {
  if (width <= 0 || height <= 0) return null;

  return (
    <BarChart
      width={width}
      height={height}
      data={data}
      margin={{ top: 16, right: 16, left: 0, bottom: 0 }}
    >
      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
      <XAxis dataKey="month" stroke="#9ca3af" tick={{ fontSize: 12 }} />
      <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
      <Tooltip
        contentStyle={{
          backgroundColor: "#111827",
          border: "1px solid #374151",
          borderRadius: "8px",
          color: "#fff",
        }}
      />
      <Legend />
      <Bar dataKey="hours" fill="#6b7280" radius={[4, 4, 0, 0]} />
    </BarChart>
  );
}
