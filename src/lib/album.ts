import type { StickerStatus } from "@/db/schema";
import { stickerGroups } from "@/lib/stickers-data";

export type StickerWithState = {
  id: number;
  code: string;
  country: string;
  type: string;
  status: StickerStatus | null;
  repeatedCount: number;
};

export function computeAlbumStats(stickers: StickerWithState[]) {
  const total = stickers.length;
  // Count REPETIDA also as pasted so repeated stickers still contribute to progress
  const pasted = stickers.filter(
    (sticker) => sticker.status === "COLADA" || sticker.status === "REPETIDA",
  ).length;
  // Missing includes both FALTANDO and null status (not yet collected)
  const missing = stickers.filter(
    (sticker) => sticker.status === "FALTANDO" || sticker.status === null,
  ).length;
  const repeated = stickers.filter(
    (sticker) => sticker.status === "REPETIDA",
  ).length;
  const repeatedCount = stickers.reduce(
    (sum, sticker) => sum + sticker.repeatedCount,
    0,
  );
  const complete = total === 0 ? 0 : Math.round((pasted / total) * 100);

  const groups = stickerGroups.map((group) => {
    const groupStickers = stickers.filter(
      (sticker) => sticker.type === group.code,
    );
    const groupTotal = groupStickers.length || group.total;
    const groupPasted = groupStickers.filter(
      (sticker) => sticker.status === "COLADA" || sticker.status === "REPETIDA",
    ).length;
    const groupMissing = groupStickers.filter(
      (sticker) => sticker.status === "FALTANDO" || sticker.status === null,
    ).length;
    const progress =
      groupTotal === 0 ? 0 : Math.round((groupPasted / groupTotal) * 100);

    return {
      ...group,
      total: groupTotal,
      pasted: groupPasted,
      missing: groupMissing,
      repeatedCount: groupStickers.reduce(
        (s, st) => s + (st.repeatedCount ?? 0),
        0,
      ),
      progress,
    };
  });

  const mostComplete =
    [...groups].sort((left, right) => right.progress - left.progress)[0] ??
    null;
  const leastComplete =
    [...groups].sort((left, right) => left.progress - right.progress)[0] ??
    null;

  return {
    total,
    pasted,
    missing,
    repeated,
    repeatedCount,
    complete,
    groups,
    mostComplete,
    leastComplete,
  };
}

export function filterStickers(
  stickers: StickerWithState[],
  query: string,
  group?: string,
) {
  const normalizedQuery = query.trim().toLowerCase();

  const filtered = stickers.filter((sticker) => {
    const matchesQuery =
      !normalizedQuery ||
      sticker.code.toLowerCase().includes(normalizedQuery) ||
      sticker.country.toLowerCase().includes(normalizedQuery);

    const matchesGroup = !group || sticker.type === group;

    return matchesQuery && matchesGroup;
  });

  // Sort stickers numerically by their code number
  return filtered.sort((a, b) => {
    const typeA = a.type;
    const typeB = b.type;

    // If different types, maintain original order by type
    if (typeA !== typeB) {
      return (
        stickerGroups.findIndex((g) => g.code === typeA) -
        stickerGroups.findIndex((g) => g.code === typeB)
      );
    }

    // Same type, sort numerically
    const numA = parseInt(a.code.slice(typeA.length), 10);
    const numB = parseInt(b.code.slice(typeB.length), 10);

    return numA - numB;
  });
}
