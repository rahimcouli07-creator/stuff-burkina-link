import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { ShareApp } from "@/components/ShareApp";

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
        <button
          onClick={() => navigate({ to: "/admin" })}
          className="text-xs text-muted-foreground underline"
        >
          Admin
        </button>
      </div>
    </AppLayout>
  );
}
