import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { computeAlbumStats } from "@/lib/album";
import { db } from "@/lib/db";
import { stickers, userStickers } from "@/db/schema";

type SessionUser = {
  user: {
    id: string;
  };
};

export async function GET() {
  const session = (await getServerSession(
    authOptions as never,
  )) as SessionUser | null;

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  const rows = await db
    .select({
      id: stickers.id,
      code: stickers.code,
      country: stickers.country,
      type: stickers.type,
      status: userStickers.status,
      repeatedCount: userStickers.repeatedCount,
    })
    .from(stickers)
    .leftJoin(
      userStickers,
      and(
        eq(userStickers.stickerId, stickers.id),
        eq(userStickers.userId, session.user.id),
      ),
    );

  const stats = computeAlbumStats(
    rows.map((row) => ({
      ...row,
      status: row.status ?? null,
      repeatedCount: row.repeatedCount ?? 0,
    })),
  );

  return NextResponse.json(stats);
}
