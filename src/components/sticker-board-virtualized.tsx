"use client";

import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronDown, Minus, Plus, RefreshCcw, Search } from "lucide-react";
import { toast } from "sonner";
import { Card, Input } from "@/components/ui";
import { stickerGroups } from "@/lib/stickers-data";

type Sticker = {
  id: number;
  code: string;
  country: string;
  type: string;
  status: "COLADA" | "FALTANDO" | "REPETIDA" | null;
  repeatedCount: number;
};

type StickerGroup = {
  code: string;
  country: string;
  label: string;
  stickers: Sticker[];
};

async function fetchStickers(query: string, group: string) {
  const url = new URL("/api/stickers", window.location.origin);

  if (query) url.searchParams.set("query", query);
  if (group) url.searchParams.set("group", group);

  const response = await fetch(url.toString(), {
    cache: "no-store",
  });

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

function getBadgeStyle(status: Sticker["status"], theme: "dark" | "light") {
  if (theme === "light") {
    switch (status) {
      case "COLADA":
        return "border-emerald-500/25 bg-emerald-50 text-emerald-950";
      case "REPETIDA":
        return "border-amber-500/25 bg-amber-50 text-amber-950";
      case "FALTANDO":
      default:
        return "border-rose-500/25 bg-rose-50 text-rose-950";
    }
  }

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

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function useViewportWidth() {
  const [width, setWidth] = useState(() => {
    if (typeof window === "undefined") {
      return 1280;
    }

    return window.innerWidth;
  });

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);

    window.addEventListener("resize", handleResize, { passive: true });

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return width;
}

function getColumns(width: number, compact: boolean) {
  if (width < 640) return 2;
  if (width < 1024) return 3;
  return compact ? 3 : 4;
}

function useThemeMode(): "dark" | "light" {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof document === "undefined") {
        return () => undefined;
      }

      const observer = new MutationObserver(onStoreChange);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });

      return () => observer.disconnect();
    },
    () =>
      document.documentElement.dataset.theme === "light" ? "light" : "dark",
    () => "dark" as const,
  );
}

