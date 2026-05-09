import type { StickerWithState } from "@/lib/album";
import { stickerGroups } from "@/lib/stickers-data";

/**
 * Parse sticker code to extract numeric part
 * E.g., "BRA1" -> 1, "ARG15" -> 15, "FWC0" -> 0
 */
function extractStickerNumber(code: string): number {
  const match = code.match(/\d+$/);
  return match ? parseInt(match[0], 10) : 0;
}

/**
 * Generate formatted message for repeated stickers
 * Groups by country, shows count, numeric sort
 * Example:
 * BRASIL
 * BRA1 (x2)
 * BRA7 (x1)
 *
 * ARGENTINA
 * ARG3 (x2)
 */
export function generateRepeatedMessage(stickers: StickerWithState[]): string {
  const repeated = stickers.filter(
    (s) => s.status === "REPETIDA" && s.repeatedCount > 0,
  );

  if (repeated.length === 0) {
    return "Nenhuma figurinha repetida! 🎉";
  }

  // Group by country/type
  const grouped = new Map<string, StickerWithState[]>();
  repeated.forEach((sticker) => {
    const key = sticker.type;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(sticker);
  });

  // Find country names from stickerGroups
  const typeToCountry = new Map(stickerGroups.map((g) => [g.code, g.country]));

  // Build message
  const lines: string[] = [];
  const sortedGroups = Array.from(grouped.entries()).sort(
    ([typeA], [typeB]) =>
      typeToCountry.get(typeA)?.localeCompare(typeToCountry.get(typeB) || "") ||
      0,
  );

  sortedGroups.forEach(([type, stickersInGroup], index) => {
    const country = typeToCountry.get(type) || type;
    lines.push(country);

    // Sort numerically
    stickersInGroup.sort(
      (a, b) => extractStickerNumber(a.code) - extractStickerNumber(b.code),
    );

    stickersInGroup.forEach((sticker) => {
      lines.push(`${sticker.code} (x${sticker.repeatedCount})`);
    });

    // Add line break between countries (except last)
    if (index < sortedGroups.length - 1) {
      lines.push("");
    }
  });

  return lines.join("\n");
}

/**
 * Generate formatted message for missing stickers
 * Groups by country, no count shown
 * Example:
 * BRASIL
 * BRA2
 * BRA9
 * BRA18
 *
 * ARGENTINA
 * ARG1
 * ARG14
 */
export function generateMissingMessage(stickers: StickerWithState[]): string {
  const missing = stickers.filter(
    (s) => s.status === "FALTANDO" || s.status === null,
  );

  if (missing.length === 0) {
    return "Nenhuma figurinha faltando! 🏆";
  }

  // Group by country/type
  const grouped = new Map<string, StickerWithState[]>();
  missing.forEach((sticker) => {
    const key = sticker.type;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(sticker);
  });

  // Find country names from stickerGroups
  const typeToCountry = new Map(stickerGroups.map((g) => [g.code, g.country]));

  // Build message
  const lines: string[] = [];
  const sortedGroups = Array.from(grouped.entries()).sort(
    ([typeA], [typeB]) =>
      typeToCountry.get(typeA)?.localeCompare(typeToCountry.get(typeB) || "") ||
      0,
  );

  sortedGroups.forEach(([type, stickersInGroup], index) => {
    const country = typeToCountry.get(type) || type;
    lines.push(country);

    // Sort numerically
    stickersInGroup.sort(
      (a, b) => extractStickerNumber(a.code) - extractStickerNumber(b.code),
    );

    stickersInGroup.forEach((sticker) => {
      lines.push(sticker.code);
    });

    // Add line break between countries (except last)
    if (index < sortedGroups.length - 1) {
      lines.push("");
    }
  });

  return lines.join("\n");
}

/**
 * Share message to WhatsApp
 */
export function shareToWhatsApp(message: string): void {
  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Share using native browser API
 * Fallback if navigator.share is not available
 */
export async function shareNative(
  message: string,
  title: string = "Minhas figurinhas da Copa",
): Promise<boolean> {
  if (!navigator.share) {
    return false;
  }

  try {
    await navigator.share({
      title,
      text: message,
    });
    return true;
  } catch (error) {
    // User cancelled or error occurred
    console.log("Native share error:", error);
    return false;
  }
}

/**
 * Copy message to clipboard
 */
export async function copyToClipboard(message: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(message);
    return true;
  } catch (error) {
    console.error("Erro ao copiar para área de transferência:", error);
    return false;
  }
}
