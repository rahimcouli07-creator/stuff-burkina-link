import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { AppLayout } from "@/components/AppLayout";
import { LoginRequired } from "@/components/LoginRequired";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatPrix, type Annonce } from "@/lib/market";

export const Route = createFileRoute("/mes-annonces")({
  head: () => ({
    meta: [
      { title: "Mes annonces | Stuff Market" },
      {
        name: "description",
        content: "Retrouvez et gérez vos annonces et boutiques.",
      },
      { property: "og:title", content: "Mes annonces | Stuff Market" },
      {
        property: "og:description",
        content: "Gérez vos annonces et vos boutiques publiées.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MesAnnonces,
});

type Boutique = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string | null;
  city: string | null;
  address: string | null;
  whatsapp_phone: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  photo_urls: string[] | null;
  status: string | null;
};

function MesAnnonces() {
  const { user, loading: authLoading } = useAuth();

  const [annonces, setAnnonces] = useState<Annonce[] | null>(null);
  const [boutiques, setBoutiques] = useState<Boutique[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingBoutique, setEditingBoutique] = useState<Boutique | null>(null);
  const [savingBoutique, setSavingBoutique] = useState(false);

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    Promise.all([
      supabase
        .from("ads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("businesses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]).then(([adsResult, businessesResult]) => {
      setLoading(false);

      if (adsResult.error) {
        toast.error(adsResult.error.message);
      } else {
        setAnnonces((adsResult.data ?? []) as Annonce[]);
      }

      if (businessesResult.error) {
        toast.error(`Boutiques : ${businessesResult.error.message}`);
      } else {
        setBoutiques((businessesResult.data ?? []) as Boutique[]);
      }
    });
  }, [user]);

  async function supprimer(id: string) {
    if (!window.confirm("Supprimer définitivement cette annonce ?")) return;

    const { error } = await supabase
      .from("ads")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    setAnnonces((prev) =>
      prev ? prev.filter((a) => a.id !== id) : prev,
    );

    toast.success("Annonce supprimée");
  }

  async function supprimerBoutique(id: string) {
    if (
      !window.confirm(
        "Supprimer définitivement cette boutique ? Ses produits liés seront également supprimés.",
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("businesses")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    setBoutiques((prev) =>
      prev ? prev.filter((boutique) => boutique.id !== id) : prev,
    );

    toast.success("Boutique supprimée");
  }

  async function modifierBoutique(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingBoutique) return;

    setSavingBoutique(true);

    const formData = new FormData(event.currentTarget);

    const updates = {
      name: String(formData.get("name") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim() || null,
      category: String(formData.get("category") ?? "").trim() || null,
      city: String(formData.get("city") ?? "").trim() || null,
      address: String(formData.get("address") ?? "").trim() || null,
      whatsapp_phone:
        String(formData.get("whatsapp_phone") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      website: String(formData.get("website") ?? "").trim() || null,
    };

    if (!updates.name) {
      toast.error("Le nom de la boutique est obligatoire.");
      setSavingBoutique(false);
      return;
    }

    const { data, error } = await supabase
      .from("businesses")
      .update(updates)
      .eq("id", editingBoutique.id)
      .eq("user_id", user?.id ?? "")
      .select("*")
      .single();

    setSavingBoutique(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setBoutiques((prev) =>
      prev
        ? prev.map((boutique) =>
            boutique.id === editingBoutique.id
              ? (data as Boutique)
              : boutique,
          )
        : prev,
    );

    setEditingBoutique(null);
    toast.success("Boutique modifiée avec succès");
  }

  return (
    <AppLayout>
      <h1 className="text-xl font-extrabold text-foreground">
        Mes annonces
      </h1>

      {!authLoading && !user ? (
        <LoginRequired message="Connectez-vous pour voir et gérer vos annonces et vos boutiques." />
      ) : null}

      {user ? (
        <button
          onClick={() => supabase.auth.signOut()}
          className="mt-2 text-xs text-muted-foreground underline"
        >
          Se déconnecter ({user.email})
        </button>
      ) : null}

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Chargement...
        </p>
      ) : null}

      {user && annonces && annonces.length === 0 && boutiques && boutiques.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Vous n&apos;avez encore aucune annonce ni boutique.
        </p>
      ) : null}

      {user && boutiques && boutiques.length > 0 ? (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-foreground">
                Mes boutiques
              </h2>
              <p className="text-xs text-muted-foreground">
                Modifiez ou supprimez uniquement vos propres boutiques.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {boutiques.map((boutique) => {
              const imageUrl = boutique.photo_urls?.[0] ?? null;

              return (
                <div
                  key={boutique.id}
                  className="rounded-2xl border border-border bg-card p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={boutique.name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-bold text-foreground">
                        {boutique.name}
                      </p>

                      {boutique.category ? (
                        <p className="text-xs text-muted-foreground">
                          {boutique.category}
                        </p>
                      ) : null}

                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {boutique.city ?? "Localisation non renseignée"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingBoutique(boutique)}
                      className="flex-1 rounded-xl border border-primary px-3 py-2 text-xs font-bold text-primary"
                    >
                      Modifier
                    </button>

                    <button
                      type="button"
                      onClick={() => supprimerBoutique(boutique.id)}
                      className="flex-1 rounded-xl border border-destructive px-3 py-2 text-xs font-bold text-destructive"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {user && annonces && annonces.length > 0 ? (
        <section className="mt-6">
          <h2 className="mb-3 text-lg font-extrabold text-foreground">
            Mes produits
          </h2>

          <div className="space-y-3">
            {annonces.map((a) => {
              const imageUrl = a.photo_urls?.[0] ?? null;

              return (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={a.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <Link
                      to="/annonce/$id"
                      params={{ id: a.id }}
                      className="line-clamp-1 text-sm font-semibold text-foreground"
                    >
                      {a.title}
                    </Link>

                    {a.price != null ? (
                      <p className="text-sm font-bold text-primary">
                        {formatPrix(Number(a.price))}
                      </p>
                    ) : null}

                    <p className="text-xs text-muted-foreground">
                      {a.location ?? "Localisation non renseignée"}
                    </p>
                  </div>

                  <button
                    onClick={() => supprimer(a.id)}
                    className="rounded-xl border border-destructive px-3 py-2 text-xs font-bold text-destructive"
                  >
                    Supprimer
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {editingBoutique ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modifier-boutique-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setEditingBoutique(null);
            }
          }}
        >
          <form
            onSubmit={modifierBoutique}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-card p-5 shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="modifier-boutique-title"
                  className="text-lg font-extrabold text-foreground"
                >
                  Modifier ma boutique
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Les photos existantes sont conservées.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditingBoutique(null)}
                className="rounded-full px-3 py-1 text-lg text-muted-foreground"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-foreground">
                  Nom de la boutique
                </span>
                <input
                  name="name"
                  defaultValue={editingBoutique.name}
                  required
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold text-foreground">
                  Catégorie
                </span>
                <input
                  name="category"
                  defaultValue={editingBoutique.category ?? ""}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold text-foreground">
                  Description
                </span>
                <textarea
                  name="description"
                  defaultValue={editingBoutique.description ?? ""}
                  rows={4}
                  className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold text-foreground">
                  Région / Province
                </span>
                <input
                  name="city"
                  defaultValue={editingBoutique.city ?? ""}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold text-foreground">
                  Localisation exacte / adresse
                </span>
                <textarea
                  name="address"
                  defaultValue={editingBoutique.address ?? ""}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold text-foreground">
                  WhatsApp
                </span>
                <input
                  name="whatsapp_phone"
                  defaultValue={editingBoutique.whatsapp_phone ?? ""}
                  inputMode="tel"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold text-foreground">
                  Téléphone
                </span>
                <input
                  name="phone"
                  defaultValue={editingBoutique.phone ?? ""}
                  inputMode="tel"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold text-foreground">
                  Email
                </span>
                <input
                  name="email"
                  type="email"
                  defaultValue={editingBoutique.email ?? ""}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold text-foreground">
                  Site web
                </span>
                <input
                  name="website"
                  type="url"
                  defaultValue={editingBoutique.website ?? ""}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setEditingBoutique(null)}
                className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-bold text-foreground"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={savingBoutique}
                className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
              >
                {savingBoutique ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </AppLayout>
  );
}
