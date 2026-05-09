"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import { Card, SectionTitle } from "@/components/ui";
import { ShareActions } from "@/components/share-actions";
import type { StickerWithState } from "@/lib/album";

type DashboardStats = {
  total: number;
  pasted: number;
  missing: number;
  repeated: number;
  repeatedCount: number;
  complete: number;
  groups: Array<{
    code: string;
    country: string;
    total: number;
    pasted: number;
    progress: number;
    repeatedCount?: number;
  }>;
  mostComplete: { code: string; country: string; progress: number } | null;
  leastComplete: { code: string; country: string; progress: number } | null;
};

async function fetchDashboard() {
  const response = await fetch("/api/dashboard");
  if (!response.ok) {
    throw new Error("Falha ao carregar dashboard.");
  }
  return (await response.json()) as DashboardStats;
}

async function fetchStickers() {
  const response = await fetch("/api/stickers?limit=9999");
  if (!response.ok) {
    throw new Error("Falha ao carregar figurinhas.");
  }
  return (await response.json()) as {
    stickers: StickerWithState[];
    total: number;
  };
}

const COLORS = ["#59f0cf", "#7ae0ff", "#fbbf24", "#fb7185"];

export function StatsDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });

  const { data: stickersData, isLoading: stickersLoading } = useQuery({
    queryKey: ["stickers", { limit: 9999 }],
    queryFn: fetchStickers,
  });

  if (isLoading || stickersLoading) {
    return <Card className="h-80 animate-pulse bg-white/5" />;
  }

  if (!data || !stickersData) {
    return null;
  }

  const pieData = [
    { name: "Coladas", value: data.pasted },
    { name: "Faltando", value: data.missing },
    { name: "Repetidas (itens)", value: data.repeatedCount },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <SectionTitle
        eyebrow="Dashboard"
        title="Estatísticas gerais do álbum"
        description="Acompanhe o progresso em tempo real com gráficos e visão por seleção."
      />

      <ShareActions
        stickers={stickersData.stickers}
        layout="horizontal"
        className="w-full"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total", value: data.total },
          { label: "Coladas", value: data.pasted },
          { label: "Faltando", value: data.missing },
          { label: "Repetidas (itens)", value: data.repeatedCount },
        ].map((item) => (
          <Card key={item.label}>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              {item.label}
            </p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {item.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <Card className="h-[360px]">
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
            <BarChart data={data.groups.slice(0, 12)}>
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

        <Card className="h-[360px]">
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Mais completa
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">
            {data.mostComplete?.country ?? "Sem dados"}
          </h3>
          <p className="mt-2 text-sm text-slate-300">
            {data.mostComplete
              ? `${data.mostComplete.progress}% concluído`
              : "Ainda sem progresso suficiente."}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Menos completa
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">
            {data.leastComplete?.country ?? "Sem dados"}
          </h3>
          <p className="mt-2 text-sm text-slate-300">
            {data.leastComplete
              ? `${data.leastComplete.progress}% concluído`
              : "Ainda sem progresso suficiente."}
          </p>
        </Card>
      </div>
    </motion.div>
  );
}
