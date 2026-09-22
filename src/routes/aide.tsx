import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";

export const Route = createFileRoute("/aide")({
  head: () => ({
    meta: [
      { title: "Aide | Stuff Market" },
      {
        name: "description",
        content: "Comment publier une annonce, filtrer par ville et contacter un vendeur.",
      },
      { property: "og:title", content: "Aide | Stuff Market" },
      { property: "og:description", content: "Guide rapide pour acheter et vendre." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Aide,
});

const sections = [
  {
    titre: "Publier une annonce",
    texte:
      "Touchez le bouton « + Publier », ajoutez une photo, un titre, un prix en FCFA, votre ville et votre numéro WhatsApp, puis validez.",
  },
  {
    titre: "Filtrer par ville",
    texte:
      "Sur l'accueil, choisissez d'abord la région puis la ville. Seules les annonces de cette ville s'affichent.",
  },
  {
    titre: "Contacter un vendeur",
    texte:
      "Ouvrez une annonce et touchez le bouton vert « Contacter sur WhatsApp ». La conversation s'ouvre directement.",
  },
  {
    titre: "Booster une annonce",
    texte:
      "Depuis une annonce, touchez « Booster » : 500 F pour 7 jours ou 1000 F pour 1 mois, paiement Orange Money ou Moov.",
  },
];

function Aide() {
  return (
    <AppLayout>
      <h1 className="text-xl font-extrabold text-foreground">Aide</h1>
      <div className="mt-4 space-y-3">
        {sections.map((s) => (
          <div key={s.titre} className="rounded-2xl border border-border bg-card p-4">
            <h2 className="text-sm font-bold text-foreground">{s.titre}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{s.texte}</p>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
