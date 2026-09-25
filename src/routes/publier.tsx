import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AppLayout } from "@/components/AppLayout";
import { LoginRequired } from "@/components/LoginRequired";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { normalizePhone, uploadImage } from "@/lib/market";

export const Route = createFileRoute("/publier")({
  head: () => ({
    meta: [
      { title: "Publier une annonce | Stuff Market" },
      {
        name: "description",
        content:
          "Publiez gratuitement votre article au Burkina Faso.",
      },
      {
        property: "og:title",
        content: "Publier une annonce | Stuff Market",
      },
      {
        property: "og:description",
        content: "Vendez vos articles au Burkina Faso.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Publier,
});

function Publier() {
  const navigate = useNavigate();
  const auth = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [categorie, setCategorie] = useState("");
  const [prix, setPrix] = useState("");
  const [location, setLocation] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [allowNegotiation, setAllowNegotiation] = useState(false);
  const [saving, setSaving] = useState(false);

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!auth.user) {
      toast.error("Vous devez être connecté.");
      return;
    }

    if (!titre || !prix || !location || !whatsapp) {
      toast.error(
        "Titre, prix, localisation et WhatsApp sont obligatoires.",
      );
      return;
    }

    setSaving(true);

    try {
      let imageUrl: string | null = null;

      if (file) {
        imageUrl = await uploadImage(file);
      }

      const cleanPhone = normalizePhone(whatsapp);
      const phone = "226" + cleanPhone.replace(/^226/, "");

      const { error } = await supabase.from("ads").insert({
        user_id: auth.user.id,
        title: titre,
        description: description || null,
        category: categorie || null,
        price: Number(prix),
        location,
        whatsapp_phone: phone,
        photo_urls: imageUrl ? [imageUrl] : [],
        business_id: null,
        auction_enabled: false,
        auction_start_price: null,
        auction_end_at: null,
        reference: null,
        allow_negotiation: allowNegotiation,
        status: "active",
      });

      if (error) throw error;

      toast.success("Annonce publiée !");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Erreur lors de la publication.",
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm";

  if (!auth.loading && !auth.user) {
    return (
      <AppLayout>
        <h1 className="text-xl font-extrabold text-foreground">
          Publier une annonce
        </h1>

        <LoginRequired message="Connectez-vous pour publier une annonce." />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <h1 className="text-xl font-extrabold text-foreground">
        Publier une annonce
      </h1>

      <p className="mt-1 text-sm text-muted-foreground">
        Publiez votre article sur Stuff Market.
      </p>

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
          placeholder="Titre de l'annonce"
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

          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <input
          value={prix}
          onChange={(e) =>
            setPrix(e.target.value.replace(/\D/g, ""))
          }
          inputMode="numeric"
          placeholder="Prix en FCFA"
          className={inputClass}
        />

        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Ville / localisation"
          className={inputClass}
        />

        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-input bg-muted px-3 py-2 text-sm font-semibold">
            +226
          </span>

          <input
            value={whatsapp}
            onChange={(e) =>
              setWhatsapp(e.target.value.replace(/\D/g, ""))
            }
            inputMode="numeric"
            placeholder="70000000"
            className={inputClass}
          />
        </div>

        <label className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
          <input
            type="checkbox"
            checked={allowNegotiation}
            onChange={(e) =>
              setAllowNegotiation(e.target.checked)
            }
            className="h-4 w-4"
          />

          <span className="text-sm font-medium">
            Prix négociable
          </span>
        </label>

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