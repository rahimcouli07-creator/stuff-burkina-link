import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AppLayout } from "@/components/AppLayout";
import {
  ADMIN_WHATSAPP,
  fetchAnnonce,
  formatPrix,
  normalizePhone,
} from "@/lib/market";

export const Route = createFileRoute("/annonce/$id")({
  head: () => ({
    meta: [
      { title: "Détail de l'annonce | Stuff Market" },
      {
        name: "description",
        content:
          "Voir les détails de cette annonce et contacter le vendeur sur WhatsApp.",
      },
      {
        property: "og:title",
        content: "Détail de l'annonce | Stuff Market",
      },
      {
        property: "og:description",
        content:
          "Contactez directement le vendeur sur WhatsApp.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["annonce", id],
    queryFn: () => fetchAnnonce(id),
  });

  if (isLoading) {
    return (
      <AppLayout>
        <p className="text-center text-sm text-muted-foreground">
          Chargement...
        </p>
      </AppLayout>
    );
  }

  if (isError || !data) {
    return (
      <AppLayout>
        <p className="text-center text-sm text-muted-foreground">
          Annonce introuvable.
        </p>
      </AppLayout>
    );
  }

  const imageUrl = data.photo_urls?.[0] ?? null;

  const whatsapp =
    normalizePhone(data.whatsapp_phone ?? "") ||
    normalizePhone(ADMIN_WHATSAPP);

  const message = encodeURIComponent(
    `Bonjour, je suis intéressé par votre annonce "${data.title}" sur Stuff Market.`,
  );

  return (
    <AppLayout>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="aspect-square bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={data.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Aucune image
            </div>
          )}
        </div>

        <div className="space-y-3 p-4">
          <h1 className="text-xl font-extrabold text-foreground">
            {data.title}
          </h1>

          {data.price != null && (
            <p className="text-2xl font-black text-primary">
              {formatPrix(Number(data.price))}
            </p>
          )}

          {data.category && (
            <p className="text-sm text-muted-foreground">
              Catégorie : {data.category}
            </p>
          )}

          {data.location && (
            <p className="text-sm text-muted-foreground">
              Localisation : {data.location}
            </p>
          )}

          {data.allow_negotiation && (
            <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
              Prix négociable
            </span>
          )}

          {data.auction_enabled && (
            <div className="rounded-xl border border-border bg-secondary p-3 text-sm">
              <p className="font-bold">Vente aux enchères</p>

              {data.auction_start_price != null && (
                <p className="text-muted-foreground">
                  Prix de départ :{" "}
                  {formatPrix(Number(data.auction_start_price))}
                </p>
              )}

              {data.auction_end_at && (
                <p className="text-muted-foreground">
                  Fin :{" "}
                  {new Date(data.auction_end_at).toLocaleString("fr-FR")}
                </p>
              )}
            </div>
          )}

          {data.description && (
            <p className="whitespace-pre-line text-sm text-foreground">
              {data.description}
            </p>
          )}

          {data.reference && (
            <p className="text-xs text-muted-foreground">
              Référence : {data.reference}
            </p>
          )}

          {data.status && (
            <p className="text-xs text-muted-foreground">
              Statut : {data.status}
            </p>
          )}

          <a
            href={`https://wa.me/${whatsapp}?text=${message}`}
            target="_blank"
            rel="noreferrer"
            className="block w-full rounded-xl bg-brand-green px-4 py-3 text-center text-sm font-bold text-accent-foreground"
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