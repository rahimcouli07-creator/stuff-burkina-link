import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { ADMIN_WHATSAPP, fetchOffres, formatPrix } from "@/lib/market";

export const Route = createFileRoute("/offres")({
  head: () => ({
    meta: [
      { title: "Offres du moment | Stuff Market" },
      {
        name: "description",
        content: "Les offres et promotions publiées par Stuff Market au Burkina Faso.",
      },
      { property: "og:title", content: "Offres du moment | Stuff Market" },
      {
        property: "og:description",
        content: "Bons plans, promos et offres spéciales sur Stuff Market.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OffresPage,
});

function OffresPage() {
  const offres = useQuery({ queryKey: ["offres"], queryFn: fetchOffres });
  const liste = (offres.data ?? []).filter((o) => o.is_active);

  return (
    <AppLayout>
      <div className="space-y-4">
        <h1 className="text-xl font-extrabold text-foreground">Offres du moment</h1>

        {offres.isLoading && <p className="text-sm text-muted-foreground">Chargement...</p>}

        {!offres.isLoading && liste.length === 0 && (
          <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Aucune offre pour le moment. Revenez bientôt !
          </p>
        )}

        <div className="space-y-3">
          {liste.map((o) => (
            <article key={o.id} className="overflow-hidden rounded-2xl border border-border bg-card">
              {o.image_url && (
                <img src={o.image_url} alt={o.titre} className="h-44 w-full object-cover" />
              )}
              <div className="space-y-2 p-4">
                <h2 className="text-base font-bold text-foreground">{o.titre}</h2>
                {o.prix != null && (
                  <p className="text-sm font-black text-primary">{formatPrix(o.prix)}</p>
                )}
                {o.description && (
                  <p className="whitespace-pre-line text-sm text-muted-foreground">
                    {o.description}
                  </p>
                )}
                <a
                  href={`https://wa.me/${o.whatsapp || ADMIN_WHATSAPP}?text=${encodeURIComponent(
                    `Bonjour, je suis intéressé par l'offre : ${o.titre}`,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-xl bg-accent px-4 py-2 text-sm font-bold text-accent-foreground"
                >
                  Contacter sur WhatsApp
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
