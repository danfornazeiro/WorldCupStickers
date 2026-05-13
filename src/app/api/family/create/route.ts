import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { createFamilySchema } from "@/lib/validation";
import { createFamilyForUser } from "@/lib/family";

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
    const parsed = createFamilySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dados inválidos." },
        { status: 400 },
      );
    }

    const family = await createFamilyForUser(
      session.user.id,
      parsed.data.name.trim(),
    );

    return NextResponse.json({ family }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao criar família.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
