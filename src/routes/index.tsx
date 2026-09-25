import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { formatPrix } from "@/lib/market";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stuff Market - Achète & Vends vite au Burkina" },
      {
        name: "description",
        content:
          "Achetez et vendez d'occasion au Burkina Faso. Contact direct par WhatsApp.",
      },
      {
        property: "og:title",
        content: "Stuff Market - Achète & Vends vite",
      },
      {
        property: "og:description",
        content: "Trouvez de bonnes affaires au Burkina Faso.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Accueil,
});

type Ad = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  price: number | null;
  location: string | null;
  whatsapp_phone: string | null;
  created_at: string;
  updated_at: string;
  photo_urls: string[] | null;
  business_id: string | null;
  auction_enabled: boolean;
  auction_start_price: number | null;
  auction_end_at: string | null;
  reference: string | null;
  allow_negotiation: boolean;
  status: string | null;
};

const categories = [
  "Téléphones",
  "Informatique",
  "Électronique",
  "Vêtements",
  "Chaussures",
  "Maison",
  "Meubles",
  "Véhicules",
  "Immobilier",
  "Services",
  "Autres",
];

function Accueil() {
  const queryClient = useQueryClient();

  const [categorie, setCategorie] = useState("");
  const [localisation, setLocalisation] = useState("");
  const [recherche, setRecherche] = useState("");

  const annonces = useQuery({
    queryKey: ["ads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data ?? []) as Ad[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("ads-accueil")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ads",
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["ads"],
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const localisations = useMemo(() => {
    const valeurs = (annonces.data ?? [])
      .map((ad) => ad.location)
      .filter((location): location is string => Boolean(location));

    return [...new Set(valeurs)].sort();
  }, [annonces.data]);

  const liste = useMemo(() => {
    const q = recherche.trim().toLowerCase();

    return (annonces.data ?? []).filter((ad) => {
      if (categorie && ad.category !== categorie) {
        return false;
      }

      if (localisation && ad.location !== localisation) {
        return false;
      }

      if (
        q &&
        !`${ad.title} ${ad.description ?? ""}`
          .toLowerCase()
          .includes(q)
      ) {
        return false;
      }

      return true;
    });
  }, [
    annonces.data,
    categorie,
    localisation,
    recherche,
  ]);

  return (
    <AppLayout>
      <div className="space-y-3 rounded-2xl border border-border bg-card p-3">
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un article..."
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
        />

        <div className="grid grid-cols-2 gap-2">
          <select
            value={categorie}
            onChange={(e) => setCategorie(e.target.value)}
            className="rounded-xl border border-input bg-background px-2 py-2 text-xs"
          >
            <option value="">Toutes les catégories</option>

            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={localisation}
            onChange={(e) => setLocalisation(e.target.value)}
            className="rounded-xl border border-input bg-background px-2 py-2 text-xs"
          >
            <option value="">Toutes les localisations</option>

            {localisations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>
      </div>

      {annonces.isLoading ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Chargement...
        </p>
      ) : annonces.isError ? (
        <p className="mt-6 rounded-2xl border border-destructive/20 bg-card p-4 text-center text-sm text-destructive">
          Impossible de charger les annonces pour le moment.
        </p>
      ) : liste.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Aucune annonce pour ces filtres.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {liste.map((ad) => {
            const imageUrl = ad.photo_urls?.[0] ?? null;

            return (
              <Link
                key={ad.id}
                to="/annonce/$id"
                params={{ id: ad.id }}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="relative aspect-square bg-muted">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={ad.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>

                <div className="p-2">
                  <p className="line-clamp-1 text-sm font-semibold text-foreground">
                    {ad.title}
                  </p>

                  {ad.price != null ? (
                    <p className="text-sm font-bold text-primary">
                      {formatPrix(Number(ad.price))}
                    </p>
                  ) : null}

                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {ad.location ?? "Localisation non renseignée"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}