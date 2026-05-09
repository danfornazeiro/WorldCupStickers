import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { db } from "@/lib/db";
import { filterStickers } from "@/lib/album";
import { stickers, userStickers } from "@/db/schema";

type SessionUser = {
  user: {
    id: string;
  };
};

export async function GET(request: Request) {
  const session = (await getServerSession(
    authOptions as never,
  )) as SessionUser | null;

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("query") ?? "";
  const group = url.searchParams.get("group") ?? "";

  const allStickers = await db
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

  const filtered = filterStickers(
    allStickers.map((item) => ({
      ...item,
      status: item.status ?? null,
      repeatedCount: item.repeatedCount ?? 0,
    })),
    query,
    group || undefined,
  );

  return NextResponse.json({ stickers: filtered });
}
