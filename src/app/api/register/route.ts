import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authSchema } from "@/lib/validation";
import { users } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = authSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dados inválidos.", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, parsed.data.email))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { message: "Este e-mail já está cadastrado." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    const [created] = await db
      .insert(users)
      .values({
        name: parsed.data.name,
        email: parsed.data.email,
        password: passwordHash,
      })
      .returning({ id: users.id, name: users.name, email: users.email });

    return NextResponse.json({ user: created }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Falha ao criar conta." },
      { status: 500 },
    );
  }
}
