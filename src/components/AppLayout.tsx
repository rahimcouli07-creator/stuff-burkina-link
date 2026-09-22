import { Link, useRouterState } from "@tanstack/react-router";
import { Home, HelpCircle, Settings, ListChecks, Plus, Tag } from "lucide-react";
import type { ReactNode } from "react";
import logo from "@/assets/logo.png";

const navItems = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/offres", label: "Offres", icon: Tag },
  { to: "/mes-annonces", label: "Mes annonces", icon: ListChecks },
  { to: "/aide", label: "Aide", icon: HelpCircle },
  { to: "/parametres", label: "Réglages", icon: Settings },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Stuff Market" width={40} height={40} className="h-10 w-10" />
            <span className="text-lg font-extrabold tracking-tight text-foreground">
              Stuff <span className="text-primary">Market</span>
            </span>
          </Link>
          <span className="ml-auto rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            Burkina Faso
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-4">{children}</main>

      <Link
        to="/publier"
        className="fixed bottom-20 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg transition-transform active:scale-95"
      >
        <Plus className="h-5 w-5" /> Publier
      </Link>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card">
        <div className="mx-auto flex max-w-3xl">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
