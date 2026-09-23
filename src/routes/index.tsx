import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchAnnonces,
  fetchCategories,
  fetchRegions,
  fetchVilles,
  formatPrix,
} from "@/lib/market";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stuff Market - Achète & Vends vite au Burkina" },
      {
        name: "description",
        content:
          "Achetez et vendez d'occasion au Burkina Faso : livres, tenues, chaussures, téléphones. Contact direct par WhatsApp.",
      },
      { property: "og:title", content: "Stuff Market - Achète & Vends vite" },
      {
        property: "og:description",
        content: "Trouvez des bonnes affaires près de chez vous, ville par ville.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://stuff-burkina-link.lovable.app" },
      { property: "og:image", content: "https://stuff-burkina-link.lovable.app/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://stuff-burkina-link.lovable.app/og-image.jpg" },
    ],
  }),
  component: Accueil,
});

function Accueil() {
  const queryClient = useQueryClient();
  const [region, setRegion] = useState("Centre-Est");
  const [ville, setVille] = useState("Tenkodogo");
  const [categorie, setCategorie] = useState("");
  const [recherche, setRecherche] = useState("");

  const annonces = useQuery({ queryKey: ["annonces"], queryFn: fetchAnnonces });
  const regions = useQuery({ queryKey: ["regions"], queryFn: fetchRegions });
  const villes = useQuery({ queryKey: ["villes"], queryFn: fetchVilles });
  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  useEffect(() => {
    const channel = supabase
      .channel("annonces-accueil")
      .on("postgres_changes", { event: "*", schema: "public", table: "annonces" }, () => {
        queryClient.invalidateQueries({ queryKey: ["annonces"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const villesFiltrees = useMemo(
    () => (villes.data ?? []).filter((v) => !region || v.region === region),
    [villes.data, region],
  );

  const liste = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return (annonces.data ?? []).filter((a) => {
      if (ville && a.ville !== ville) return false;
      if (!ville && region && a.region !== region) return false;
      if (categorie && a.categorie !== categorie) return false;
      if (q && !`${a.titre} ${a.description ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [annonces.data, ville, region, categorie, recherche]);

  return (
    <AppLayout>
      <div className="space-y-3 rounded-2xl border border-border bg-card p-3">
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un article..."
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-3 gap-2">
          <select
            value={region}
            onChange={(e) => {
              setRegion(e.target.value);
              setVille("");
            }}
            className="rounded-xl border border-input bg-background px-2 py-2 text-xs"
          >
            <option value="">Région</option>
            {(regions.data ?? []).map((r) => (
              <option key={r.id} value={r.nom}>
                {r.nom}
              </option>
            ))}
          </select>
          <select
            value={ville}
            onChange={(e) => setVille(e.target.value)}
            className="rounded-xl border border-input bg-background px-2 py-2 text-xs"
          >
            <option value="">Ville</option>
            {villesFiltrees.map((v) => (
              <option key={v.id} value={v.nom_ville}>
                {v.nom_ville}
              </option>
            ))}
          </select>
          <select
            value={categorie}
            onChange={(e) => setCategorie(e.target.value)}
            className="rounded-xl border border-input bg-background px-2 py-2 text-xs"
          >
            <option value="">Catégorie</option>
            {(categories.data ?? []).map((c) => (
              <option key={c.id} value={c.nom}>
                {c.nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      {annonces.isLoading ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">Chargement...</p>
      ) : liste.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Aucune annonce pour ces filtres.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {liste.map((a) => (
            <Link
              key={a.id}
              to="/annonce/$id"
              params={{ id: a.id }}
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div className="relative aspect-square bg-muted">
                {a.image_url ? (
                  <img
                    src={a.image_url}
                    alt={a.titre}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : null}
                {a.is_boosted ? (
                  <span className="absolute left-2 top-2 rounded-full bg-brand-yellow px-2 py-0.5 text-[10px] font-extrabold text-brand-yellow-foreground">
                    À LA UNE
                  </span>
                ) : null}
              </div>
              <div className="p-2">
                <p className="line-clamp-1 text-sm font-semibold text-foreground">{a.titre}</p>
                <p className="text-sm font-bold text-primary">{formatPrix(a.prix)}</p>
                <p className="text-xs text-muted-foreground">{a.ville}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
