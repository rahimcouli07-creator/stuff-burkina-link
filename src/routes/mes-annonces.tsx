import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { formatPrix, normalizePhone, type Annonce } from "@/lib/market";

export const Route = createFileRoute("/mes-annonces")({
  head: () => ({
    meta: [
      { title: "Mes annonces | Stuff Market" },
      {
        name: "description",
        content: "Retrouvez et gérez vos annonces grâce à votre numéro WhatsApp.",
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
  const [numero, setNumero] = useState("");
  const [annonces, setAnnonces] = useState<Annonce[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function chercher(e: React.FormEvent) {
    e.preventDefault();
    const phone = "226" + normalizePhone(numero).replace(/^226/, "");
    setLoading(true);
    const { data, error } = await supabase
      .from("annonces")
      .select("*")
      .eq("whatsapp", phone)
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setAnnonces((data ?? []) as Annonce[]);
  }

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
      <form onSubmit={chercher} className="mt-4 flex items-center gap-2">
        <span className="rounded-xl border border-input bg-muted px-3 py-2 text-sm font-semibold">
          +226
        </span>
        <input
          value={numero}
          onChange={(e) => setNumero(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          placeholder="70000000"
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
        >
          Voir
        </button>
      </form>

      {loading ? <p className="mt-6 text-sm text-muted-foreground">Recherche...</p> : null}

      {annonces && annonces.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Aucune annonce pour ce numéro.</p>
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
