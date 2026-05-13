"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpenText,
  LayoutDashboard,
  Users,
  LogOut,
  MoonStar,
  Search,
  Sparkles,
  SunMedium,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/stickers", label: "Figurinhas", icon: BookOpenText },
  { href: "/family", label: "Família", icon: Users },
  { href: "/search", label: "Busca", icon: Search },
  { href: "/stats", label: "Estatísticas", icon: Sparkles },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") {
      return "dark";
    }

    return (
      (window.localStorage.getItem("figurinha-theme") as
        | "dark"
        | "light"
        | null) ?? "dark"
    );
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("figurinha-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("figurinha-theme", nextTheme);
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-8 pt-4 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-30 rounded-4xl border border-white/10 bg-slate-950/80 px-4 py-3 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl shadow-lg shadow-cyan-500/25">
                <Image
                  src="/logo.png"
                  alt="Logo Figurinhas da Copa"
                  className="h-full w-full object-cover"
                  width={100}
                  height={100}
                />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">
                  Figurinhas da Copa
                </p>
                <p className="text-xs text-slate-400">
                  Controle inteligente do álbum
                </p>
              </div>
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm text-slate-100 transition hover:bg-white/10"
              >
                {theme === "dark" ? (
                  <SunMedium className="h-4 w-4" />
                ) : (
                  <MoonStar className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Tema</span>
              </button>
              {session?.user ? (
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm text-slate-100 transition hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center rounded-full bg-cyan-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                >
                  Entrar
                </Link>
              )}
            </div>
          </div>
          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 w-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex shrink-0 min-w-max items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                    active
                      ? "bg-white text-slate-950"
                      : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="flex-1 py-5">{children}</main>
      </div>
    </div>
  );
}
