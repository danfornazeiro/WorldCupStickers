"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { authSchema, loginSchema } from "@/lib/validation";
import { Button, Card, Input } from "@/components/ui";

type AuthMode = "login" | "register";

type AuthValues = {
  name?: string;
  email: string;
  password: string;
};

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const schema = mode === "register" ? authSchema : loginSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: AuthValues) {
    setSubmitting(true);

    try {
      if (mode === "register") {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.message ?? "Falha ao registrar.");
        }

        const signInResult = await signIn("credentials", {
          redirect: false,
          email: values.email,
          password: values.password,
        });

        if (signInResult?.error) {
          throw new Error("Conta criada, mas o login automático falhou.");
        }

        toast.success("Conta criada com sucesso.");
        router.push("/");
        router.refresh();
        return;
      }

      const signInResult = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
      });

      if (signInResult?.error) {
        throw new Error("E-mail ou senha inválidos.");
      }

      toast.success("Bem-vindo de volta.");
      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Algo deu errado.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md p-6 sm:p-8">
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
            {mode === "register" ? "Criar conta" : "Entrar"}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            {mode === "register" ? "Comece seu álbum" : "Acesse seu álbum"}
          </h1>
          <p className="text-sm leading-6 text-slate-300">
            Seus dados ficam salvos no banco e sincronizados por usuário.
          </p>
        </div>

        {mode === "register" ? (
          <div className="space-y-2">
            <Input placeholder="Seu nome" {...register("name")} />
            {errors.name ? (
              <p className="text-sm text-rose-300">{errors.name.message}</p>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2">
          <Input type="email" placeholder="Seu e-mail" {...register("email")} />
          {errors.email ? (
            <p className="text-sm text-rose-300">{errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Input
            type="password"
            placeholder="Sua senha"
            {...register("password")}
          />
          {errors.password ? (
            <p className="text-sm text-rose-300">{errors.password.message}</p>
          ) : null}
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting
            ? "Processando..."
            : mode === "register"
              ? "Criar conta"
              : "Entrar"}
        </Button>

        <div className="text-center text-sm text-slate-400">
          {mode === "register" ? (
            <a href="/login" className="text-cyan-300 hover:text-cyan-200">
              Já tenho conta
            </a>
          ) : (
            <a href="/register" className="text-cyan-300 hover:text-cyan-200">
              Criar nova conta
            </a>
          )}
        </div>
      </form>
    </Card>
  );
}
