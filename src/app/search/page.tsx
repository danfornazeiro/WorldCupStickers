import { SectionTitle } from "@/components/ui";
import { StickerBoard } from "@/components/sticker-board";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; group?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="space-y-5">
      <SectionTitle
        eyebrow="Busca instantânea"
        title="Encontre qualquer figurinha em segundos"
        description="Pesquise por código, como BRA10, ARG3 ou FWC15, e filtre por seleção quando quiser."
      />
      <StickerBoard
        initialQuery={params.q ?? ""}
        initialGroup={params.group ?? ""}
        compact
      />
    </div>
  );
}
