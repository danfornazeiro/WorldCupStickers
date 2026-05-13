"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, Input, SectionTitle } from "@/components/ui";

async function createFamily(name: string) {
  const response = await fetch("/api/family/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const payload = await response.json();
    throw new Error(payload.message ?? "Falha ao criar família.");
  }

  return response.json() as Promise<{ family: { code: string; name: string } }>;
}

export default function CreateFamilyPage() {
  const router = useRouter();
  const [name, setName] = useState("");

  const mutation = useMutation({
    mutationFn: () => createFamily(name),
    onSuccess: (payload) => {
      toast.success(
        `Família ${payload.family.name} criada com o código ${payload.family.code}.`,
      );
      router.push("/family/manage");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Falha ao criar família.",
      );
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <SectionTitle
        eyebrow="Família"
        title="Criar família"
        description="O primeiro usuário vira líder do grupo e recebe um código único para compartilhar."
      />

      <Card className="space-y-4">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Nome da família
          </span>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Família Silva"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !name.trim()}
          >
            {mutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Criar família
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
