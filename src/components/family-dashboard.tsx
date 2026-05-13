"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Copy,
  Loader2,
  RefreshCcw,
  Shield,
  Trash2,
  Users,
  Clock3,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Card, SectionTitle } from "@/components/ui";

type FamilyMember = {
  id: number;
  familyId: string;
  userId: string;
  name: string;
  email: string;
  role: "leader" | "member";
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
};

type FamilyDashboardData = {
  family: null | {
    id: string;
    name: string;
    code: string;
    leaderId: string;
    leaderName: string;
    leaderEmail: string;
    createdAt: string;
    memberCount: number;
    pendingCount: number;
    acceptedCount: number;
    rejectedCount: number;
    stats: {
      total: number;
      pasted: number;
      missing: number;
      repeated: number;
      repeatedCount: number;
      complete: number;
    };
    members: FamilyMember[];
  };
};

async function fetchFamily() {
  const response = await fetch("/api/family", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Falha ao carregar dados da família.");
  }

  return (await response.json()) as FamilyDashboardData;
}

async function updateMember(
  memberId: number,
  action: "approve" | "reject" | "remove",
) {
  const response = await fetch(`/api/family/members/${memberId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });

  if (!response.ok) {
    const payload = await response.json();
    throw new Error(payload.message ?? "Falha ao atualizar membro.");
  }

  return response.json();
}

async function deleteFamily() {
  const response = await fetch("/api/family", {
    method: "DELETE",
  });

  if (!response.ok) {
    const payload = await response.json();
    throw new Error(payload.message ?? "Falha ao excluir família.");
  }

  return response.json();
}

export function FamilyDashboard({
  mode = "overview",
}: {
  mode?: "overview" | "manage";
}) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const currentUserId = (session?.user as { id?: string } | undefined)?.id;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["family"],
    queryFn: fetchFamily,
    refetchInterval: 4000,
    refetchIntervalInBackground: true,
  });

  const family = data?.family ?? null;
  const isLeader = family?.leaderId === currentUserId;

  const memberMutation = useMutation({
    mutationFn: ({
      memberId,
      action,
    }: {
      memberId: number;
      action: "approve" | "reject" | "remove";
    }) => updateMember(memberId, action),
    onSuccess: (_, variables) => {
      toast.success(
        variables.action === "approve"
          ? "Membro aprovado."
          : variables.action === "reject"
            ? "Solicitação recusada."
            : "Membro removido.",
      );
      queryClient.invalidateQueries({ queryKey: ["family"] });
      queryClient.invalidateQueries({ queryKey: ["stickers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Falha ao atualizar membro.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFamily,
    onSuccess: () => {
      toast.success("Família excluída.");
      queryClient.invalidateQueries({ queryKey: ["family"] });
      queryClient.invalidateQueries({ queryKey: ["stickers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Falha ao excluir família.",
      );
    },
  });

  const handleCopyCode = async () => {
    if (!family) return;

    await navigator.clipboard.writeText(family.code);
    toast.success("Código copiado.");
  };

  if (isLoading) {
    return <Card className="h-80 animate-pulse bg-white/5" />;
  }

  if (!family) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5"
      >
        <SectionTitle
          eyebrow="Família"
          title="Seu álbum ainda está individual"
          description="Crie uma família para compartilhar o mesmo álbum com outras pessoas ou entre em uma existente com um código de convite."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-200">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Criar família
                </p>
                <p className="text-sm text-slate-300">
                  Você será o líder e receberá um código para compartilhar.
                </p>
              </div>
            </div>
            <Link
              href="/family/create"
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100"
            >
              Criar família
            </Link>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-200">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Entrar com código
                </p>
                <p className="text-sm text-slate-300">
                  Envie a solicitação e aguarde aprovação do líder.
                </p>
              </div>
            </div>
            <Link
              href="/family/join"
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Entrar em uma família
            </Link>
          </Card>
        </div>
      </motion.div>
    );
  }

  const progress = family.stats.complete;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <SectionTitle
          eyebrow="Família"
          title={family.name}
          description="O álbum é compartilhado em tempo real entre os membros aprovados."
        />
        <button
          type="button"
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ["family"] })
          }
          className="inline-flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm text-slate-100 transition hover:bg-white/10"
        >
          <RefreshCcw
            className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Atualizar
        </button>
      </div>

      {isLeader && family.pendingCount > 0 ? (
        <Card className="border-amber-400/20 bg-amber-400/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-amber-200/80">
                Solicitações pendentes
              </p>
              <p className="mt-1 text-sm text-amber-50">
                {family.pendingCount} pedido(s) aguardando sua aprovação.
              </p>
            </div>
            <Link
              href="/family/manage"
              className="inline-flex h-11 items-center rounded-full bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-amber-100"
            >
              Revisar pedidos
            </Link>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Código do grupo
              </p>
              <div className="flex items-center gap-3">
                <p className="text-3xl font-semibold tracking-tight text-white">
                  {family.code}
                </p>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-sm text-slate-100 transition hover:bg-white/10"
                >
                  <Copy className="h-4 w-4" />
                  Copiar
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Líder
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {family.leaderName}
              </p>
              <p className="text-xs text-slate-400">{family.leaderEmail}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Membros", value: family.memberCount, icon: Users },
              { label: "Pendentes", value: family.pendingCount, icon: Clock3 },
              {
                label: "Coladas",
                value: family.stats.pasted,
                icon: CheckCircle2,
              },
              {
                label: "Repetidas",
                value: family.stats.repeatedCount,
                icon: XCircle,
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="rounded-3xl border border-white/10 bg-slate-950/40 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                      {item.label}
                    </p>
                    <Icon className="h-4 w-4 text-cyan-300" />
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {item.value}
                  </p>
                </div>
              );
            })}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
              <span>Progresso do álbum</span>
              <span>{progress}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-linear-to-r from-cyan-400 via-emerald-400 to-lime-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Faltantes
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {family.stats.missing}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Repetidas
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {family.stats.repeated}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Completo
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {family.stats.complete}%
              </p>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Resumo
              </p>
              <h3 className="text-xl font-semibold text-white">
                Membros e solicitações
              </h3>
            </div>
            <p className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              {family.acceptedCount} aceitos
            </p>
          </div>

          <div className="space-y-3">
            {family.members.map((member) => {
              const isLeaderMember = member.role === "leader";
              const canAct =
                isLeader && !isLeaderMember && member.status === "pending";

              return (
                <div
                  key={member.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{member.name}</p>
                      <p className="text-sm text-slate-400">{member.email}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${member.status === "accepted" ? "bg-emerald-400/15 text-emerald-200" : member.status === "pending" ? "bg-amber-400/15 text-amber-200" : "bg-rose-400/15 text-rose-200"}`}
                    >
                      {member.role === "leader" ? "Líder" : member.status}
                    </span>
                  </div>

                  {canAct ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          memberMutation.mutate({
                            memberId: member.id,
                            action: "approve",
                          })
                        }
                        className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Aprovar
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          memberMutation.mutate({
                            memberId: member.id,
                            action: "reject",
                          })
                        }
                        className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm text-white transition hover:bg-white/10"
                      >
                        <XCircle className="h-4 w-4" />
                        Recusar
                      </button>
                    </div>
                  ) : null}

                  {mode === "manage" &&
                  isLeader &&
                  !isLeaderMember &&
                  member.status === "accepted" ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          memberMutation.mutate({
                            memberId: member.id,
                            action: "remove",
                          })
                        }
                        className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm text-white transition hover:bg-rose-500/15"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remover
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {mode === "manage" && isLeader ? (
            <button
              type="button"
              onClick={() => {
                const confirmed = window.confirm(
                  "Excluir a família também remove o álbum compartilhado. Deseja continuar?",
                );
                if (!confirmed) return;
                deleteMutation.mutate();
              }}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-rose-400/20 bg-rose-500/10 px-4 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Excluir família
            </button>
          ) : null}
        </Card>
      </div>
    </motion.div>
  );
}
