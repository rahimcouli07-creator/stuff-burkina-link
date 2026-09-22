import { useState, type ReactNode } from "react";
import { ADMIN_PASSWORD } from "@/lib/market";

export function PasswordGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  if (unlocked) return <>{children}</>;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value === ADMIN_PASSWORD) {
          setUnlocked(true);
          setError(false);
        } else {
          setError(true);
        }
      }}
      className="mx-auto mt-10 max-w-sm rounded-xl border border-border bg-card p-5"
    >
      <h1 className="text-lg font-bold text-foreground">Espace Admin</h1>
      <p className="mt-1 text-sm text-muted-foreground">Entrez le mot de passe administrateur.</p>
      <input
        type="password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Mot de passe"
        className="mt-4 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
      />
      {error ? <p className="mt-2 text-sm text-destructive">Mot de passe incorrect</p> : null}
      <button
        type="submit"
        className="mt-4 w-full rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
      >
        Entrer
      </button>
    </form>
  );
}
