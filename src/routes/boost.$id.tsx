import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/boost/$id")({ component: Page });

type AdSettings = { monetag_onclick_enabled?: boolean | null; monetag_onclick_code?: string | null };
const REWARDED_AD_SECONDS = 8;
const REQUIRED_ADS = 3;

function RewardedAd({ code, visible, seconds, onFinish }: { code: string; visible: boolean; seconds: number; onFinish: () => void }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!visible || !code || typeof document === "undefined") return;
    const host = hostRef.current;
    if (!host) return;
    host.innerHTML = "";
    const parsed = document.createElement("div");
    parsed.innerHTML = code;
    Array.from(parsed.childNodes).forEach((node) => {
      if (node.nodeName.toLowerCase() === "script") {
        const oldScript = node as HTMLScriptElement;
        const script = document.createElement("script");
        Array.from(oldScript.attributes).forEach((attribute) => script.setAttribute(attribute.name, attribute.value));
        script.textContent = oldScript.textContent;
        script.setAttribute("data-stuff-rewarded-ad", "true");
        host.appendChild(script);
      } else host.appendChild(node.cloneNode(true));
    });
    return () => { host.innerHTML = ""; };
  }, [visible, code]);
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-3xl bg-background p-5 shadow-2xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Publicité éligible</p>
          <h2 className="mt-2 text-xl font-black">Regardez la publicité</h2>
          <p className="mt-2 text-sm text-muted-foreground">La publicité doit rester affichée avant d’être comptabilisée.</p>
        </div>
        <div ref={hostRef} className="mt-5 min-h-32 overflow-hidden rounded-2xl border bg-muted/20" />
        <div className="mt-4 text-center">
          {seconds > 0 ? <p className="text-sm font-semibold">Publicité en cours… {seconds}s</p> : (
            <button type="button" onClick={onFinish} className="w-full rounded-2xl bg-primary px-4 py-3 font-bold text-primary-foreground">Publicité regardée — continuer</button>
          )}
        </div>
      </div>
    </div>
  );
}

function Page() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const [uid, setUid] = useState<string>();
  const [ad, setAd] = useState<any>();
  const [biz, setBiz] = useState(false);
  const [settings, setSettings] = useState<AdSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [rewardOpen, setRewardOpen] = useState(false);
  const [rewardSeconds, setRewardSeconds] = useState(0);
  const [watchedAds, setWatchedAds] = useState(0);
  const [submittingFreeBoost, setSubmittingFreeBoost] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return setUid(undefined);
      setUid(data.user.id);
      const { data: a } = await (supabase as any).from("ads").select("*").eq("id", id).maybeSingle();
      if (a) { setAd(a); setBiz(false); }
      else {
        const { data: b } = await (supabase as any).from("businesses").select("*").eq("id", id).maybeSingle();
        setAd(b); setBiz(true);
      }
    })();
  }, [id]);

  useEffect(() => {
    (async () => {
      setLoadingSettings(true);
      const { data, error } = await (supabase as any).from("ad_settings").select("monetag_onclick_enabled,monetag_onclick_code").eq("id", "main").maybeSingle();
      setSettings(error ? null : ((data ?? null) as AdSettings | null));
      setLoadingSettings(false);
    })();
  }, []);

  useEffect(() => {
    if (!rewardOpen) return;
    setRewardSeconds(REWARDED_AD_SECONDS);
    const timer = window.setInterval(() => setRewardSeconds((value) => value <= 1 ? 0 : value - 1), 1000);
    return () => window.clearInterval(timer);
  }, [rewardOpen, watchedAds]);

  async function pay(plan: string) {
    if (!uid) return nav({ to: "/auth" });
    const { error } = await (supabase as any).from("boost_requests").insert({ ad_id: biz ? null : id, user_id: uid, plan_id: plan, status: "pending" });
    if (error) toast.error(error.message); else toast.success("Demande envoyée à l’administration.");
  }

  function startFreeBoost() {
    if (!uid) { nav({ to: "/auth" }); return; }
    if (biz) { toast.error("Le boost gratuit de 36 h est réservé aux produits simples."); return; }
    if (watchedAds >= REQUIRED_ADS) return;
    const code = String(settings?.monetag_onclick_code ?? "").trim();
    if (!settings?.monetag_onclick_enabled || !code) {
      toast.error("Aucune publicité éligible n’est actuellement disponible. Le boost gratuit ne peut pas commencer.");
      return;
    }
    setRewardOpen(true);
  }

  async function finishRewardedAd() {
    setRewardOpen(false);
    const nextCount = watchedAds + 1;
    setWatchedAds(nextCount);
    if (nextCount < REQUIRED_ADS) {
      toast.success(`Publicité validée. ${nextCount}/${REQUIRED_ADS} publicités regardées.`);
      return;
    }
    if (!uid || submittingFreeBoost) return;
    setSubmittingFreeBoost(true);
    const { error } = await (supabase as any).from("boost_requests").insert({ ad_id: id, user_id: uid, plan_id: "free_36h", status: "pending" });
    setSubmittingFreeBoost(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Les 3 publicités ont été validées. La demande de boost gratuit de 36 h a été envoyée.");
    nav({ to: `/annonce/${id}` });
  }

  const rewardAvailable = Boolean(settings?.monetag_onclick_enabled) && Boolean(String(settings?.monetag_onclick_code ?? "").trim());

  return (
    <AppLayout>
      <Link to="/" className="text-sm font-bold text-primary">← Accueil</Link>
      <section className="mt-4 rounded-3xl border bg-card p-5">
        <h1 className="text-2xl font-black">Booster cette annonce</h1>
        <p className="mt-2 text-sm text-muted-foreground">{ad?.title || ad?.name || "Publication"}</p>
        {biz ? (
          <div className="mt-5 space-y-3">
            <button type="button" onClick={() => pay("7_days")} className="w-full rounded-2xl border p-4 text-left font-bold">7 jours — 1 500 FCFA</button>
            <button type="button" onClick={() => pay("1_month")} className="w-full rounded-2xl border p-4 text-left font-bold">1 mois — 4 000 FCFA</button>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <button type="button" onClick={startFreeBoost} disabled={loadingSettings || submittingFreeBoost} className="w-full rounded-2xl border p-4 text-left disabled:cursor-not-allowed disabled:opacity-60">
              <b>Boost gratuit — 36 h</b>
              <p className="mt-1 text-xs text-muted-foreground">Regardez 3 publicités éligibles.</p>
              <p className="mt-2 text-xs font-semibold text-primary">{watchedAds}/{REQUIRED_ADS} publicité(s) validée(s)</p>
              {!loadingSettings && !rewardAvailable && <p className="mt-2 text-xs text-destructive">Publicité éligible indisponible actuellement.</p>}
            </button>
            <button type="button" onClick={() => pay("7_days")} className="w-full rounded-2xl border p-4 text-left font-bold">7 jours — 500 FCFA</button>
            <button type="button" onClick={() => pay("1_month")} className="w-full rounded-2xl border p-4 text-left font-bold">1 mois — 1 000 FCFA</button>
          </div>
        )}
      </section>
      <RewardedAd code={String(settings?.monetag_onclick_code ?? "")} visible={rewardOpen} seconds={rewardSeconds} onFinish={finishRewardedAd} />
    </AppLayout>
  );
}
