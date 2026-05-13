"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, Input, SectionTitle } from "@/components/ui";

async function joinFamily(code: string) {
  const response = await fetch("/api/family/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const payload = await response.json();
    throw new Error(
      payload.message ?? "Falha ao solicitar entrada na família.",
    );
  }

  return response.json() as Promise<{ family: { code: string; name: string } }>;
}

export default function JoinFamilyPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  const mutation = useMutation({
    mutationFn: () => joinFamily(code),
    onSuccess: (payload) => {
      toast.success(`Solicitação enviada para ${payload.family.name}.`);
      router.push("/family");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Falha ao entrar na família.",
      );
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <SectionTitle
        eyebrow="Família"
        title="Entrar com código"
        description="Digite o código do grupo e aguarde o líder aprovar sua entrada."
      />

      <Card className="space-y-4">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Código da família
          </span>
          <Input
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="COPA-92XQ"
            autoCapitalize="characters"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !code.trim()}
          >
            {mutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Enviar solicitação
          </Button>
          <button
            type="button"
            onClick={() => router.push("/family")}
            className="inline-flex h-12 items-center rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Voltar
          </button>
        </div>
      </Card>
    </div>
  );
}
