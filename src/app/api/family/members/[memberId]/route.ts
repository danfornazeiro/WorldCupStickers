import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { familyMemberActionSchema } from "@/lib/validation";
import { updateFamilyMemberStatus } from "@/lib/family";

type SessionUser = {
  user: {
    id: string;
  };
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ memberId: string }> },
) {
  const session = (await getServerSession(
    authOptions as never,
  )) as SessionUser | null;

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  try {
    const { memberId } = await context.params;
    const body = await request.json();
    const parsed = familyMemberActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dados inválidos." },
        { status: 400 },
      );
    }

    const updated = await updateFamilyMemberStatus({
      leaderId: session.user.id,
      memberId: Number(memberId),
      action: parsed.data.action,
    });

    return NextResponse.json({ member: updated });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao atualizar membro.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
