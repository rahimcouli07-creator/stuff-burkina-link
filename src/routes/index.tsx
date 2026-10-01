import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Fragment } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { formatPrix } from "@/lib/market";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "STUFF MARKET — Marketplace" },
      {
        name: "description",
        content: "Achetez, vendez et échangez facilement sur STUFF MARKET.",
      },
      { property: "og:title", content: "Stuff Market - Achète & Vends vite" },
      { property: "og:description", content: "Trouvez de bonnes affaires près de chez vous." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Accueil,
});

type Ad = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  price: number | null;
  location: string | null;
  whatsapp_phone: string | null;
  created_at: string;
  updated_at: string;
  photo_urls: string[] | null;
  business_id: string | null;
  auction_enabled: boolean;
  auction_start_price: number | null;
  auction_end_at: string | null;
  reference: string | null;
  allow_negotiation: boolean;
  status: string | null;
  trade_enabled: boolean;
};

type Boost = {
  ad_id: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
};

type Region = { id: string; name: string };

type Business = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  city: string | null;
  address: string | null;
  whatsapp_phone: string | null;
  photo_urls: string[] | null;
  status: string | null;
};



function parseLocation(location: string | null) {
  const value = location ?? "";
  const countryMatch = value.match(/Pays:\s*([^|]+)/i);
  const regionMatch = value.match(/Région:\s*([^|]+)/i);
  const localMatch = value.match(/Localisation:\s*(.*)$/i);
  return {
    country: countryMatch?.[1]?.trim() || "Burkina Faso",
    region: regionMatch?.[1]?.trim() ?? "",
    local: localMatch?.[1]?.trim() ?? value,
  };
}

function SingleOpeningAd({
  settings,
  visible,
  seconds,
  onFinish,
}: {
  settings: Record<string, unknown> | null;
  visible: boolean;
  seconds: number;
  onFinish: () => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!visible || !settings || typeof document === "undefined") return;

    const candidates = [
      ["adsterra_native", String(settings.adsterra_native_code ?? "").trim()],
      ["monetag_vignette", String(settings.monetag_vignette_code ?? "").trim()],
      ["adsterra_popunder", String(settings.adsterra_popunder_code ?? "").trim()],
    ] as const;
    const selected = candidates.find(([, value]) => Boolean(value));
    const format = selected?.[0] ?? "unknown";
    const code = selected?.[1] ?? "";

    if (!code) return;

    void (supabase as any).rpc("record_ad_impression", {
      p_format: format,
      p_placement: "opening",
    });

    const host = hostRef.current;
    if (!host) return;

    host.innerHTML = "";

    const parsed = document.createElement("div");
    parsed.innerHTML = code;

    Array.from(parsed.childNodes).forEach((node) => {
      if (node.nodeName.toLowerCase() === "script") {
        const oldScript = node as HTMLScriptElement;
        const script = document.createElement("script");
        Array.from(oldScript.attributes).forEach((attr) =>
          script.setAttribute(attr.name, attr.value),
        );
        script.textContent = oldScript.textContent;
        script.setAttribute("data-stuff-opening-ad", "true");
        host.appendChild(script);
      } else {
        host.appendChild(node.cloneNode(true));
      }
    });

    return () => {
      host.innerHTML = "";
    };
  }, [visible, settings]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Publicité
          </span>
          <span className="rounded-full bg-muted px-2 py-1 text-xs font-bold">
            {seconds}s
          </span>
        </div>

        <div
          ref={hostRef}
          className="flex min-h-[250px] items-center justify-center overflow-hidden p-3"
        />

        <div className="border-t border-border px-4 py-3 text-center text-[11px] text-muted-foreground">
          La publicité se termine automatiquement.
        </div>
      </div>
    </div>
  );
}

function NativeAdSlot({ code }: { code: string }) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !code) return;

    void (supabase as any).rpc("record_ad_impression", {
      p_format: "adsterra_native",
      p_placement: "home_after_10_ads",
    });

    host.innerHTML = "";
    const parsed = document.createElement("div");
    parsed.innerHTML = code;

    Array.from(parsed.childNodes).forEach((node) => {
      if (node.nodeName.toLowerCase() === "script") {
        const oldScript = node as HTMLScriptElement;
        const script = document.createElement("script");
        Array.from(oldScript.attributes).forEach((attr) => script.setAttribute(attr.name, attr.value));
        script.textContent = oldScript.textContent;
        host.appendChild(script);
      } else {
        host.appendChild(node.cloneNode(true));
      }
    });
  }, [code]);

  return <div ref={hostRef} className="col-span-2 min-h-[90px] overflow-hidden rounded-2xl border border-border bg-card p-2" />;
}

