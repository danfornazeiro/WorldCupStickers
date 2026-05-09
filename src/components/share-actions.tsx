"use client";

import { useState } from "react";
import { Share2, MessageCircle, Copy, Loader2 } from "lucide-react";
import type { StickerWithState } from "@/lib/album";
import {
  generateRepeatedMessage,
  generateMissingMessage,
  shareToWhatsApp,
  shareNative,
  copyToClipboard,
} from "@/lib/share";

interface ShareActionsProps {
  stickers: StickerWithState[];
  layout?: "horizontal" | "vertical";
  className?: string;
}

export function ShareActions({
  stickers,
  layout = "horizontal",
  className = "",
}: ShareActionsProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const repeatedCount = stickers.reduce(
    (sum, s) => sum + (s.repeatedCount ?? 0),
    0,
  );
  const missingCount = stickers.filter(
    (s) => s.status === "FALTANDO" || s.status === null,
  ).length;

  const handleShareRepeated = async (
    action: "whatsapp" | "native" | "copy",
  ) => {
    if (repeatedCount === 0) {
      return;
    }

    setLoadingAction(action);

    try {
      const message = generateRepeatedMessage(stickers);

      switch (action) {
        case "whatsapp":
          shareToWhatsApp(message);
          break;

        case "native":
          await shareNative(message, "Minhas repetidas 🎫");
          break;

        case "copy":
          await copyToClipboard(message);
          break;
      }
    } catch (error) {
      console.error("Erro ao compartilhar repetidas:", error);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleShareMissing = async (action: "whatsapp" | "native" | "copy") => {
    if (missingCount === 0) {
      return;
    }

    setLoadingAction(action);

    try {
      const message = generateMissingMessage(stickers);

      switch (action) {
        case "whatsapp":
          shareToWhatsApp(message);
          break;

        case "native":
          await shareNative(message, "Minhas faltantes 🎫");
          break;

        case "copy":
          await copyToClipboard(message);
          break;
      }
    } catch (error) {
      console.error("Erro ao compartilhar faltantes:", error);
    } finally {
      setLoadingAction(null);
    }
  };

  const isLoading = loadingAction !== null;
  const baseClasses =
    layout === "horizontal" ? "flex flex-wrap gap-2" : "flex flex-col gap-2";

  return (
    <div className={`${baseClasses} ${className}`}>
      {/* Repetidas section */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleShareRepeated("whatsapp")}
          disabled={isLoading || repeatedCount === 0}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors text-sm font-medium"
          title="Compartilhar repetidas no WhatsApp"
        >
          {loadingAction === "whatsapp-repeated" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MessageCircle className="w-4 h-4" />
          )}
          WhatsApp Repetidas
        </button>

        <button
          onClick={() => handleShareRepeated("native")}
          disabled={isLoading || repeatedCount === 0}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors text-sm font-medium"
          title="Compartilhar repetidas via app nativo"
        >
          {loadingAction === "native-repeated" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
          Compartilhar Repetidas
        </button>

        <button
          onClick={() => handleShareRepeated("copy")}
          disabled={isLoading || repeatedCount === 0}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors text-sm font-medium"
          title="Copiar repetidas para área de transferência"
        >
          {loadingAction === "copy-repeated" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          Copiar Repetidas
        </button>
      </div>

      {/* Faltantes section */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleShareMissing("whatsapp")}
          disabled={isLoading || missingCount === 0}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors text-sm font-medium"
          title="Compartilhar faltantes no WhatsApp"
        >
          {loadingAction === "whatsapp-missing" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MessageCircle className="w-4 h-4" />
          )}
          WhatsApp Faltantes
        </button>

        <button
          onClick={() => handleShareMissing("native")}
          disabled={isLoading || missingCount === 0}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors text-sm font-medium"
          title="Compartilhar faltantes via app nativo"
        >
          {loadingAction === "native-missing" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
          Compartilhar Faltantes
        </button>

        <button
          onClick={() => handleShareMissing("copy")}
          disabled={isLoading || missingCount === 0}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors text-sm font-medium"
          title="Copiar faltantes para área de transferência"
        >
          {loadingAction === "copy-missing" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          Copiar Faltantes
        </button>
      </div>

      {/* Info badges */}
      <div className="flex gap-2 text-sm">
        <span className="px-2 py-1 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
          {repeatedCount} Repetidas
        </span>
        <span className="px-2 py-1 rounded-md bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
          {missingCount} Faltantes
        </span>
      </div>
    </div>
  );
}
