import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      setUser(data.user ?? null);

      if (data.user) {
        const { data: admin } = await (supabase as any)
          .from("admin_users")
          .select("id")
          .eq("id", data.user.id)
          .maybeSingle();
        if (active) setIsAdmin(Boolean(admin));
      } else {
        setIsAdmin(false);
      }
    };

    void load();
    const { data: listener } = supabase.auth.onAuthStateChange(() => void load());
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const bottomNav = [
    ["/", "Accueil", "⌂"],
    ["/offres", "Services", "✦"],
    ["/mes-annonces", "Mes annonces", "▣"],
    ["/messagerie", "Messagerie", "✉"],
  ] as const;

  const isActive = (to: string) =>
    location.pathname === to || (to !== "/" && location.pathname.startsWith(to));

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_38%),hsl(var(--background))] text-foreground">
      <header className="sticky top-0 z-[60] border-b border-border/60 bg-background/85 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-2xl">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-2 px-3 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary text-lg font-black text-primary-foreground shadow-lg shadow-primary/20">S</span>
            <span className="min-w-0">
              <span className="block truncate text-[17px] font-black tracking-tight sm:text-xl">STUFF MARKET</span>
              <span className="hidden text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground sm:block">Marketplace</span>
            </span>
          </Link>

          <div className="relative flex items-center gap-1.5 sm:gap-2">
            <Link
              to="/aide"
              aria-label="Aide"
              title="Aide"
              className={`grid h-10 w-10 place-items-center rounded-2xl border text-base transition hover:-translate-y-0.5 hover:bg-muted ${isActive("/aide") ? "border-primary/30 bg-primary/10 text-primary" : "border-border/70"}`}
            >
              ?
            </Link>
            <Link
              to="/parametres"
              aria-label="Paramètres"
              title="Paramètres"
              className={`grid h-10 w-10 place-items-center rounded-2xl border text-base transition hover:-translate-y-0.5 hover:bg-muted ${isActive("/parametres") ? "border-primary/30 bg-primary/10 text-primary" : "border-border/70"}`}
            >
              ⚙
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                aria-label="Administration"
                title="Administration"
                className="hidden h-10 items-center rounded-2xl border border-primary/25 bg-primary/10 px-3 text-xs font-black text-primary transition hover:-translate-y-0.5 hover:bg-primary/15 sm:flex"
              >
                ADMIN
              </Link>
            )}
            <button
              type="button"
              aria-label="Plus"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-2xl border border-border/70 text-lg font-black transition hover:-translate-y-0.5 hover:bg-muted sm:hidden"
            >
              ⋯
            </button>
            <Link
              to="/publier"
              aria-label="Publier une annonce"
              title="Publier"
              className="grid h-11 w-11 place-items-center rounded-full bg-primary text-[28px] font-light leading-none text-primary-foreground shadow-xl shadow-primary/25 transition hover:scale-105 active:scale-95"
            >
              +
            </Link>

            {moreOpen && (
              <div className="absolute right-0 top-12 z-[70] w-56 rounded-3xl border border-border/70 bg-background/95 p-2 shadow-2xl backdrop-blur-xl sm:hidden">
                {isAdmin && (
                  <Link to="/admin" onClick={() => setMoreOpen(false)} className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold hover:bg-muted">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">◆</span> Administration
                  </Link>
                )}
                <Link to="/aide" onClick={() => setMoreOpen(false)} className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold hover:bg-muted">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-muted">?</span> Aide
                </Link>
                <Link to="/parametres" onClick={() => setMoreOpen(false)} className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold hover:bg-muted">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-muted">⚙</span> Paramètres
                </Link>
                {!user && (
                  <Link to="/auth" onClick={() => setMoreOpen(false)} className="mt-1 flex items-center gap-3 rounded-2xl bg-primary px-3 py-3 text-sm font-bold text-primary-foreground">
                    Se connecter
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-3 pb-28 pt-5 sm:px-6 sm:pt-7">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-[60] border-t border-border/60 bg-background/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_35px_rgba(0,0,0,0.07)] backdrop-blur-2xl">
        <div className="mx-auto grid max-w-xl grid-cols-4 gap-1.5 px-2 py-2.5 sm:px-4">
          {bottomNav.map(([to, label, icon]) => {
            const active = isActive(to);
            return (
              <Link
                key={to}
                to={to as any}
                className={`group flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2.5 text-[10px] font-extrabold transition sm:text-[11px] ${active ? "bg-primary text-primary-foreground shadow-lg shadow-primary/15" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                <span className={`grid h-6 w-6 place-items-center rounded-xl text-base leading-none transition ${active ? "bg-white/15" : "group-hover:bg-background"}`}>{icon}</span>
                <span className="w-full truncate text-center">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
