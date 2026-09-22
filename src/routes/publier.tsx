import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchCategories,
  fetchRegions,
  fetchVilles,
  normalizePhone,
  uploadImage,
} from "@/lib/market";

export const Route = createFileRoute("/publier")({
  head: () => ({
    meta: [
      { title: "Publier une annonce | Stuff Market" },
      {
        name: "description",
        content: "Publiez gratuitement votre article d'occasion au Burkina Faso en 1 minute.",
      },
      { property: "og:title", content: "Publier une annonce | Stuff Market" },
      { property: "og:description", content: "Vendez vos articles d'occasion au Burkina Faso." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Publier,
});

function Publier() {
  const navigate = useNavigate();
  const regions = useQuery({ queryKey: ["regions"], queryFn: fetchRegions });
  const villes = useQuery({ queryKey: ["villes"], queryFn: fetchVilles });
  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  const [file, setFile] = useState<File | null>(null);
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [categorie, setCategorie] = useState("");
  const [etat, setEtat] = useState("Occasion");
  const [prix, setPrix] = useState("");
  const [region, setRegion] = useState("");
  const [ville, setVille] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [saving, setSaving] = useState(false);

  const villesFiltrees = useMemo(
    () => (villes.data ?? []).filter((v) => !region || v.region === region),
    [villes.data, region],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titre || !prix || !ville || !whatsapp) {
      toast.error("Titre, prix, ville et WhatsApp sont obligatoires.");
      return;
    }
    setSaving(true);
    try {
      let imageUrl: string | null = null;
      if (file) imageUrl = await uploadImage(file);

      const { error } = await supabase.from("annonces").insert({
        titre,
        description,
        categorie,
        etat,
        prix: Number(prix),
        region,
        ville,
        whatsapp: "226" + normalizePhone(whatsapp).replace(/^226/, ""),
        image_url: imageUrl,
      });
      if (error) throw error;
      toast.success("Annonce publiée !");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la publication");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm";

  return (
    <AppLayout>
      <h1 className="text-xl font-extrabold text-foreground">Publier une annonce</h1>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className={inputClass}
        />
        <input
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          placeholder="Titre"
          className={inputClass}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          rows={4}
          className={inputClass}
        />
        <select
          value={categorie}
          onChange={(e) => setCategorie(e.target.value)}
          className={inputClass}
        >
          <option value="">Catégorie</option>
          {(categories.data ?? []).map((c) => (
            <option key={c.id} value={c.nom}>
              {c.nom}
            </option>
          ))}
        </select>
        <select value={etat} onChange={(e) => setEtat(e.target.value)} className={inputClass}>
          <option value="Neuf">Neuf</option>
          <option value="Occasion">Occasion</option>
        </select>
        <input
          value={prix}
          onChange={(e) => setPrix(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          placeholder="Prix en FCFA"
          className={inputClass}
        />
        <select
          value={region}
          onChange={(e) => {
            setRegion(e.target.value);
            setVille("");
          }}
          className={inputClass}
        >
          <option value="">Région</option>
          {(regions.data ?? []).map((r) => (
            <option key={r.id} value={r.nom}>
              {r.nom}
            </option>
          ))}
        </select>
        <select value={ville} onChange={(e) => setVille(e.target.value)} className={inputClass}>
          <option value="">Ville</option>
          {villesFiltrees.map((v) => (
            <option key={v.id} value={v.nom_ville}>
              {v.nom_ville}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-input bg-muted px-3 py-2 text-sm font-semibold">
            +226
          </span>
          <input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            placeholder="70000000"
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          {saving ? "Publication..." : "Publier mon annonce"}
        </button>
      </form>
    </AppLayout>
  );
}
