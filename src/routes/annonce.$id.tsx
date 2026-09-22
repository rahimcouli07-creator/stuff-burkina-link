import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { fetchAnnonce, formatPrix } from "@/lib/market";

export const Route = createFileRoute("/annonce/$id")({
  head: () => ({
    meta: [
      { title: "Détail de l'annonce | Stuff Market" },
      {
        name: "description",
        content: "Voir les détails de cette annonce et contacter le vendeur sur WhatsApp.",
      },
      { property: "og:title", content: "Détail de l'annonce | Stuff Market" },
      { property: "og:description", content: "Contactez directement le vendeur sur WhatsApp." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["annonce", id],
    queryFn: () => fetchAnnonce(id),
  });

  if (isLoading) {
    return (
      <AppLayout>
        <p className="text-center text-sm text-muted-foreground">Chargement...</p>
      </AppLayout>
    );
  }

  if (!data) {
    return (
      <AppLayout>
        <p className="text-center text-sm text-muted-foreground">Annonce introuvable.</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="aspect-square bg-muted">
          {data.image_url ? (
            <img src={data.image_url} alt={data.titre} className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="space-y-2 p-4">
          {data.is_boosted ? (
            <span className="inline-block rounded-full bg-brand-yellow px-2 py-0.5 text-[10px] font-extrabold text-brand-yellow-foreground">
              À LA UNE
            </span>
          ) : null}
          <h1 className="text-xl font-extrabold text-foreground">{data.titre}</h1>
          <p className="text-2xl font-black text-primary">{formatPrix(data.prix)}</p>
          <p className="text-sm text-muted-foreground">
            {data.categorie} · {data.etat} · {data.ville} ({data.region})
          </p>
          <p className="whitespace-pre-line text-sm text-foreground">{data.description}</p>
          <a
            href={`https://wa.me/${data.whatsapp}?text=${encodeURIComponent(
              `Bonjour, je suis intéressé par votre annonce "${data.titre}" sur Stuff Market.`,
            )}`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block w-full rounded-xl bg-brand-green px-4 py-3 text-center text-sm font-bold text-accent-foreground"
          >
            Contacter sur WhatsApp
          </a>
          <Link
            to="/boost/$id"
            params={{ id: data.id }}
            className="block w-full rounded-xl border border-border px-4 py-3 text-center text-sm font-semibold text-foreground"
          >
            Booster cette annonce
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
