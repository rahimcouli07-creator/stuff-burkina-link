import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { PasswordGate } from "@/components/PasswordGate";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchAnnonces,
  fetchCategories,
  fetchOffres,
  fetchRegions,
  fetchVilles,
  formatPrix,
  normalizePhone,
  uploadImage,
} from "@/lib/market";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administration | Stuff Market" },
      { name: "description", content: "Espace administrateur de Stuff Market." },
      { property: "og:title", content: "Administration | Stuff Market" },
      { property: "og:description", content: "Gestion des annonces, villes et catégories." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <AppLayout>
      <PasswordGate>
        <AdminPanel />
      </PasswordGate>
    </AppLayout>
  );
}

function AdminPanel() {
  const queryClient = useQueryClient();
  const annonces = useQuery({ queryKey: ["annonces"], queryFn: fetchAnnonces });
  const regions = useQuery({ queryKey: ["regions"], queryFn: fetchRegions });
  const villes = useQuery({ queryKey: ["villes"], queryFn: fetchVilles });
  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  const [nouvelleRegion, setNouvelleRegion] = useState("");
  const [nouvelleVille, setNouvelleVille] = useState("");
  const [villeRegion, setVilleRegion] = useState("");
  const [nouvelleCategorie, setNouvelleCategorie] = useState("");

  const offres = useQuery({ queryKey: ["offres"], queryFn: fetchOffres });
  const [offreTitre, setOffreTitre] = useState("");
  const [offreDescription, setOffreDescription] = useState("");
  const [offrePrix, setOffrePrix] = useState("");
  const [offreWhatsapp, setOffreWhatsapp] = useState("");
  const [offreImage, setOffreImage] = useState<File | null>(null);
  const [offreEnCours, setOffreEnCours] = useState(false);

  async function ajouterOffre() {
    if (!offreTitre.trim()) {
      toast.error("Le titre est obligatoire");
      return;
    }
    setOffreEnCours(true);
    try {
      let imageUrl: string | null = null;
      if (offreImage) imageUrl = await uploadImage(offreImage);
      const tel = normalizePhone(offreWhatsapp);
      const { error } = await supabase.from("offres").insert({
        titre: offreTitre.trim(),
        description: offreDescription.trim() || null,
        prix: offrePrix ? Number(offrePrix) : null,
        whatsapp: tel ? (tel.startsWith("226") ? tel : `226${tel}`) : null,
        image_url: imageUrl,
      });
      if (error) throw error;
      setOffreTitre("");
      setOffreDescription("");
      setOffrePrix("");
      setOffreWhatsapp("");
      setOffreImage(null);
      queryClient.invalidateQueries({ queryKey: ["offres"] });
      toast.success("Offre publiée");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setOffreEnCours(false);
    }
  }

  const liste = annonces.data ?? [];
  const boostees = liste.filter((a) => a.is_boosted).length;
  const valeur = liste.reduce((sum, a) => sum + a.prix, 0);

  async function run(promise: PromiseLike<{ error: { message: string } | null }>, keys: string[]) {
    const { error } = await promise;
    if (error) {
      toast.error(error.message);
      return;
    }
    keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
    toast.success("Mise à jour effectuée");
  }

  const inputClass = "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm";

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-extrabold text-foreground">Administration</h1>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Annonces", valeur: String(liste.length) },
          { label: "À la une", valeur: String(boostees) },
          { label: "Valeur", valeur: formatPrix(valeur) },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-3 text-center">
            <p className="text-lg font-black text-primary">{s.valeur}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-bold text-foreground">Annonces</h2>
        {liste.map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-2 rounded-2xl border border-border bg-card p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-semibold text-foreground">{a.titre}</p>
              <p className="text-xs text-muted-foreground">
                {a.ville} · {formatPrix(a.prix)}
              </p>
            </div>
            <button
              onClick={() =>
                run(
                  supabase.from("annonces").update({ is_boosted: !a.is_boosted }).eq("id", a.id),
                  ["annonces"],
                )
              }
              className={`rounded-xl px-3 py-2 text-xs font-bold ${
                a.is_boosted
                  ? "bg-brand-yellow text-brand-yellow-foreground"
                  : "border border-border text-foreground"
              }`}
            >
              Boost
            </button>
            <button
              onClick={() => run(supabase.from("annonces").delete().eq("id", a.id), ["annonces"])}
              className="rounded-xl border border-destructive px-3 py-2 text-xs font-bold text-destructive"
            >
              Suppr.
            </button>
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold text-foreground">Régions</h2>
        <div className="flex gap-2">
          <input
            value={nouvelleRegion}
            onChange={(e) => setNouvelleRegion(e.target.value)}
            placeholder="Nouvelle région"
            className={inputClass}
          />
          <button
            onClick={() => {
              if (!nouvelleRegion.trim()) return;
              run(supabase.from("regions").insert({ nom: nouvelleRegion.trim() }), ["regions"]);
              setNouvelleRegion("");
            }}
            className="rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
          >
            Ajouter
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(regions.data ?? []).map((r) => (
            <button
              key={r.id}
              onClick={() => run(supabase.from("regions").delete().eq("id", r.id), ["regions"])}
              className="rounded-full border border-border px-3 py-1 text-xs text-foreground"
            >
              {r.nom} ✕
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold text-foreground">Villes</h2>
        <div className="flex gap-2">
          <input
            value={nouvelleVille}
            onChange={(e) => setNouvelleVille(e.target.value)}
            placeholder="Nouvelle ville"
            className={inputClass}
          />
          <select
            value={villeRegion}
            onChange={(e) => setVilleRegion(e.target.value)}
            className={inputClass}
          >
            <option value="">Région</option>
            {(regions.data ?? []).map((r) => (
              <option key={r.id} value={r.nom}>
                {r.nom}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              if (!nouvelleVille.trim() || !villeRegion) return;
              run(
                supabase
                  .from("villes")
                  .insert({ nom_ville: nouvelleVille.trim(), region: villeRegion }),
                ["villes"],
              );
              setNouvelleVille("");
            }}
            className="rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
          >
            +
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(villes.data ?? []).map((v) => (
            <button
              key={v.id}
              onClick={() => run(supabase.from("villes").delete().eq("id", v.id), ["villes"])}
              className="rounded-full border border-border px-3 py-1 text-xs text-foreground"
            >
              {v.nom_ville} ✕
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold text-foreground">Catégories</h2>
        <div className="flex gap-2">
          <input
            value={nouvelleCategorie}
            onChange={(e) => setNouvelleCategorie(e.target.value)}
            placeholder="Nouvelle catégorie"
            className={inputClass}
          />
          <button
            onClick={() => {
              if (!nouvelleCategorie.trim()) return;
              run(supabase.from("categories").insert({ nom: nouvelleCategorie.trim() }), [
                "categories",
              ]);
              setNouvelleCategorie("");
            }}
            className="rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
          >
            Ajouter
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(categories.data ?? []).map((c) => (
            <button
              key={c.id}
              onClick={() =>
                run(supabase.from("categories").delete().eq("id", c.id), ["categories"])
              }
              className="rounded-full border border-border px-3 py-1 text-xs text-foreground"
            >
              {c.nom} ✕
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
