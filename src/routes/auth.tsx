import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion | Stuff Market" },
      { name: "description", content: "Connectez-vous pour publier et gérer vos annonces." },
      { property: "og:title", content: "Connexion | Stuff Market" },
      { property: "og:description", content: "Connexion à votre compte Stuff Market." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Compte créé ! Vérifiez votre email pour confirmer.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Connecté !");
        navigate({ to: "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  const inputClass = "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm";

  return (
    <AppLayout>
      <h1 className="text-xl font-extrabold text-foreground">
        {mode === "login" ? "Connexion" : "Créer un compte"}
      </h1>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className={inputClass}
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
        </button>
      </form>
      <button
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
        className="mt-4 w-full text-sm text-muted-foreground underline"
      >
        {mode === "login" ? "Pas de compte ? Créer un compte" : "Déjà un compte ? Se connecter"}
      </button>
    </AppLayout>
  );
}
