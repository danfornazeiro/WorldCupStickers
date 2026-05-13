import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { filterStickers } from "@/lib/album";
import { loadAlbumStickers } from "@/lib/family";

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

  const allStickers = await loadAlbumStickers(session.user.id);

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
