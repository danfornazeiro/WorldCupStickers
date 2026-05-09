import { SectionTitle } from "@/components/ui";
import { StickerBoard } from "@/components/sticker-board";

export default function StickersPage() {
  return (
    <div className="space-y-5">
      <SectionTitle
        eyebrow="Figurinhas"
        title="Accordion completo das seleções"
        description="Abra uma seleção, marque o status em um toque e ajuste quantas repetidas você tem."
      />
      <StickerBoard />
    </div>
  );
}