function Accueil() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [openingAdVisible, setOpeningAdVisible] = useState(true);
  const [openingAdSeconds, setOpeningAdSeconds] = useState(5);
  const [productOpenCount, setProductOpenCount] = useState(() => {
    if (typeof window === "undefined") return 0;
    const raw = Number(window.localStorage.getItem("stuff_product_open_count") ?? "0");
    return Number.isFinite(raw) ? raw : 0;
  });
  const [productAdVisible, setProductAdVisible] = useState(false);
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);
  const [productAdSeconds, setProductAdSeconds] = useState(5);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("stuffmarket-country");
    if (saved) setCountry(saved);
    const onCountryChange = (event: Event) => {
      const value = (event as CustomEvent<string>).detail;
      if (value) {
        setCountry(value);
        setRegionId("");
      }
    };
    window.addEventListener("stuffmarket-country-changed", onCountryChange);
    return () => window.removeEventListener("stuffmarket-country-changed", onCountryChange);
  }, []);

  const [country, setCountry] = useState("Burkina Faso");
  const [regionId, setRegionId] = useState("");
  const [recherche, setRecherche] = useState("");
  const [trocSeulement, setTrocSeulement] = useState(false);
  const [showBusinesses, setShowBusinesses] = useState(false);

  useEffect(() => {
    if (!openingAdVisible) return;

    const timer = window.setInterval(() => {
      setOpeningAdSeconds((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          setOpeningAdVisible(false);
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [openingAdVisible]);

  useEffect(() => {
    if (!productAdVisible) return;

    const timer = window.setInterval(() => {
      setProductAdSeconds((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          setProductAdVisible(false);

          if (pendingProductId) {
            navigate({ to: "/annonce/$id", params: { id: pendingProductId } });
          }

          setPendingProductId(null);
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [productAdVisible, pendingProductId, navigate]);

  function ouvrirProduit(id: string) {
    const nextCount = productOpenCount + 1;
    setProductOpenCount(nextCount);
    window.localStorage.setItem("stuff_product_open_count", String(nextCount));

    if (nextCount % 5 === 0) {
      setPendingProductId(id);
      setProductAdSeconds(5);
      setProductAdVisible(true);
      return;
    }

    navigate({ to: "/annonce/$id", params: { id } });
  }

  const regions = useQuery({
    queryKey: ["regions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("regions").select("id,name").order("name");
      if (error) throw error;
      return (data ?? []) as Region[];
    },
  });

  const adSettings = useQuery({
    queryKey: ["ad-settings-public"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("ad_settings")
        .select("monetag_onclick_enabled,monetag_onclick_code,monetag_inpage_enabled,monetag_inpage_code,monetag_push_enabled,monetag_push_code,monetag_vignette_enabled,monetag_vignette_code,adsterra_popunder_enabled,adsterra_popunder_code,adsterra_native_enabled,adsterra_native_code,adsterra_socialbar_enabled,adsterra_socialbar_code")
        .eq("id", "main")
        .maybeSingle();
      if (error) return null;
      return (data ?? null) as Record<string, unknown> | null;
    },
    staleTime: 60_000,
  });

  const businesses = useQuery({
    queryKey: ["businesses-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id,name,description,category,city,address,whatsapp_phone,photo_urls,status")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Business[];
    },
    enabled: showBusinesses,
  });

  const annonces = useQuery({
    queryKey: ["ads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("status", "available")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Ad[];
    },
  });

  const boosts = useQuery({
    queryKey: ["active-ad-boosts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_boosts")
        .select("ad_id,status,starts_at,ends_at")
        .eq("status", "active");
      if (error) return [] as Boost[];

      const maintenant = Date.now();
      return ((data ?? []) as Boost[]).filter(
        (boost) => !boost.ends_at || new Date(boost.ends_at).getTime() > maintenant,
      );
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("ads-accueil")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ads" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["ads"] });
          queryClient.invalidateQueries({ queryKey: ["active-ad-boosts"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const selectedRegionName = regions.data?.find((region) => region.id === regionId)?.name ?? "";

  const boostedIds = useMemo(
    () => new Set((boosts.data ?? []).map((boost) => boost.ad_id)),
    [boosts.data],
  );

  const liste = useMemo(() => {
    const q = recherche.trim().toLowerCase();

    return (annonces.data ?? [])
      .filter((ad) => {
        const parsed = parseLocation(ad.location);

        if (country && parsed.country !== country) return false;
        if (selectedRegionName && parsed.region !== selectedRegionName) return false;
        if (trocSeulement && !ad.trade_enabled) return false;

        if (
          q &&
          !`${ad.title} ${ad.description ?? ""} ${ad.category ?? ""} ${ad.location ?? ""}`
            .toLowerCase()
            .includes(q)
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const aBoost = boostedIds.has(a.id);
        const bBoost = boostedIds.has(b.id);
        if (aBoost && !bBoost) return -1;
        if (!aBoost && bBoost) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [annonces.data, country, selectedRegionName, recherche, trocSeulement, boostedIds]);

  function resetFiltres() {
    setRegionId("");
    setRecherche("");
    setTrocSeulement(false);
  }

  return (
    <AppLayout>
      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-[2rem] bg-primary p-5 text-primary-foreground shadow-lg sm:p-7">
          <div className="relative z-10 max-w-[78%] sm:max-w-[62%]">
            <div className="mb-2 inline-flex rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]">
              Marketplace
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Trouvez les meilleures affaires près de chez vous !
            </h1>
            <p className="mt-2 text-sm leading-6 text-primary-foreground/85">
              Achetez, vendez et échangez simplement sur STUFF MARKET.
            </p>
            <Link
              to="/publier"
              className="mt-4 inline-flex items-center rounded-full bg-white px-4 py-2.5 text-sm font-black text-primary shadow-sm transition hover:-translate-y-0.5"
            >
              Commencer à vendre →
            </Link>
          </div>
          <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 right-8 h-40 w-40 rounded-full border-[22px] border-white/10" />
        </section>

        <section className="rounded-[1.6rem] border border-border bg-card p-3 shadow-sm sm:p-4">
          <div className="relative">
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un article, une boutique..."
              className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="rounded-2xl border border-border bg-background px-3 py-2">
              <span className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground">Pays</span>
              <span className="mt-1 block truncate text-sm font-bold text-foreground">{country}</span>
            </label>
            <select
              value={regionId}
              onChange={(e) => setRegionId(e.target.value)}
              className="rounded-2xl border border-input bg-background px-3 py-2 text-sm font-semibold outline-none focus:border-primary"
            >
              <option value="">Toutes les régions</option>
              {country === "Burkina Faso" && (regions.data ?? []).map((region) => (
                <option key={region.id} value={region.id}>{region.name}</option>
              ))}
            </select>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => setTrocSeulement(false)} className={`rounded-full px-4 py-2 text-xs font-black ${!trocSeulement ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>Tous</button>
            <button type="button" onClick={() => setTrocSeulement(true)} className={`rounded-full px-4 py-2 text-xs font-black ${trocSeulement ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>Troc</button>
            {(country !== "Burkina Faso" || regionId || recherche || trocSeulement) && (
              <button type="button" onClick={resetFiltres} className="ml-auto rounded-full border border-border px-4 py-2 text-xs font-bold text-muted-foreground">
                Réinitialiser
              </button>
            )}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">⌁</span>
                <h2 className="text-lg font-black text-foreground">Annonces récentes</h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Des produits disponibles maintenant</p>
            </div>
            <span className="text-xs font-bold text-primary">Voir tout ›</span>
          </div>
        </section>

        <section className="rounded-[1.6rem] border border-border bg-card p-3 shadow-sm">
          <button
            type="button"
            onClick={() => setShowBusinesses((value) => !value)}
            className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground"
          >
            {showBusinesses ? "Masquer les boutiques / entreprises" : "Découvrir les boutiques / entreprises"}
          </button>

          {showBusinesses && (
            <div className="mt-4 space-y-3">
              {businesses.isLoading && <p className="text-sm text-muted-foreground">Chargement des boutiques...</p>}
              {businesses.isError && <p className="text-sm text-destructive">Impossible de charger les boutiques.</p>}
              {!businesses.isLoading && !businesses.isError && businesses.data?.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucune boutique ou entreprise disponible pour le moment.</p>
              )}
              {(businesses.data ?? []).map((business) => {
                const phone = business.whatsapp_phone?.replace(/\D/g, "");
                const message = encodeURIComponent(`Bonjour, je souhaite avoir des informations sur ${business.name} sur Stuff Market.`);
                return (
                  <article key={business.id} className="overflow-hidden rounded-2xl border border-border bg-background">
                    {business.photo_urls?.[0] ? <img src={business.photo_urls[0]} alt={business.name} className="h-44 w-full object-cover" loading="lazy" /> : null}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-black">{business.name}</h3>
                        {business.category && <span className="rounded-full bg-muted px-2 py-1 text-xs">{business.category}</span>}
                      </div>
                      {business.description && <p className="mt-2 text-sm text-muted-foreground">{business.description}</p>}
                      {business.city && <p className="mt-2 text-sm text-muted-foreground">📍 {business.city}</p>}
                      {phone && <a href={`https://wa.me/${phone}?text=${message}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Contacter sur WhatsApp</a>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {annonces.isLoading ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">Chargement des annonces...</p>
        ) : annonces.isError ? (
          <div className="mt-6 rounded-2xl border border-destructive/20 bg-card p-4 text-center">
            <p className="text-sm text-destructive">Impossible de charger les annonces pour le moment.</p>
            <button type="button" onClick={() => annonces.refetch()} className="mt-3 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">Réessayer</button>
          </div>
        ) : liste.length === 0 ? (
          <div className="mt-10 text-center">
            <p className="text-sm text-muted-foreground">Aucune annonce pour ces filtres.</p>
            {(regionId || recherche || trocSeulement) && <button type="button" onClick={resetFiltres} className="mt-3 rounded-xl border border-border px-4 py-2 text-xs">Voir toutes les annonces</button>}
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-sm font-black text-foreground">{liste.length} {liste.length > 1 ? "annonces" : "annonce"}</p>
              {!boosts.isLoading && <p className="text-[11px] text-muted-foreground">À la une en premier</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {liste.map((ad, index) => {
                const imageUrl = ad.photo_urls?.[0] ?? null;
                const isBoosted = boostedIds.has(ad.id);
                const parsed = parseLocation(ad.location);
                return (
                  <Fragment key={ad.id}>
                    <Link
                      to="/annonce/$id"
                      params={{ id: ad.id }}
                      onClick={(event) => { event.preventDefault(); ouvrirProduit(ad.id); }}
                      className="group overflow-hidden rounded-[1.35rem] border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <div className="relative aspect-square overflow-hidden bg-muted">
                        {imageUrl ? <img src={imageUrl} alt={ad.title} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Pas de photo</div>}
                        {isBoosted && <div className="absolute left-2 top-2 rounded-full bg-primary px-2.5 py-1 text-[10px] font-black text-primary-foreground shadow">À LA UNE</div>}
                        {ad.trade_enabled && <div className="absolute left-2 bottom-2 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-black text-primary shadow">Troc possible</div>}
                        <div className="absolute right-2 top-2 rounded-full bg-white/95 px-2 py-1 text-xs text-primary shadow">♡</div>
                        <div className="absolute bottom-2 right-2 max-w-[82%] truncate rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-black text-foreground shadow">{parsed.country}</div>
                      </div>
                      <div className="p-3">
                        <p className="line-clamp-1 text-sm font-black text-foreground">{ad.title}</p>
                        {ad.price != null ? <p className="mt-1 text-base font-black text-primary">{formatPrix(Number(ad.price))}</p> : <p className="mt-1 text-xs font-semibold text-muted-foreground">Prix à discuter</p>}
                        <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">📍 {parsed.region || parsed.local || "Localisation non renseignée"}</p>
                        <div className="mt-2 flex gap-1.5">
                          <span className="rounded-full border border-primary/25 bg-primary/5 px-2 py-1 text-[10px] font-black text-primary">WhatsApp</span>
                          {ad.allow_negotiation && <span className="truncate rounded-full bg-muted px-2 py-1 text-[10px] font-bold text-muted-foreground">Négociable</span>}
                        </div>
                      </div>
                    </Link>
                    {adSettings.data?.adsterra_native_enabled && typeof adSettings.data.adsterra_native_code === "string" && adSettings.data.adsterra_native_code && (index + 1) % 10 === 0 && <NativeAdSlot code={adSettings.data.adsterra_native_code} />}
                  </Fragment>
                );
              })}
            </div>
          </>
        )}
      </div>

      <SingleOpeningAd
        settings={adSettings.data}
        visible={openingAdVisible}
        seconds={openingAdSeconds}
        onFinish={() => setOpeningAdVisible(false)}
      />

      <SingleOpeningAd
        settings={adSettings.data}
        visible={productAdVisible}
        seconds={productAdSeconds}
        onFinish={() => {
          setProductAdVisible(false);
          if (pendingProductId) {
            navigate({ to: "/annonce/$id", params: { id: pendingProductId } });
          }
          setPendingProductId(null);
        }}
      />
    </AppLayout>
  );
}
