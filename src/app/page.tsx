import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { Card, SectionTitle } from "@/components/ui";
import { computeAlbumStats } from "@/lib/album";
import { loadAlbumStickers, loadFamilyOverview } from "@/lib/family";

type SessionUser = {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
};

export default async function HomePage() {
  const session = (await getServerSession(
    authOptions as never,
  )) as SessionUser | null;

  if (!session?.user?.id) {
    return null;
  }

  const [rows, family] = await Promise.all([
    loadAlbumStickers(session.user.id),
    loadFamilyOverview(session.user.id),
  ]);

  const stats = computeAlbumStats(
    rows.map((row) => ({
      ...row,
      status: row.status ?? null,
      repeatedCount: row.repeatedCount ?? 0,
    })),
  );

  const summaryCards = [
    {
      label: "Coladas",
      value: stats.pasted,
      tone: "from-emerald-400 to-cyan-400",
    },
    {
      label: "Faltando",
      value: stats.missing,
      tone: "from-rose-400 to-orange-400",
    },
    {
      label: "Repetidas",
      value: stats.repeated,
      tone: "from-amber-300 to-yellow-500",
    },
    {
      label: "% Completa",
      value: `${stats.complete}%`,
      tone: "from-sky-400 to-indigo-400",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="relative overflow-hidden p-6 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(89,240,207,0.18),transparent_35%)]" />
          <div className="relative space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300">
                Bem-vindo, {session.user.name ?? "colecionador"}
              </p>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Controle o álbum da Copa com uma interface rápida, bonita e
                pensada para mobile.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Marque coladas, faltando e repetidas, veja estatísticas em tempo
                real e mantenha tudo salvo por usuário.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <Card>
                <SectionTitle
                  eyebrow="Acesso"
                  title={family ? "Família ativa" : "Sem família ativa"}
                />
                {family ? (
                  <div className="mt-4 space-y-3 text-sm text-slate-300">
                    <p>
                      Grupo: <span className="text-white">{family.name}</span>
                    </p>
                    <p>
                      Código: <span className="text-white">{family.code}</span>
                    </p>
                    <p>
                      Membros aprovados:{" "}
                      <span className="text-white">{family.memberCount}</span>
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                      <Link
                        href="/family/manage"
                        className="inline-flex h-10 items-center rounded-2xl bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100"
                      >
                        Gerenciar família
                      </Link>
                      <Link
                        href="/family"
                        className="inline-flex h-10 items-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
                      >
                        Abrir painel
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3 text-sm text-slate-300">
                    <p>
                      Seu álbum continua individual até você criar ou entrar em
                      uma família.
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                      <Link
                        href="/family/create"
                        className="inline-flex h-10 items-center rounded-2xl bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100"
                      >
                        Criar família
                      </Link>
                      <Link
                        href="/family/join"
                        className="inline-flex h-10 items-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
                      >
                        Entrar com código
                      </Link>
                    </div>
                  </div>
                )}
              </Card>
              {summaryCards.map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-white/10 bg-slate-950/40 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {item.value}
                  </p>
                  <div
                    className={`mt-3 h-1.5 rounded-full bg-linear-to-r ${item.tone}`}
                  />
                </div>
              ))}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                <span>Progresso do álbum</span>
                <span>{stats.complete}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-linear-to-r from-cyan-400 via-emerald-400 to-lime-300"
                  style={{ width: `${stats.complete}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/stickers"
                className="inline-flex h-12 items-center rounded-2xl bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100"
              >
                Abrir figurinhas
              </Link>
              <Link
                href="/stats"
                className="inline-flex h-12 items-center rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Ver dashboard
              </Link>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <Card>
            <SectionTitle eyebrow="Visão geral" title="Resumo do álbum" />
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p>
                Total de figurinhas:{" "}
                <span className="text-white">{stats.total}</span>
              </p>
              <p>
                Seleção mais completa:{" "}
                <span className="text-white">
                  {stats.mostComplete?.country ?? "-"}
                </span>
              </p>
              <p>
                Seleção menos completa:{" "}
                <span className="text-white">
                  {stats.leastComplete?.country ?? "-"}
                </span>
              </p>
            </div>
          </Card>
          <Card>
            <SectionTitle
              eyebrow="Persistência"
              title="Dados salvos por usuário"
            />
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Cada atualização grava o status da figurinha no banco, com
              autenticação por credenciais e cookies seguros via NextAuth.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}
