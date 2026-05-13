import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { deleteFamilyForLeader, loadFamilyOverview } from "@/lib/family";

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

  const family = await loadFamilyOverview(session.user.id);

  return NextResponse.json({ family });
}

export async function DELETE() {
  const session = (await getServerSession(
    authOptions as never,
  )) as SessionUser | null;

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  try {
    await deleteFamilyForLeader(session.user.id);

    return NextResponse.json({ message: "Família excluída com sucesso." });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao excluir a família.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
