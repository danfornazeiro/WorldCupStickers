import bcrypt from "bcrypt";
import CredentialsProvider from "next-auth/providers/credentials";
import NextAuth from "next-auth/next";
import type { Session } from "next-auth";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validation";
import { users } from "@/db/schema";

type JwtCallbackArgs = {
  token: {
    userId?: string;
    name?: string | null;
    email?: string | null;
  };
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
};

type SessionCallbackArgs = {
  session: Session;
  token: {
    userId?: string;
    name?: string | null;
    email?: string | null;
  };
};

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET ?? "figurinha-copa-dev-secret",
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, parsed.data.email))
          .limit(1);

        if (!user) {
          return null;
        }

        const matches = await bcrypt.compare(
          parsed.data.password,
          user.password,
        );

        if (!matches) {
          return null;
        }

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: JwtCallbackArgs) {
      if (user) {
        token.userId = user.id;
        token.name = user.name;
        token.email = user.email;
      }

      return token;
    },
    async session({ session, token }: SessionCallbackArgs) {
      if (session.user) {
        session.user.id = token.userId ?? session.user.id;
        session.user.name = token.name ?? session.user.name;
        session.user.email = token.email ?? session.user.email;
      }

      return session;
    },
  },
};

export const authHandler = NextAuth(authOptions as never);
