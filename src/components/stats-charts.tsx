"use client";

import { memo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui";

type ChartGroup = {
  code: string;
  country: string;
  total: number;
  pasted: number;
  progress: number;
  repeatedCount?: number;
};

type PieDatum = {
  name: string;
  value: number;
};

const COLORS = ["#59f0cf", "#7ae0ff", "#fbbf24", "#fb7185"];

const StatsCharts = memo(function StatsCharts({
  groups,
  pieData,
}: {
  groups: ChartGroup[];
  pieData: PieDatum[];
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
      <Card className="h-90">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Por seleção
            </p>
            <h3 className="text-lg font-semibold text-white">
              Progresso de cada grupo
            </h3>
          </div>
        </div>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={groups.slice(0, 12)}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis
              dataKey="code"
              stroke="rgba(255,255,255,0.35)"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="rgba(255,255,255,0.35)"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(8, 14, 28, 0.95)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 16,
              }}
            />
            <Bar dataKey="progress" radius={[14, 14, 0, 0]} fill="#59f0cf" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="h-90">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Resumo visual
          </p>
          <h3 className="text-lg font-semibold text-white">
            Distribuição por status
          </h3>
        </div>
        <ResponsiveContainer width="100%" height="75%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={4}
            >
              {pieData.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "rgba(8, 14, 28, 0.95)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 16,
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
});

export default StatsCharts;
