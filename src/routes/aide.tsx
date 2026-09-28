import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  ChevronDown,
  CircleHelp,
  Heart,
  MessageCircle,
  Package,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Tag,
  TrendingUp,
  UserRound,
  WalletCards,
  Wrench,
} from "lucide-react";
import { useState } from "react";

import { AppLayout } from "@/components/AppLayout";

export const Route = createFileRoute("/aide")({
  head: () => ({
    meta: [
      { title: "Aide | Stuff Market" },
      {
        name: "description",
        content:
          "Découvrez comment utiliser Stuff Market : acheter, vendre, publier, négocier, utiliser les services, les boutiques et les boosts.",
      },
    ],
  }),
  component: AidePage,
});

type HelpItem = {
  title: string;
  icon: typeof Search;
  text: string;
};

const sections: HelpItem[] = [
  {
    title: "Acheter un produit",
    icon: Search,
    text:
      "Parcourez les annonces, utilisez les filtres et ouvrez une annonce pour voir les photos, le prix, la localisation et les informations du vendeur. Vous pouvez contacter le vendeur directement sur WhatsApp.",
  },
  {
    title: "Publier un produit",
    icon: Package,
    text:
      "Appuyez sur Publier puis choisissez Produit simple. Ajoutez les informations du produit, sa région, sa province, sa localisation et jusqu'à 3 photos. Un compte est nécessaire pour publier.",
  },
  {
    title: "Boutique / Entreprise",
    icon: Store,
    text:
      "Choisissez Boutique / Entreprise pour présenter votre activité. Vous pouvez renseigner le nom, la catégorie, les coordonnées, la localisation exacte, le site web et les photos de votre boutique.",
  },
  {
    title: "Négocier le prix",
    icon: WalletCards,
    text:
      "Lorsque le vendeur autorise la négociation, le bouton Marchander permet d'ouvrir WhatsApp pour discuter directement du prix avec lui.",
  },
  {
    title: "Contacter sur WhatsApp",
    icon: MessageCircle,
    text:
      "Le bouton WhatsApp prépare un message avec les informations utiles de l'annonce. Vous pouvez ensuite vérifier le message avant de l'envoyer au vendeur.",
  },
  {
    title: "Troc",
    icon: Tag,
    text:
      "Certaines annonces peuvent accepter le troc. Utilisez le filtre Troc pour retrouver les produits concernés et consultez les conditions indiquées par le vendeur.",
  },
  {
    title: "Services",
    icon: Wrench,
    text:
      "La rubrique Services permet de découvrir des professionnels : plomberie, maçonnerie, soudure, coiffure, couture, menuiserie, réparation et autres métiers. Pour proposer un service, contactez les administrateurs de Stuff Market.",
  },
  {
    title: "Boost d'une annonce",
    icon: TrendingUp,
    text:
      "Une annonce peut être mise en avant avec un boost. Les formules disponibles sont affichées dans la page de boost. Après une demande, l'administration peut vérifier et valider le boost.",
  },
  {
    title: "Favoris",
    icon: Heart,
    text:
      "Ajoutez les annonces qui vous intéressent à vos favoris pour pouvoir les retrouver plus facilement. Cette fonction nécessite un compte.",
  },
  {
    title: "Mon compte",
    icon: UserRound,
    text:
      "Votre compte permet de gérer vos annonces, vos informations et vos actions réservées aux utilisateurs connectés. Le Stuff ID sert à identifier votre compte sur la plateforme.",
  },
  {
    title: "Sécurité et confiance",
    icon: ShieldCheck,
    text:
      "Vérifiez les informations d'une annonce avant une transaction. Ne partagez jamais votre mot de passe et restez prudent lorsque vous échangez avec un vendeur ou un acheteur.",
  },
  {
    title: "À la Une",
    icon: Sparkles,
    text:
      "Les annonces bénéficiant d'une mise en avant peuvent apparaître dans la section À LA UNE afin d'être plus visibles sur la page d'accueil.",
  },
];

function AidePage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <AppLayout>
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-20 -top-20 h-52 w-52 animate-pulse rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-24 h-48 w-48 animate-pulse rounded-full bg-secondary blur-3xl [animation-delay:700ms]" />

        <section className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-5 shadow-sm sm:p-7">
          <div className="absolute right-4 top-4 animate-[bounce_3s_ease-in-out_infinite] rounded-2xl bg-primary/10 p-3">
            <CircleHelp className="h-7 w-7 text-primary" />
          </div>

          <div className="max-w-[82%]">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-black tracking-[0.16em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              STUFF MARKET
            </div>

            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Comment pouvons-nous vous aider ?
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Retrouvez ici les principales fonctionnalités de Stuff Market et
              découvrez rapidement comment acheter, vendre, négocier et utiliser
              les services de la plateforme.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["Acheter", Search],
              ["Publier", Package],
              ["Services", Wrench],
              ["Compte", UserRound],
            ].map(([label, Icon]) => {
              const ItemIcon = Icon as typeof Search;
              return (
                <div
                  key={label as string}
                  className="group rounded-2xl border border-border bg-background/70 p-3 text-center transition duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <ItemIcon className="mx-auto h-5 w-5 text-primary transition-transform duration-300 group-hover:scale-110" />
                  <span className="mt-1 block text-xs font-bold text-foreground">
                    {label as string}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-5 space-y-2">
          {sections.map((item, index) => {
            const Icon = item.icon;
            const isOpen = open === index;

            return (
              <div
                key={item.title}
                className={`overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 ${
                  isOpen
                    ? "border-primary/30 shadow-md"
                    : "border-border hover:-translate-y-0.5"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : index)}
                  className="flex w-full items-center gap-3 px-4 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                      isOpen
                        ? "bg-primary text-primary-foreground rotate-0"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>

                  <span className="flex-1">
                    <span className="block text-sm font-extrabold text-foreground">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      Appuyez pour en savoir plus
                    </span>
                  </span>

                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-primary" : ""
                    }`}
                  />
                </button>

                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ${
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="border-t border-border px-4 pb-4 pt-3 pl-[4.25rem] text-sm leading-6 text-muted-foreground">
                      {item.text}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="mt-5 overflow-hidden rounded-[2rem] border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary p-2 text-primary-foreground">
              <BadgeCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-foreground">
                Une question ou un problème ?
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Pour les demandes liées à la publication d'un service ou à
                l'administration de la plateforme, utilisez les contacts
                WhatsApp indiqués dans la rubrique Services.
              </p>
            </div>
          </div>

          <Link
            to="/offres"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-95"
          >
            <Wrench className="h-4 w-4" />
            Voir les Services
          </Link>
        </section>

        <div className="mt-5 flex items-center justify-center gap-2 pb-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          Utilisez Stuff Market avec prudence et vérifiez toujours les informations avant une transaction.
        </div>
      </div>
    </AppLayout>
  );
}
