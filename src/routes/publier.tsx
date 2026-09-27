import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AppLayout } from "@/components/AppLayout";
import { LoginRequired } from "@/components/LoginRequired";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { normalizePhone, uploadImage } from "@/lib/market";

export const Route = createFileRoute("/publier")({
  component: PublierPage,
});

function PublierPage() {
  const { user, loading } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [allowNegotiation, setAllowNegotiation] = useState(true);
  const [tradeEnabled, setTradeEnabled] = useState(false);

  const [photos, setPhotos] = useState<File[]>([]);
  const [publishing, setPublishing] = useState(false);

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 text-center">Chargement...</div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <LoginRequired />
      </AppLayout>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Le titre est obligatoire.");
      return;
    }

    if (!whatsapp.trim()) {
      toast.error("Le numéro WhatsApp est obligatoire.");
      return;
    }

    if (photos.length > 3) {
      toast.error("Vous pouvez ajouter au maximum 3 photos.");
      return;
    }

    try {
      setPublishing(true);

      const phone = normalizePhone(whatsapp);

      if (!phone) {
        toast.error("Numéro WhatsApp invalide.");
        return;
      }

      const photoUrls: string[] = [];

      for (const file of photos) {
        const url = await uploadImage(file, user.id);
        photoUrls.push(url);
      }

      const { error } = await supabase.from("ads").insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        category: category.trim() || null,
        price: price ? Number(price) : null,
        location: location.trim() || null,
        whatsapp_phone: phone,
        photo_urls: photoUrls,
        allow_negotiation: allowNegotiation,
        trade_enabled: tradeEnabled,
        status: "available",
      });

      if (error) {
        console.error(error);
        toast.error("Impossible de publier l'annonce.");
        return;
      }

      toast.success("Annonce publiée avec succès.");

      setTitle("");
      setDescription("");
      setCategory("");
      setPrice("");
      setLocation("");
      setWhatsapp("");
      setAllowNegotiation(true);
      setTradeEnabled(false);
      setPhotos([]);
    } catch (error) {
      console.error(error);
      toast.error("Une erreur est survenue pendant la publication.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="mb-8">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Retour à l'accueil
          </Link>

          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            Publier une annonce
          </h1>

          <p className="mt-2 text-muted-foreground">
            Présentez votre produit aux acheteurs de Stuff Market.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-3xl border bg-card p-6 shadow-sm"
        >
          <div>
            <label className="mb-2 block text-sm font-medium">
              Nom du produit *
            </label>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex. iPhone 13"
              className="w-full rounded-xl border bg-background px-4 py-3 outline-none focus:ring-2"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre produit..."
              rows={5}
              className="w-full rounded-xl border bg-background px-4 py-3 outline-none focus:ring-2"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Catégorie
              </label>

              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex. Téléphones"
                className="w-full rounded-xl border bg-background px-4 py-3 outline-none focus:ring-2"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Prix en FCFA
              </label>

              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Ex. 150000"
                className="w-full rounded-xl border bg-background px-4 py-3 outline-none focus:ring-2"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Localisation
              </label>

              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex. Ouagadougou"
                className="w-full rounded-xl border bg-background px-4 py-3 outline-none focus:ring-2"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                WhatsApp *
              </label>

              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+226..."
                className="w-full rounded-xl border bg-background px-4 py-3 outline-none focus:ring-2"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Photos
            </label>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []).slice(0, 3);
                setPhotos(files);
              }}
              className="w-full rounded-xl border p-3"
            />

            <p className="mt-2 text-xs text-muted-foreground">
              Maximum 3 photos.
            </p>
          </div>

          <div className="space-y-3 rounded-2xl border p-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={allowNegotiation}
                onChange={(e) => setAllowNegotiation(e.target.checked)}
                className="h-5 w-5"
              />

              <span>
                <strong>J'accepte le marchandage</strong>
                <span className="block text-sm text-muted-foreground">
                  Les acheteurs pourront proposer un autre prix.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={tradeEnabled}
                onChange={(e) => setTradeEnabled(e.target.checked)}
                className="h-5 w-5"
              />

              <span>
                <strong>J'accepte le troc</strong>
                <span className="block text-sm text-muted-foreground">
                  Les acheteurs pourront proposer un échange.
                </span>
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={publishing}
            className="w-full rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50"
          >
            {publishing ? "Publication..." : "Publier l'annonce"}
          </button>
        </form>
      </main>
    </AppLayout>
  );
}