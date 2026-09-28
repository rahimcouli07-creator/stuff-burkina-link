import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { formatPrix } from "@/lib/market";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stuff Market - Achète & Vends vite au Burkina" },
      {
        name: "description",
        content: "Achetez et vendez d'occasion au Burkina Faso. Contact direct par WhatsApp.",
      },
      { property: "og:title", content: "Stuff Market - Achète & Vends vite" },
      { property: "og:description", content: "Trouvez de bonnes affaires au Burkina Faso." },
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
type Province = { id: string; name: string; region_id: string };

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

function parseLocation(location: string | null) {
  const value = location ?? "";
  const regionMatch = value.match(/Région:\s*([^|]+)/i);
  const provinceMatch = value.match(/Province:\s*([^|]+)/i);
  const localMatch = value.match(/Localisation:\s*(.*)$/i);
  return {
    region: regionMatch?.[1]?.trim() ?? "",
    province: provinceMatch?.[1]?.trim() ?? "",
    local: localMatch?.[1]?.trim() ?? value,
  };
}

function NativeAdSlot({ code }: { code: string }) {
  const [html, setHtml] = useState("");
  useEffect(() => {
    if (!code) return;
    const root = document.createElement("div");
    root.innerHTML = code;
    const scripts = Array.from(root.querySelectorAll("script"));
    scripts.forEach((oldScript) => {
      const script = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) => script.setAttribute(attr.name, attr.value));
      script.textContent = oldScript.textContent;
      oldScript.replaceWith(script);
    });
    setHtml(root.innerHTML);
  }, [code]);

  useEffect(() => {
    if (!html) return;
    const host = document.querySelector("[data-stuff-native-ad]");
    if (!host) return;
    host.innerHTML = html;
    const scripts = Array.from(host.querySelectorAll("script"));
    scripts.forEach((oldScript) => {
      const script = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) => script.setAttribute(attr.name, attr.value));
      script.textContent = oldScript.textContent;
      oldScript.replaceWith(script);
    });
  }, [html]);

  return <div data-stuff-native-ad className="col-span-2 overflow-hidden rounded-2xl border border-border bg-card p-2" />;
}

