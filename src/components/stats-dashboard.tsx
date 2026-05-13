"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
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

const StatsCharts = dynamic(() => import("@/components/stats-charts"), {
  ssr: false,
  loading: () => <Card className="h-128 animate-pulse bg-white/5" />,
});

export function StatsDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    staleTime: 20_000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  const { data: stickersData, isLoading: stickersLoading } = useQuery({
    queryKey: ["stickers", { limit: 9999 }],
    queryFn: fetchStickers,
    staleTime: 20_000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  if (isLoading || stickersLoading) {
    return <Card className="h-80 animate-pulse bg-white/5" />;
  }

  if (!data || !stickersData) {
    return null;
  }

  const pieData = useMemo(
    () => [
      { name: "Coladas", value: data.pasted },
      { name: "Faltando", value: data.missing },
      { name: "Repetidas (itens)", value: data.repeatedCount },
    ],
    [data.missing, data.pasted, data.repeatedCount],
  );

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

      <StatsCharts groups={data.groups} pieData={pieData} />

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
