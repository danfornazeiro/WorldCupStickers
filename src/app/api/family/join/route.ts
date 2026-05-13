import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { joinFamilySchema } from "@/lib/validation";
import { requestJoinFamily } from "@/lib/family";

type SessionUser = {
  user: {
    id: string;
  };
};

export async function POST(request: Request) {
  const session = (await getServerSession(
    authOptions as never,
  )) as SessionUser | null;

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = joinFamilySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dados inválidos." },
        { status: 400 },
      );
    }

    const payload = await requestJoinFamily(session.user.id, parsed.data.code);

    return NextResponse.json({
      family: payload.family,
      request: payload.member,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao entrar na família.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
