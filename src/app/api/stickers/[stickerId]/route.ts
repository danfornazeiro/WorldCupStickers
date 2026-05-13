import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { updateStickerSchema } from "@/lib/validation";
import { db } from "@/lib/db";
import { stickers } from "@/db/schema";
import { saveStickerState } from "@/lib/family";
import { eq } from "drizzle-orm";

type SessionUser = {
  user: {
    id: string;
  };
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ stickerId: string }> },
) {
  const session = (await getServerSession(
    authOptions as never,
  )) as SessionUser | null;

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  const { stickerId } = await context.params;
  const body = await request.json();
  const parsed = updateStickerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  }

  const [sticker] = await db
    .select()
    .from(stickers)
    .where(eq(stickers.code, stickerId))
    .limit(1);

  if (!sticker) {
    return NextResponse.json(
      { message: "Figurinha não encontrada." },
      { status: 404 },
    );
  }

  const updated = await saveStickerState(
    session.user.id,
    sticker.id,
    parsed.data.status,
    parsed.data.repeatedCount,
  );

  return NextResponse.json({ sticker: updated });
}
