import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { fetchAnnonces, formatPrix } from "@/lib/market";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stuff Market - Achète & Vends vite au Burkina" },
      {
        name: "description",
        content:
          "Achetez et vendez au Burkina Faso. Trouvez des articles près de chez vous et contactez directement les vendeurs.",
      },
      {
        property: "og:title",
        content: "Stuff Market - Achète & Vends vite",
      },
      {
        property: "og:description",
        content:
          "Trouvez des bonnes affaires près de chez vous au Burkina Faso.",
      },
      { property: "og:type", content: "website" },
      {
        property: "og:url",
        content: "https://stuff-burkina-link.lovable.app",
      },
      {
        property: "og:image",
        content:
          "https://stuff-burkina-link.lovable.app/og-image.jpg",
      },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:image",
        content:
          "https://stuff-burkina-link.lovable.app/og-image.jpg",
      },
    ],
  }),
  component: Accueil,
});

function Accueil() {
  const queryClient = useQueryClient();

  const [categorie, setCategorie] = useState("");
  const [recherche, setRecherche] = useState("");

  const annonces = useQuery({
    queryKey: ["annonces"],
    queryFn: fetchAnnonces,
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
            queryKey: ["annonces"],
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const categories = useMemo(() => {
    const values = new Set<string>();

    for (const annonce of annonces.data ?? []) {
      if (annonce.category) {
        values.add(annonce.category);
      }
    }

    return Array.from(values).sort((a, b) =>
      a.localeCompare(b, "fr"),
    );
  }, [annonces.data]);

  const liste = useMemo(() => {
    const q = recherche.trim().toLowerCase();

    return (annonces.data ?? []).filter((a) => {
      if (a.status === "inactive") {
        return false;
      }

      if (categorie && a.category !== categorie) {
        return false;
      }

      if (
        q &&
        !`${a.title} ${a.description ?? ""} ${
          a.category ?? ""
        } ${a.location ?? ""}`
          .toLowerCase()
          .includes(q)
      ) {
        return false;
      }

      return true;
    });
  }, [annonces.data, categorie, recherche]);

  return (
    <AppLayout>
      <div className="space-y-3 rounded-2xl border border-border bg-card p-3">
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un article..."
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
        />

        <select
          value={categorie}
          onChange={(e) => setCategorie(e.target.value)}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Toutes les catégories</option>

          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
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
          {liste.map((a) => {
            const imageUrl = a.photo_urls?.[0] ?? null;

            return (
              <Link
                key={a.id}
                to="/annonce/$id"
                params={{ id: a.id }}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="relative aspect-square bg-muted">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={a.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      Aucune image
                    </div>
                  )}
                </div>

                <div className="p-2">
                  <p className="line-clamp-1 text-sm font-semibold text-foreground">
                    {a.title}
                  </p>

                  {a.price != null && (
                    <p className="text-sm font-bold text-primary">
                      {formatPrix(Number(a.price))}
                    </p>
                  )}

                  {a.location && (
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {a.location}
                    </p>
                  )}

                  {a.category && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {a.category}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}