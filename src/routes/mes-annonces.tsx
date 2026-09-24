import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
        content: "Retrouvez et gérez les annonces publiées avec votre compte.",
      },
      { property: "og:title", content: "Mes annonces | Stuff Market" },
      { property: "og:description", content: "Gérez et supprimez vos annonces publiées." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MesAnnonces,
});

function MesAnnonces() {
  const { user, loading: authLoading } = useAuth();
  const [annonces, setAnnonces] = useState<Annonce[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from("annonces")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        setLoading(false);
        if (error) {
          toast.error(error.message);
          return;
        }
        setAnnonces((data ?? []) as Annonce[]);
      });
  }, [user]);

  async function supprimer(id: string) {
    const { error } = await supabase.from("annonces").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setAnnonces((prev) => (prev ? prev.filter((a) => a.id !== id) : prev));
    toast.success("Annonce supprimée");
  }

  return (
    <AppLayout>
      <h1 className="text-xl font-extrabold text-foreground">Mes annonces</h1>

      {!authLoading && !user ? (
        <LoginRequired message="Connectez-vous pour voir et gérer vos annonces." />
      ) : null}

      {user ? (
        <button
          onClick={() => supabase.auth.signOut()}
          className="mt-2 text-xs text-muted-foreground underline"
        >
          Se déconnecter ({user.email})
        </button>
      ) : null}

      {loading ? <p className="mt-6 text-sm text-muted-foreground">Chargement...</p> : null}

      {user && annonces && annonces.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Vous n'avez encore aucune annonce.</p>
      ) : null}

      <div className="mt-4 space-y-3">
        {(annonces ?? []).map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
          >
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
              {a.image_url ? (
                <img
                  src={a.image_url}
                  alt={a.titre}
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
                {a.titre}
              </Link>
              <p className="text-sm font-bold text-primary">{formatPrix(a.prix)}</p>
              <p className="text-xs text-muted-foreground">{a.ville}</p>
            </div>
            <button
              onClick={() => supprimer(a.id)}
              className="rounded-xl border border-destructive px-3 py-2 text-xs font-bold text-destructive"
            >
              Supprimer
            </button>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