function Accueil() {
  const queryClient = useQueryClient();

  const [categorie, setCategorie] = useState("");
  const [regionId, setRegionId] = useState("");
  const [provinceId, setProvinceId] = useState("");
  const [recherche, setRecherche] = useState("");
  const [trocSeulement, setTrocSeulement] = useState(false);
  const [showBusinesses, setShowBusinesses] = useState(false);

  const regions = useQuery({
    queryKey: ["regions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("regions").select("id,name").order("name");
      if (error) throw error;
      return (data ?? []) as Region[];
    },
  });

  const provinces = useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const { data, error } = await supabase.from("provinces").select("id,name,region_id").order("name");
      if (error) throw error;
      return (data ?? []) as Province[];
    },
  });

  const nativeAd = useQuery({
    queryKey: ["ad-settings-native"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("ad_settings")
        .select("adsterra_native_enabled,adsterra_native_code")
        .eq("id", "main")
        .maybeSingle();
      return data as { adsterra_native_enabled?: boolean; adsterra_native_code?: string } | null;
    },
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

  const filteredProvinces = useMemo(
    () => (provinces.data ?? []).filter((province) => province.region_id === regionId),
    [provinces.data, regionId],
  );

  const selectedRegionName = regions.data?.find((region) => region.id === regionId)?.name ?? "";
  const selectedProvinceName = filteredProvinces.find((province) => province.id === provinceId)?.name ?? "";

  const boostedIds = useMemo(
    () => new Set((boosts.data ?? []).map((boost) => boost.ad_id)),
    [boosts.data],
  );

  const liste = useMemo(() => {
    const q = recherche.trim().toLowerCase();

    return (annonces.data ?? [])
      .filter((ad) => {
        const parsed = parseLocation(ad.location);

        if (categorie && ad.category !== categorie) return false;
        if (selectedRegionName && parsed.region !== selectedRegionName) return false;
        if (selectedProvinceName && parsed.province !== selectedProvinceName) return false;
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
  }, [annonces.data, categorie, selectedRegionName, selectedProvinceName, recherche, trocSeulement, boostedIds]);

  function resetFiltres() {
    setCategorie("");
    setRegionId("");
    setProvinceId("");
    setRecherche("");
    setTrocSeulement(false);
  }

  return (
    <AppLayout>
      <div className="space-y-3 rounded-2xl border border-border bg-card p-3">
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un article..."
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <select value={categorie} onChange={(e) => setCategorie(e.target.value)} className="rounded-xl border border-input bg-background px-2 py-2 text-xs">
            <option value="">Toutes les catégories</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>

          <select
            value={regionId}
            onChange={(e) => { setRegionId(e.target.value); setProvinceId(""); }}
            className="rounded-xl border border-input bg-background px-2 py-2 text-xs"
          >
            <option value="">Toutes les régions</option>
            {(regions.data ?? []).map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}
          </select>

          <select
            value={provinceId}
            onChange={(e) => setProvinceId(e.target.value)}
            disabled={!regionId}
            className="rounded-xl border border-input bg-background px-2 py-2 text-xs disabled:opacity-50"
          >
            <option value="">{regionId ? "Toutes les provinces" : "Choisir d'abord une région"}</option>
            {filteredProvinces.map((province) => <option key={province.id} value={province.id}>{province.name}</option>)}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setTrocSeulement((value) => !value)}
            className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${trocSeulement ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground"}`}
          >
            {trocSeulement ? "Troc activé" : "Afficher les produits à troquer"}
          </button>

          {(categorie || regionId || provinceId || recherche || trocSeulement) && (
            <button type="button" onClick={resetFiltres} className="rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground">
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      <section className="mt-4 rounded-2xl border border-border bg-card p-4">
        <button
          type="button"
          onClick={() => setShowBusinesses((value) => !value)}
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
        >
          {showBusinesses ? "Masquer les boutiques / entreprises" : "Afficher les boutiques / entreprises"}
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
                  {business.photo_urls?.[0] ? (
                    <img src={business.photo_urls[0]} alt={business.name} className="h-44 w-full object-cover" loading="lazy" />
                  ) : null}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-bold">{business.name}</h2>
                      {business.category && <span className="rounded-full bg-muted px-2 py-1 text-xs">{business.category}</span>}
                    </div>
                    {business.description && <p className="mt-2 text-sm text-muted-foreground">{business.description}</p>}
                    {business.city && <p className="mt-2 text-sm text-muted-foreground">📍 {business.city}</p>}
                    {business.address && <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">{business.address}</p>}
                    {phone && (
                      <a href={`https://wa.me/${phone}?text=${message}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-xl bg-accent px-4 py-2 text-sm font-bold text-accent-foreground">
                        Contacter sur WhatsApp
                      </a>
                    )}
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
          <button type="button" onClick={() => annonces.refetch()} className="mt-3 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">
            Réessayer
          </button>
        </div>
      ) : liste.length === 0 ? (
        <div className="mt-10 text-center">
          <p className="text-sm text-muted-foreground">Aucune annonce pour ces filtres.</p>
          {(categorie || regionId || provinceId || recherche || trocSeulement) && (
            <button type="button" onClick={resetFiltres} className="mt-3 rounded-xl border border-border px-4 py-2 text-xs">
              Voir toutes les annonces
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">{liste.length} {liste.length > 1 ? "annonces" : "annonce"}</p>
            {!boosts.isLoading && <p className="text-xs text-muted-foreground">Les annonces sponsorisées apparaissent en premier</p>}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            {liste.map((ad, index) => {
              const imageUrl = ad.photo_urls?.[0] ?? null;
              const isBoosted = boostedIds.has(ad.id);
              const parsed = parseLocation(ad.location);

              return (
                <Fragment key={ad.id}>
                <Link
                  to="/annonce/$id"
                  params={{ id: ad.id }}
                  className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative aspect-square bg-muted">
                    {imageUrl ? <img src={imageUrl} alt={ad.title} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Pas de photo</div>}
                    {isBoosted && <div className="absolute left-2 top-2 rounded-full bg-yellow-400 px-2 py-1 text-[10px] font-bold text-black shadow">À LA UNE</div>}
                    {ad.trade_enabled && <div className="absolute right-2 top-2 rounded-full bg-background/90 px-2 py-1 text-[10px] font-semibold text-foreground shadow">TROC</div>}
                  </div>

                  <div className="p-2">
                    <p className="line-clamp-1 text-sm font-semibold text-foreground">{ad.title}</p>
                    {ad.price != null ? <p className="mt-0.5 text-sm font-bold text-primary">{formatPrix(Number(ad.price))}</p> : <p className="mt-0.5 text-xs text-muted-foreground">Prix à discuter</p>}
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{parsed.region && parsed.province ? `${parsed.region} • ${parsed.province}` : parsed.local || "Localisation non renseignée"}</p>
                    {ad.allow_negotiation && <p className="mt-1 text-[10px] font-medium text-primary">Marchandage possible</p>}
                  </div>
                </Link>
                {nativeAd.data?.adsterra_native_enabled && nativeAd.data.adsterra_native_code && (index + 1) % 4 === 0 && (
                  <NativeAdSlot code={nativeAd.data.adsterra_native_code} />
                )}
                </Fragment>
              );
            })}
          </div>
        </>
      )}
    </AppLayout>
  );
}
