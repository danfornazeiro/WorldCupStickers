import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { computeAlbumStats } from "@/lib/album";
import { loadAlbumStickers } from "@/lib/family";

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

  const rows = await loadAlbumStickers(session.user.id);

  const stats = computeAlbumStats(
    rows.map((row) => ({
      ...row,
      status: row.status ?? null,
      repeatedCount: row.repeatedCount ?? 0,
    })),
  );

  return NextResponse.json(stats);
}
