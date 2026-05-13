"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Minus, Plus, RefreshCcw, Search } from "lucide-react";
import { toast } from "sonner";
import { stickerGroups } from "@/lib/stickers-data";
import { Card, Input } from "@/components/ui";

type Sticker = {
  id: number;
  code: string;
  country: string;
  type: string;
  status: "COLADA" | "FALTANDO" | "REPETIDA" | null;
  repeatedCount: number;
};

async function fetchStickers(query: string, group: string) {
  const url = new URL("/api/stickers", window.location.origin);
  if (query) url.searchParams.set("query", query);
  if (group) url.searchParams.set("group", group);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Falha ao carregar figurinhas.");
  }

  return (await response.json()) as { stickers: Sticker[] };
}

async function updateSticker(
  code: string,
  status: Sticker["status"],
  repeatedCount: number,
) {
  const response = await fetch(`/api/stickers/${code}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, status, repeatedCount }),
  });

  if (!response.ok) {
    const payload = await response.json();
    throw new Error(payload.message ?? "Falha ao atualizar figurinha.");
  }

  return response.json();
}

function getBadgeStyle(status: Sticker["status"]) {
  switch (status) {
    case "COLADA":
      return "border-emerald-400/30 bg-emerald-400/15 text-emerald-100";
    case "REPETIDA":
      return "border-amber-400/30 bg-amber-400/15 text-amber-100";
    case "FALTANDO":
    default:
      return "border-rose-400/30 bg-rose-400/15 text-rose-100";
  }
}

function nextStatus(status: Sticker["status"]) {
  if (status === "COLADA") return "FALTANDO";
  if (status === "FALTANDO") return "REPETIDA";
  return "COLADA";
}

export function StickerBoard({
  initialQuery = "",
  initialGroup = "",
  compact = false,
}: {
  initialQuery?: string;
  initialGroup?: string;
  compact?: boolean;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState(initialQuery);
  const [group, setGroup] = useState(initialGroup);
  const [openGroup, setOpenGroup] = useState(
    initialGroup || stickerGroups[0]?.code || "",
  );
  const deferredSearch = useDeferredValue(search);

  const queryKey = ["stickers", deferredSearch, group] as const;

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () => fetchStickers(deferredSearch, group),
    refetchInterval: 4000,
    refetchIntervalInBackground: true,
  });

  const mutation = useMutation({
    mutationFn: ({
      code,
      status,
      repeatedCount,
    }: {
      code: string;
      status: Sticker["status"];
      repeatedCount: number;
    }) => updateSticker(code, status, repeatedCount),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<{ stickers: Sticker[] }>(
        queryKey,
      );

      if (previous) {
        queryClient.setQueryData<{ stickers: Sticker[] }>(queryKey, {
          stickers: previous.stickers.map((sticker) =>
            sticker.code === variables.code
              ? {
                  ...sticker,
                  status: variables.status,
                  repeatedCount: variables.repeatedCount,
                }
              : sticker,
          ),
        });
      }

      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(
        error instanceof Error
          ? error.message
          : "Falha ao atualizar figurinha.",
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["stickers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const grouped = useMemo(() => {
    const stickers = data?.stickers ?? [];
    return stickerGroups
      .map((item) => ({
        ...item,
        stickers: stickers.filter((sticker) => sticker.type === item.code),
      }))
      .filter((item) => item.stickers.length > 0 || !deferredSearch);
  }, [data?.stickers, deferredSearch]);

  return (
    <div className="space-y-5">
      <Card className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Busca instantânea
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="BRA10, ARG3, FWC15..."
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setGroup("")}
              className={`rounded-full px-4 py-2 text-sm transition ${!group ? "bg-white text-slate-950" : "border border-white/10 bg-white/5 text-slate-300"}`}
            >
              Todas
            </button>
            {stickerGroups.slice(0, 8).map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => setGroup(item.code)}
                className={`rounded-full px-4 py-2 text-sm transition ${group === item.code ? "bg-white text-slate-950" : "border border-white/10 bg-white/5 text-slate-300"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            {isFetching
              ? "Atualizando..."
              : `${data?.stickers.length ?? 0} figurinhas carregadas`}
          </span>
          <button
            type="button"
            onClick={() => queryClient.invalidateQueries({ queryKey })}
            className="inline-flex items-center gap-2 text-cyan-300 hover:text-cyan-200"
          >
            <RefreshCcw className="h-3.5 w-3.5" /> Recarregar
          </button>
        </div>
      </Card>

      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <div className="h-48 animate-pulse rounded-2xl bg-white/5" />
          </Card>
        ) : null}

        {grouped.map((section) => {
          const sectionCount = section.stickers.length;
          // Count REPETIDA as completed/colada for progress display
          const completed = section.stickers.filter(
            (sticker) =>
              sticker.status === "COLADA" || sticker.status === "REPETIDA",
          ).length;
          const progress =
            sectionCount === 0
              ? 0
              : Math.round((completed / sectionCount) * 100);
          const open = openGroup === section.code;

          return (
            <Card key={section.code} className="overflow-hidden p-0">
              <button
                type="button"
                onClick={() => setOpenGroup(open ? "" : section.code)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-white">
                    {section.country}
                  </p>
                  <p className="text-xs text-slate-400">
                    {section.code} • {sectionCount} figurinhas • {progress}%
                    concluído
                  </p>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-slate-300 transition ${open ? "rotate-180" : ""}`}
                />
              </button>
              <div className="h-1 bg-white/5">
                <div
                  className="h-full bg-linear-to-r from-cyan-400 via-emerald-400 to-lime-300 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <AnimatePresence initial={false}>
                {open ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div
                      className={`grid gap-2 p-3 sm:gap-3 sm:p-4 ${compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}
                    >
                      {section.stickers.map((sticker, index) => {
                        const accent = getBadgeStyle(sticker.status);

                        return (
                          <motion.button
                            layout
                            key={sticker.code}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.01 }}
                            type="button"
                            onClick={() =>
                              mutation.mutate({
                                code: sticker.code,
                                status: nextStatus(sticker.status),
                                repeatedCount:
                                  sticker.status === "REPETIDA"
                                    ? sticker.repeatedCount
                                    : sticker.repeatedCount,
                              })
                            }
                            className={`group rounded-3xl border p-3 sm:p-4 text-left transition hover:-translate-y-0.5 ${accent}`}
                          >
                            <div className="flex items-start justify-between gap-2 sm:gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] sm:text-xs uppercase tracking-[0.24em] text-current/70">
                                  {sticker.type}
                                </p>
                                <h3 className="mt-1 text-base sm:text-lg font-semibold text-white truncate">
                                  {sticker.code}
                                </h3>
                                <p className="text-[10px] sm:text-xs text-current/70 truncate">
                                  {sticker.country}
                                </p>
                              </div>
                              <span className="rounded-full border border-white/10 bg-black/10 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[11px] font-medium whitespace-nowrap text-current/80 shrink-0">
                                {sticker.status ?? "FALTANDO"}
                              </span>
                            </div>

                            <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-2">
                              <div className="flex items-center gap-2 text-xs text-current/80">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    mutation.mutate({
                                      code: sticker.code,
                                      status: "COLADA",
                                      repeatedCount: sticker.repeatedCount,
                                    });
                                  }}
                                  className="hidden sm:inline-flex h-8 items-center gap-1 rounded-full bg-white/10 px-3 text-xs"
                                >
                                  COLADA
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    mutation.mutate({
                                      code: sticker.code,
                                      status: "FALTANDO",
                                      repeatedCount: 0,
                                    });
                                  }}
                                  className="hidden sm:inline-flex h-8 items-center gap-1 rounded-full bg-white/10 px-3 text-xs"
                                >
                                  FALTA
                                </button>
                              </div>
                              <div className="flex items-center gap-1 sm:gap-2">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    mutation.mutate({
                                      code: sticker.code,
                                      status: "REPETIDA",
                                      repeatedCount: Math.max(
                                        1,
                                        sticker.repeatedCount + 1,
                                      ),
                                    });
                                  }}
                                  className="inline-flex h-7 sm:h-8 w-7 sm:w-8 items-center justify-center rounded-full bg-white/10"
                                >
                                  <Plus className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    mutation.mutate({
                                      code: sticker.code,
                                      status:
                                        sticker.repeatedCount > 1
                                          ? "REPETIDA"
                                          : "FALTANDO",
                                      repeatedCount: Math.max(
                                        0,
                                        sticker.repeatedCount - 1,
                                      ),
                                    });
                                  }}
                                  className="inline-flex h-7 sm:h-8 w-7 sm:w-8 items-center justify-center rounded-full bg-white/10"
                                >
                                  <Minus className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                                </button>
                                {/* Direct edit of repeated count */}
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    const input = window.prompt(
                                      `Quantidade repetida para ${sticker.code}:`,
                                      String(sticker.repeatedCount ?? 0),
                                    );
                                    if (input === null) return;
                                    const n = parseInt(
                                      input.replace(/[^0-9]/g, ""),
                                      10,
                                    );
                                    if (Number.isNaN(n) || n < 0) {
                                      return;
                                    }

                                    mutation.mutate({
                                      code: sticker.code,
                                      status: n > 0 ? "REPETIDA" : "FALTANDO",
                                      repeatedCount: n,
                                    });
                                  }}
                                  className="inline-flex h-7 sm:h-8 items-center gap-1 sm:gap-2 rounded-full border border-white/10 bg-white/5 px-2 sm:px-3 text-xs sm:text-sm"
                                >
                                  {sticker.repeatedCount || 0}
                                </button>
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
