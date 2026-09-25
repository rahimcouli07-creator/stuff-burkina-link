import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { ADMIN_WHATSAPP, PAYMENT_NUMBER } from "@/lib/market";

export const Route = createFileRoute("/boost/$id")({
  head: () => ({
    meta: [
      { title: "Booster mon annonce | Stuff Market" },
      {
        name: "description",
        content:
          "Mettez votre annonce à la une du Stuff Market pour 500F ou 1000F.",
      },
      { property: "og:title", content: "Booster mon annonce | Stuff Market" },
      {
        property: "og:description",
        content: "Plus de visibilité pour vendre plus vite.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Boost,
});

const formules = [
  { label: "500 F", duree: "7 jours" },
  { label: "1000 F", duree: "1 mois" },
];

function Boost() {
  const { id } = Route.useParams();

  return (
    <AppLayout>
      <h1 className="text-xl font-extrabold text-foreground">
        Booster mon annonce
      </h1>

      <p className="mt-1 text-sm text-muted-foreground">
        Votre annonce apparaît en premier avec le badge « À LA UNE ».
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {formules.map((formule) => (
          <div
            key={formule.duree}
            className="rounded-2xl border border-border bg-card p-4 text-center"
          >
            <p className="text-2xl font-black text-primary">
              {formule.label}
            </p>
            <p className="text-sm text-muted-foreground">
              {formule.duree}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-secondary p-4 text-sm text-secondary-foreground">
        Dépôt Orange Money / Moov au <strong>{PAYMENT_NUMBER}</strong> puis
        envoie capture sur WhatsApp Admin.
      </div>

      <a
        href={`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(
          `Bonjour Admin, j'ai payé le boost pour l'annonce ${id}.`,
        )}`}
        target="_blank"
        rel="noreferrer"
        onClick={() =>
          toast.success("Envoyez la capture à l'admin sur WhatsApp")
        }
        className="mt-4 block w-full rounded-xl bg-brand-green px-4 py-3 text-center text-sm font-bold text-accent-foreground"
      >
        J'ai payé
      </a>
    </AppLayout>
  );
}