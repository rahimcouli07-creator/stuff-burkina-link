import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion | Stuff Market" },
      {
        name: "description",
        content: "Connectez-vous ou créez votre compte Stuff Market.",
      },
      { property: "og:title", content: "Connexion | Stuff Market" },
      {
        property: "og:description",
        content: "Connexion à votre compte Stuff Market.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "signup">("login");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [city, setCity] = useState("");
  const [locality, setLocality] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");

  const [createdStuffId, setCreatedStuffId] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);

    try {
      if (mode === "signup") {
        if (!firstName.trim() || !lastName.trim()) {
          throw new Error("Le prénom et le nom sont obligatoires.");
        }

        if (!city.trim()) {
          throw new Error("La ville est obligatoire.");
        }

        if (!whatsapp.trim()) {
          throw new Error("Le numéro WhatsApp est obligatoire.");
        }

        if (!/^\+[1-9][0-9]{7,14}$/.test(whatsapp.trim())) {
          throw new Error(
            "Le numéro WhatsApp doit être au format international, par exemple +226XXXXXXXX."
          );
        }

        if (password.length < 6) {
          throw new Error(
            "Le mot de passe doit contenir au moins 6 caractères."
          );
        }

        if (!email.trim()) {
          throw new Error(
            "Pour le moment, un email est nécessaire pour créer le compte."
          );
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              city: city.trim(),
              locality: locality.trim() || null,
              whatsapp_phone: whatsapp.trim(),
            },
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) throw error;

        /*
         * Si la confirmation email est désactivée,
         * Supabase crée directement la session.
         */
        if (data.user) {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("stuff_id")
            .eq("id", data.user.id)
            .maybeSingle();

          if (!profileError && profile?.stuff_id) {
            setCreatedStuffId(profile.stuff_id);
          }
        }

        toast.success(
          "Compte créé. Votre identifiant Stuff Market a été généré."
        );

        return;
      }

      const value = identifier.trim();

      if (!value) {
        throw new Error("Entrez votre email ou votre identifiant Stuff Market.");
      }

      let loginEmail = value;

      /*
       * Si l'utilisateur saisit un Stuff ID,
       * on retrouve l'email correspondant grâce à notre fonction SQL.
       */
      if (!value.includes("@")) {
        const { data, error } = await supabase.rpc(
          "get_email_by_stuff_id",
          {
            p_stuff_id: value,
          }
        );

        if (error) throw error;

        if (!data) {
          throw new Error("Identifiant Stuff Market introuvable.");
        }

        loginEmail = data;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (error) throw error;

      toast.success("Connexion réussie !");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary";

  if (createdStuffId) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-md">
          <h1 className="text-2xl font-extrabold text-foreground">
            Compte créé
          </h1>

          <div className="mt-5 rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              Votre identifiant Stuff Market est :
            </p>

            <p className="mt-2 text-3xl font-black tracking-widest text-primary">
              {createdStuffId}
            </p>

            <p className="mt-4 text-sm text-muted-foreground">
              Conservez bien cet identifiant. Vous pourrez l'utiliser pour
              vous connecter à Stuff Market.
            </p>

            <button
              type="button"
              onClick={() => {
                setIdentifier(createdStuffId);
                setCreatedStuffId("");
                setMode("login");
              }}
              className="mt-5 w-full rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground"
            >
              Se connecter
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-md">
        <h1 className="text-xl font-extrabold text-foreground">
          {mode === "login" ? "Connexion" : "Créer un compte"}
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "login"
            ? "Connectez-vous avec votre email ou votre identifiant Stuff Market."
            : "Créez votre compte Stuff Market."}
        </p>

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          {mode === "signup" ? (
            <>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Prénom"
                className={inputClass}
              />

              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Nom"
                className={inputClass}
              />

              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ville"
                className={inputClass}
              />

              <input
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="Localité / quartier (facultatif)"
                className={inputClass}
              />

              <input
                type="tel"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="WhatsApp : +226XXXXXXXX"
                className={inputClass}
              />

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
            </>
          ) : (
            <>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Email ou identifiant Stuff Market"
                className={inputClass}
              />

              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                className={inputClass}
              />
            </>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground disabled:opacity-50"
          >
            {busy
              ? "Traitement..."
              : mode === "login"
                ? "Se connecter"
                : "Créer mon compte"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setPassword("");
          }}
          className="mt-4 w-full text-sm font-semibold text-primary"
        >
          {mode === "login"
            ? "Pas encore de compte ? Créer un compte"
            : "Déjà un compte ? Se connecter"}
        </button>
      </div>
    </AppLayout>
  );
}