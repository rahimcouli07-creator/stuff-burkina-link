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
  trade_enabled: boolean;
};

type Boost = {
  ad_id: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
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
  const [trocSeulement, setTrocSeulement] = useState(false);

  /*
   * Récupération des annonces.
   *
   * IMPORTANT :
   * Les annonces publiées par Stuff Market utilisent le statut
   * "available", et non "active".
   */
  const annonces = useQuery({
    queryKey: ["ads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("status", "available")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return (data ?? []) as Ad[];
    },
  });

  /*
   * Récupération des boosts actifs.
   */
  const boosts = useQuery({
    queryKey: ["active-ad-boosts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_boosts")
        .select("ad_id,status,starts_at,ends_at")
        .eq("status", "active");

      if (error) {
        console.error("Erreur chargement boosts :", error);
        return [] as Boost[];
      }

      const maintenant = Date.now();

      return ((data ?? []) as Boost[]).filter((boost) => {
        if (!boost.ends_at) {
          return true;
        }

        return new Date(boost.ends_at).getTime() > maintenant;
      });
    },
  });

  /*
   * Mise à jour automatique lorsque quelqu'un publie,
   * modifie ou supprime une annonce.
   */
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

          queryClient.invalidateQueries({
            queryKey: ["active-ad-boosts"],
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  /*
   * Liste des localisations présentes dans les annonces.
   */
  const localisations = useMemo(() => {
    const valeurs = (annonces.data ?? [])
      .map((ad) => ad.location)
      .filter((location): location is string => Boolean(location?.trim()));

    return [...new Set(valeurs)].sort((a, b) =>
      a.localeCompare(b, "fr"),
    );
  }, [annonces.data]);

  /*
   * Ensemble des annonces boostées.
   */
  const boostedIds = useMemo(() => {
    return new Set(
      (boosts.data ?? []).map((boost) => boost.ad_id),
    );
  }, [boosts.data]);

  /*
   * Filtrage + classement :
   *
   * 1. Recherche
   * 2. Catégorie
   * 3. Localisation
   * 4. Troc
   * 5. Produits boostés en premier
   * 6. Plus récentes ensuite
   */
  const liste = useMemo(() => {
    const q = recherche.trim().toLowerCase();

    const filtered = (annonces.data ?? []).filter((ad) => {
      if (categorie && ad.category !== categorie) {
        return false;
      }

      if (localisation && ad.location !== localisation) {
        return false;
      }

      if (trocSeulement && !ad.trade_enabled) {
        return false;
      }

      if (
        q &&
        !`${ad.title} ${ad.description ?? ""} ${
          ad.category ?? ""
        } ${ad.location ?? ""}`
          .toLowerCase()
          .includes(q)
      ) {
        return false;
      }

      return true;
    });

    return filtered.sort((a, b) => {
      const aBoost = boostedIds.has(a.id);
      const bBoost = boostedIds.has(b.id);

      if (aBoost && !bBoost) {
        return -1;
      }

      if (!aBoost && bBoost) {
        return 1;
      }

      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    });
  }, [
    annonces.data,
    categorie,
    localisation,
    recherche,
    trocSeulement,
    boostedIds,
  ]);

  const resetFiltres = () => {
    setCategorie("");
    setLocalisation("");
    setRecherche("");
    setTrocSeulement(false);
  };

  return (
    <AppLayout>
      <div className="space-y-3 rounded-2xl border border-border bg-card p-3">
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un article..."
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
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

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setTrocSeulement((value) => !value)}
            className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
              trocSeulement
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground"
            }`}
          >
            {trocSeulement ? "Troc activé" : "Afficher les produits à troquer"}
          </button>

          {(categorie ||
            localisation ||
            recherche ||
            trocSeulement) && (
            <button
              type="button"
              onClick={resetFiltres}
              className="rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {annonces.isLoading ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Chargement des annonces...
        </p>
      ) : annonces.isError ? (
        <div className="mt-6 rounded-2xl border border-destructive/20 bg-card p-4 text-center">
          <p className="text-sm text-destructive">
            Impossible de charger les annonces pour le moment.
          </p>

          <button
            type="button"
            onClick={() => annonces.refetch()}
            className="mt-3 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
          >
            Réessayer
          </button>
        </div>
      ) : liste.length === 0 ? (
        <div className="mt-10 text-center">
          <p className="text-sm text-muted-foreground">
            Aucune annonce pour ces filtres.
          </p>

          {(categorie ||
            localisation ||
            recherche ||
            trocSeulement) && (
            <button
              type="button"
              onClick={resetFiltres}
              className="mt-3 rounded-xl border border-border px-4 py-2 text-xs"
            >
              Voir toutes les annonces
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              {liste.length}{" "}
              {liste.length > 1 ? "annonces" : "annonce"}
            </p>

            {boosts.isLoading ? null : (
              <p className="text-xs text-muted-foreground">
                Les annonces sponsorisées apparaissent en premier
              </p>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            {liste.map((ad) => {
              const imageUrl = ad.photo_urls?.[0] ?? null;
              const isBoosted = boostedIds.has(ad.id);

              return (
                <Link
                  key={ad.id}
                  to="/annonce/$id"
                  params={{ id: ad.id }}
                  className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative aspect-square bg-muted">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={ad.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        Pas de photo
                      </div>
                    )}

                    {isBoosted && (
                      <div className="absolute left-2 top-2 rounded-full bg-yellow-400 px-2 py-1 text-[10px] font-bold text-black shadow">
                        À LA UNE
                      </div>
                    )}

                    {ad.trade_enabled && (
                      <div className="absolute right-2 top-2 rounded-full bg-background/90 px-2 py-1 text-[10px] font-semibold text-foreground shadow">
                        TROC
                      </div>
                    )}
                  </div>

                  <div className="p-2">
                    <p className="line-clamp-1 text-sm font-semibold text-foreground">
                      {ad.title}
                    </p>

                    {ad.price != null ? (
                      <p className="mt-0.5 text-sm font-bold text-primary">
                        {formatPrix(Number(ad.price))}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Prix à discuter
                      </p>
                    )}

                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {ad.location ??
                        "Localisation non renseignée"}
                    </p>

                    {ad.allow_negotiation && (
                      <p className="mt-1 text-[10px] font-medium text-primary">
                        Marchandage possible
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </AppLayout>
  );
}