const StickerCard = memo(function StickerCard({
  sticker,
  onUpdate,
}: {
  sticker: Sticker;
  onUpdate: (
    code: string,
    status: Sticker["status"],
    repeatedCount: number,
  ) => void;
}) {
  const theme = useThemeMode();
  const badgeStyle = getBadgeStyle(sticker.status, theme);
  const currentStatus = sticker.status ?? "FALTANDO";
  const controlButtonClass =
    theme === "light"
      ? "inline-flex h-8 items-center gap-1 rounded-full border border-slate-200 bg-white/90 px-3 text-xs font-medium text-slate-900 shadow-sm transition hover:bg-white"
      : "inline-flex h-8 items-center gap-1 rounded-full bg-white/10 px-3 text-xs text-current transition hover:bg-white/15";
  const roundButtonClass =
    theme === "light"
      ? "inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-900 shadow-sm transition hover:bg-white"
      : "inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-current transition hover:bg-white/15";
  const statusPillClass =
    theme === "light"
      ? "shrink-0 whitespace-nowrap rounded-full border border-slate-200 bg-white/80 px-2 py-0.5 text-[9px] font-semibold text-slate-700 shadow-sm"
      : "shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-black/10 px-2 py-0.5 text-[9px] font-medium text-current/80";

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() =>
        onUpdate(
          sticker.code,
          nextStatus(sticker.status),
          sticker.repeatedCount,
        )
      }
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onUpdate(
            sticker.code,
            nextStatus(sticker.status),
            sticker.repeatedCount,
          );
        }
      }}
      className={`group flex h-full flex-col rounded-3xl border p-3 text-left outline-none transition-transform duration-150 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-cyan-400/60 ${badgeStyle}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.24em] text-current/70">
            {sticker.type}
          </p>
          <h3 className="mt-1 truncate text-base font-semibold text-current">
            {sticker.code}
          </h3>
          <p className="truncate text-[10px] text-current/70">
            {sticker.country}
          </p>
        </div>
        <span className={statusPillClass}>{currentStatus}</span>
      </div>

      <div className="mt-3 flex flex-1 flex-col justify-end gap-2">
        <div className="hidden flex-wrap gap-2 sm:flex">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onUpdate(sticker.code, "COLADA", sticker.repeatedCount);
            }}
            className={controlButtonClass}
          >
            COLADA
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onUpdate(sticker.code, "FALTANDO", 0);
            }}
            className={controlButtonClass}
          >
            FALTA
          </button>
        </div>

        <div className="flex items-center justify-end gap-1 sm:gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onUpdate(
                sticker.code,
                "REPETIDA",
                Math.max(1, sticker.repeatedCount + 1),
              );
            }}
            className={roundButtonClass}
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onUpdate(
                sticker.code,
                sticker.repeatedCount > 1 ? "REPETIDA" : "FALTANDO",
                Math.max(0, sticker.repeatedCount - 1),
              );
            }}
            className={roundButtonClass}
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              const input = window.prompt(
                `Quantidade repetida para ${sticker.code}:`,
                String(sticker.repeatedCount ?? 0),
              );

              if (input === null) return;

              const nextCount = Number.parseInt(
                input.replace(/[^0-9]/g, ""),
                10,
              );

              if (Number.isNaN(nextCount) || nextCount < 0) {
                return;
              }

              onUpdate(
                sticker.code,
                nextCount > 0 ? "REPETIDA" : "FALTANDO",
                nextCount,
              );
            }}
            className={controlButtonClass}
          >
            {sticker.repeatedCount || 0}
          </button>
        </div>
      </div>
    </article>
  );
});

const VirtualizedStickerGrid = memo(function VirtualizedStickerGrid({
  stickers,
  compact,
  onUpdate,
}: {
  stickers: Sticker[];
  compact: boolean;
  onUpdate: (
    code: string,
    status: Sticker["status"],
    repeatedCount: number,
  ) => void;
}) {
  const width = useViewportWidth();
  const columns = useMemo(() => getColumns(width, compact), [width, compact]);
  const rows = useMemo(
    () => chunkArray(stickers, columns),
    [stickers, columns],
  );
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (compact ? 176 : 192),
    overscan: 4,
  });

  const rowVirtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="max-h-[72vh] overflow-y-auto overscroll-contain px-3 py-4 sm:max-h-[78vh] sm:px-4"
    >
      <div
        className="relative w-full"
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
      >
        {rowVirtualItems.map((virtualRow) => {
          const row = rows[virtualRow.index];

          return (
            <div
              key={virtualRow.key}
              className="absolute left-0 top-0 w-full"
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              <div
                className={`grid gap-2 sm:gap-3 ${columns === 2 ? "grid-cols-2" : columns === 3 ? "grid-cols-3" : "grid-cols-4"}`}
              >
                {row.map((sticker) => (
                  <StickerCard
                    key={sticker.code}
                    sticker={sticker}
                    onUpdate={onUpdate}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

const StickerSection = memo(function StickerSection({
  section,
  open,
  compact,
  onToggle,
  onUpdate,
}: {
  section: StickerGroup;
  open: boolean;
  compact: boolean;
  onToggle: (code: string) => void;
  onUpdate: (
    code: string,
    status: Sticker["status"],
    repeatedCount: number,
  ) => void;
}) {
  const sectionCount = section.stickers.length;
  const completed = section.stickers.filter(
    (sticker) => sticker.status === "COLADA" || sticker.status === "REPETIDA",
  ).length;
  const progress =
    sectionCount === 0 ? 0 : Math.round((completed / sectionCount) * 100);

  return (
    <Card className="overflow-hidden p-0">
      <button
        type="button"
        onClick={() => onToggle(section.code)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <div>
          <p className="text-sm font-semibold text-white">{section.country}</p>
          <p className="text-xs text-slate-400">
            {section.code} • {sectionCount} figurinhas • {progress}% concluído
          </p>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-slate-300 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div className="h-1 bg-white/5">
        <div
          className="h-full bg-linear-to-r from-cyan-400 via-emerald-400 to-lime-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {open ? (
        <div className="border-t border-white/5">
          <VirtualizedStickerGrid
            stickers={section.stickers}
            compact={compact}
            onUpdate={onUpdate}
          />
        </div>
      ) : null}
    </Card>
  );
});

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
    staleTime: 60_000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
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

  const handleUpdate = useCallback(
    (code: string, status: Sticker["status"], repeatedCount: number) => {
      mutation.mutate({ code, status, repeatedCount });
    },
    [mutation],
  );

  const grouped = useMemo(() => {
    const stickers = data?.stickers ?? [];
    const byType = new Map<string, Sticker[]>();

    for (const sticker of stickers) {
      const current = byType.get(sticker.type);

      if (current) {
        current.push(sticker);
      } else {
        byType.set(sticker.type, [sticker]);
      }
    }

    return stickerGroups
      .map((item) => ({
        ...item,
        stickers: byType.get(item.code) ?? [],
      }))
      .filter((item) => item.stickers.length > 0 || !deferredSearch);
  }, [data?.stickers, deferredSearch]);

  const handleToggleGroup = useCallback((code: string) => {
    setOpenGroup((current) => (current === code ? "" : code));
  }, []);

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
            className="inline-flex items-center gap-2 text-cyan-300 transition hover:text-cyan-200"
          >
            <RefreshCcw className="h-3.5 w-3.5" /> Recarregar
          </button>
        </div>
      </Card>

      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-40 animate-pulse rounded-3xl bg-white/5"
                />
              ))}
            </div>
          </Card>
        ) : null}

        {grouped.map((section) => {
          const open = openGroup === section.code;

          return (
            <StickerSection
              key={section.code}
              section={section}
              open={open}
              compact={compact}
              onToggle={handleToggleGroup}
              onUpdate={handleUpdate}
            />
          );
        })}
      </div>
    </div>
  );
}
