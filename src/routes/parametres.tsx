import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { ShareApp } from "@/components/ShareApp";
import { ADMIN_PASSWORD } from "@/lib/market";

export const Route = createFileRoute("/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres | Stuff Market" },
      {
        name: "description",
        content: "Informations sur l'application Stuff Market et accès administrateur.",
      },
      { property: "og:title", content: "Paramètres | Stuff Market" },
      { property: "og:description", content: "Infos application et accès admin." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Parametres,
});

function Parametres() {
  const navigate = useNavigate();
  const [demande, setDemande] = useState(false);
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState(false);

  return (
    <AppLayout>
      <h1 className="text-xl font-extrabold text-foreground">Paramètres</h1>

      <div className="mt-4 space-y-2 rounded-2xl border border-border bg-card p-4 text-sm">
        <p className="font-bold text-foreground">Stuff Market</p>
        <p className="text-muted-foreground">Marketplace seconde main au Burkina Faso.</p>
        <p className="text-muted-foreground">Version 1.0</p>
        <p className="text-muted-foreground">Publication gratuite, contact direct par WhatsApp.</p>
      </div>

      <div className="mt-4">
        <ShareApp variant="button" />
      </div>

      <div className="mt-10 text-center">
        {demande ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (motDePasse === ADMIN_PASSWORD) {
                navigate({ to: "/admin" });
              } else {
                setErreur(true);
              }
            }}
            className="mx-auto max-w-xs space-y-2"
          >
            <input
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="Mot de passe"
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            />
            {erreur ? <p className="text-sm text-destructive">Mot de passe incorrect</p> : null}
            <button
              type="submit"
              className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
            >
              Valider
            </button>
          </form>
        ) : (
          <button
            onClick={() => setDemande(true)}
            className="text-xs text-muted-foreground underline"
          >
            Admin
          </button>
        )}
      </div>
    </AppLayout>
  );
}
