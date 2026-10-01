import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  MessageCircle,
  Bookmark,
  LayoutGrid,
  Plus,
  Settings,
  CircleHelp,
  ChevronDown,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import logo from "@/assets/logo.png";
import { ShareApp } from "@/components/ShareApp";

const navItems = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/messagerie", label: "Messagerie", icon: MessageCircle },
  { to: "/mes-annonces", label: "Mes annonces", icon: Bookmark },
  { to: "/offres", label: "Services", icon: LayoutGrid },
];

const countries = [
  "Burkina Faso",
  "Côte d’Ivoire",
  "Mali",
  "Niger",
  "Sénégal",
  "Togo",
  "Bénin",
  "Ghana",
  "Nigeria",
  "France",
  "Autre",
];

function CountrySelector() {
  const [value, setValue] = useState("Burkina Faso");

  useEffect(() => {
    const saved = window.localStorage.getItem("stuffmarket-country");
    if (saved && countries.includes(saved)) setValue(saved);
  }, []);

  function changeCountry(next: string) {
    setValue(next);
    window.localStorage.setItem("stuffmarket-country", next);
    window.dispatchEvent(new CustomEvent("stuffmarket-country-changed", { detail: next }));
  }

  return (
    <label className="relative inline-flex min-w-0 items-center rounded-full border border-border bg-background shadow-sm">
      <span className="sr-only">Pays</span>
      <select
        value={value}
        onChange={(event) => changeCountry(event.target.value)}
        className="max-w-[130px] appearance-none bg-transparent py-2 pl-3 pr-8 text-xs font-black text-foreground outline-none sm:max-w-[150px]"
      >
        {countries.map((country) => (
          <option key={country} value={country}>
            {country}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-4 w-4 text-primary" />
    </label>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  return (
    <div className="min-h-screen bg-[#fffafa] pb-28 text-foreground">
      <header className="sticky top-0 z-30 border-b border-red-100 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4">
          <Link to="/" className="flex min-w-0 shrink-0 items-center gap-2">
            <img
              src={logo}
              alt="STUFF MARKET"
              width={44}
              height={44}
              className="h-10 w-10 shrink-0 rounded-xl object-cover sm:h-11 sm:w-11"
            />
            <span className="whitespace-nowrap text-[15px] font-black tracking-tight text-[#151515] sm:text-lg">
              STUFF <span className="text-primary">MARKET</span>
            </span>
          </Link>

          <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
            <CountrySelector />
            <Link
              to="/aide"
              aria-label="Aide"
              className="hidden rounded-full border border-border bg-background p-2 text-muted-foreground transition hover:border-primary hover:text-primary sm:inline-flex"
            >
              <CircleHelp className="h-4 w-4" />
            </Link>
            <Link
              to="/parametres"
              aria-label="Réglages"
              className="rounded-full border border-border bg-background p-2 text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              <Settings className="h-4 w-4" />
            </Link>
            <ShareApp />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-3 py-4 sm:px-4 sm:py-5">
        {children}
      </main>

      <Link
        to="/publier"
        className="fixed bottom-[4.75rem] right-4 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-black text-primary-foreground shadow-xl shadow-red-200 transition hover:-translate-y-0.5 active:scale-95 sm:right-6"
      >
        <Plus className="h-5 w-5" />
        Publier
      </Link>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-red-100 bg-white/98 shadow-[0_-8px_30px_rgba(0,0,0,0.07)] backdrop-blur">
        <div className="mx-auto flex max-w-5xl">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-black sm:text-[11px] ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {active && <span className="absolute top-0 h-0.5 w-10 rounded-full bg-primary" />}
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
