import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/boost/$id")({
  component: BoostPage,
});

type Plan = { id: string; name: string; price: number; duration_hours: number };
type Ad = { id: string; title: string; price: number | null; status: string; user_id: string };

const formatPrice = (value: number | null) =>
  value == null ? "Prix à discuter" : `${Number(value).toLocaleString("fr-FR")} FCFA`;

function BoostPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [ad, setAd] = useState<Ad | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: auth }, { data: adData }, { data: planData }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("ads").select("id,title,price,status,user_id").eq("id", id).maybeSingle(),
        supabase.from("boost_plans").select("id,name,price,duration_hours").eq("is_active", true).order("price", { ascending: true }),
      ]);
      setUserId(auth.user?.id ?? null);
      setAd((adData as Ad | null) ?? null);
      setPlans((planData as Plan[]) ?? []);
      setLoading(false);
    })();
  }, [id]);

  async function requestBoost(plan: Plan) {
    if (!userId) {
      toast.error("Connecte-toi pour demander un boost.");
      navigate({ to: "/auth" });
      return;
    }
    if (!ad || ad.user_id !== userId) {
      toast.error("Tu peux uniquement booster ta propre annonce.");
      return;
    }
    setSending(plan.id);
    try {
      const { error } = await (supabase as any).from("boost_requests").insert({
        ad_id: ad.id,
        user_id: userId,
        plan_id: plan.id,
        status: "pending",
      });
      if (error) throw error;
      toast.success("Demande envoyée. Elle sera vérifiée par l'administration.");
      navigate({ to: "/" });
    } catch (error: any) {
      if (error?.code === "23505") toast.error("Une demande de boost est déjà en attente.");
      else toast.error(error?.message || "Impossible d'envoyer la demande.");
    } finally {
      setSending(null);
    }
  }

  if (loading) return <main className="mx-auto max-w-xl p-6">Chargement...</main>;
  if (!ad) return <main className="mx-auto max-w-xl p-6"><p>Annonce introuvable.</p></main>;

  return (
    <main className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-xl space-y-5">
        <Link to="/" className="text-sm font-semibold text-primary">← Retour</Link>
        <section className="rounded-3xl border bg-card p-5 shadow-sm">
          <p className="text-xs font-black tracking-[0.18em] text-primary">STUFF MARKET • BOOST</p>
          <h1 className="mt-2 text-2xl font-extrabold">Booster « {ad.title} »</h1>
          <p className="mt-2 text-sm text-muted-foreground">Prix : {formatPrice(ad.price)}</p>
          <div className="mt-4 rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
            Choisis une formule. La demande sera envoyée à l'administration. Après validation, ton annonce sera mise en avant sur l'accueil.
          </div>
          <div className="mt-5 space-y-3">
            {plans.map((plan) => (
              <button key={plan.id} type="button" disabled={sending !== null} onClick={() => requestBoost(plan)} className="w-full rounded-2xl border p-4 text-left transition hover:border-primary hover:bg-primary/5 disabled:opacity-50">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold">{plan.name}</span>
                  <span className="font-extrabold text-primary">{Number(plan.price).toLocaleString("fr-FR")} FCFA</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Durée : {plan.duration_hours} heures</p>
                {sending === plan.id && <p className="mt-2 text-xs font-semibold text-primary">Envoi de la demande...</p>}
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
