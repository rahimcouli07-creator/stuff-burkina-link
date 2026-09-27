import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type Group = {
  id: string;
  name: string;
  platform: string;
  url: string;
  is_active: boolean;
};

type Visit = {
  visit_date: string;
  visitor_id: string;
};

type AdminProfile = {
  id: string;
  email: string;
  role: string;
  can_manage_ads: boolean;
  can_manage_offers: boolean;
  can_manage_users: boolean;
};

type AdRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  price: number | null;
  location: string | null;
  whatsapp_phone: string | null;
  photo_urls: string[] | null;
  reference: string | null;
  status: "available" | "sold";
  trade_enabled: boolean;
  allow_negotiation: boolean;
  created_at: string;
};

type ServiceRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  price: number | null;
  location: string | null;
  whatsapp_phone: string | null;
  reference: string | null;
  status: "available" | "unavailable";
  allow_negotiation: boolean;
  created_at: string;
};

type Region = { id: string; name: string };
type Province = { id: string; name: string; region_id: string };

type BoostRow = {
  id: string;
  ad_id: string;
  user_id: string;
  plan: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  ad: AdRow | null;
};

const APP_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : "https://stuff-market.vercel.app";

function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [ads, setAds] = useState<AdRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [showSold, setShowSold] = useState(false);
  const [monetag, setMonetag] = useState(false);
  const [adsterra, setAdsterra] = useState(false);
  const [popup, setPopup] = useState(false);
  const [banner, setBanner] = useState(false);
  const [push, setPush] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupPlatform, setGroupPlatform] = useState("whatsapp");
  const [groupUrl, setGroupUrl] = useState("");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [adsCount, setAdsCount] = useState(0);
  const [servicesCount, setServicesCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const [boostedAds, setBoostedAds] = useState<BoostRow[]>([]);
  const [selectedBoost, setSelectedBoost] = useState<BoostRow | null>(null);
  const [subAdmins, setSubAdmins] = useState<AdminProfile[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminId, setNewAdminId] = useState("");
  const [manageAds, setManageAds] = useState(true);
  const [manageOffers, setManageOffers] = useState(true);
  const [manageUsers, setManageUsers] = useState(false);
  const [searchAds, setSearchAds] = useState("");
  const [searchServices, setSearchServices] = useState("");

  const [regions, setRegions] = useState<Region[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [serviceStuffId, setServiceStuffId] = useState("");
  const [serviceTitle, setServiceTitle] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [serviceCategory, setServiceCategory] = useState("Plomberie");
  const [servicePrice, setServicePrice] = useState("");
  const [serviceRegionId, setServiceRegionId] = useState("");
  const [serviceProvinceId, setServiceProvinceId] = useState("");
  const [serviceLocation, setServiceLocation] = useState("");
  const [serviceWhatsapp, setServiceWhatsapp] = useState("");
  const [serviceNegotiation, setServiceNegotiation] = useState(true);
  const [serviceSaving, setServiceSaving] = useState(false);

  const [monetagCode, setMonetagCode] = useState("");
  const [adsterraCode, setAdsterraCode] = useState("");

  const isAdmin = Boolean(admin);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) {
        loadAdmin(data.session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, nextSession) => {
        if (!mounted) return;
        setSession(nextSession);
        if (nextSession) {
          loadAdmin(nextSession.user.id);
        } else {
          setAdmin(null);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function loadLocations() {
    const [regionsResult, provincesResult] = await Promise.all([
      supabase.from("regions").select("id,name").order("name"),
      supabase.from("provinces").select("id,name,region_id").order("name"),
    ]);

    setRegions((regionsResult.data ?? []) as Region[]);
    setProvinces((provincesResult.data ?? []) as Province[]);
  }

  async function loadAdmin(userId: string) {
    setLoading(true);

    const { data, error } = await supabase
      .from("admin_users")
      .select("id,email,role,can_manage_ads,can_manage_offers,can_manage_users")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) {
      setAdmin(null);
      setLoading(false);
      return;
    }

    setAdmin(data);

    await Promise.all([
      loadDashboard(),
      loadAds(),
      loadServices(),
      loadGroups(),
      loadSettings(),
      loadSubAdmins(),
      loadBoostedAds(),
      loadLocations(),
    ]);

    setLoading(false);
  }

  async function loadDashboard() {
    const [adsResult, servicesResult, usersResult, visitsResult] =
      await Promise.all([
        supabase.from("ads").select("id", { count: "exact", head: true }),
        supabase.from("services").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("app_visits").select("visit_date,visitor_id").order("visit_date", { ascending: false }),
      ]);

    setAdsCount(adsResult.count ?? 0);
    setServicesCount(servicesResult.count ?? 0);
    setUsersCount(usersResult.count ?? 0);
    setVisits((visitsResult.data ?? []) as Visit[]);
  }

  async function loadAds() {
    const { data, error } = await supabase
      .from("ads")
      .select("id,user_id,title,description,category,price,location,whatsapp_phone,photo_urls,reference,status,trade_enabled,allow_negotiation,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(`Erreur annonces : ${error.message}`);
      return;
    }
    setAds((data ?? []) as AdRow[]);
  }

  async function loadServices() {
    const { data, error } = await supabase
      .from("services")
      .select("id,user_id,title,description,category,price,location,whatsapp_phone,reference,status,allow_negotiation,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(`Erreur services : ${error.message}`);
      return;
    }
    setServices((data ?? []) as ServiceRow[]);
  }

  async function loadGroups() {
    const { data } = await supabase
      .from("promotion_groups")
      .select("*")
      .order("created_at", { ascending: false });

    setGroups((data ?? []) as Group[]);
  }

  async function loadSettings() {
    const [app, adsSettings] = await Promise.all([
      supabase.from("app_settings").select("*").eq("id", "main").maybeSingle(),
      supabase.from("ad_settings").select("*").eq("id", "main").maybeSingle(),
    ]);

    if (app.data) setShowSold(Boolean(app.data.show_sold_products));

    if (adsSettings.data) {
      setMonetag(Boolean(adsSettings.data.monetag_enabled));
      setAdsterra(Boolean(adsSettings.data.adsterra_enabled));
      setPopup(Boolean(adsSettings.data.show_popup));
      setBanner(Boolean(adsSettings.data.show_banner));
      setPush(Boolean(adsSettings.data.show_push));
      setMonetagCode(String(adsSettings.data.monetag_code ?? ""));
      setAdsterraCode(String(adsSettings.data.adsterra_code ?? ""));
    }
  }

  async function loadSubAdmins() {
    const { data } = await supabase
      .from("admin_users")
      .select("id,email,role,can_manage_ads,can_manage_offers,can_manage_users")
      .order("created_at", { ascending: false });

    setSubAdmins((data ?? []) as AdminProfile[]);
  }

  async function loadBoostedAds() {
    const { data, error } = await supabase
      .from("ad_boosts")
      .select("id,ad_id,user_id,plan,status,starts_at,ends_at,created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error || !data) {
      setBoostedAds([]);
      return;
    }

    const ids = data.map((item) => item.ad_id);
    if (!ids.length) {
      setBoostedAds([]);
      return;
    }

    const { data: adsData } = await supabase
      .from("ads")
      .select("id,user_id,title,description,category,price,location,whatsapp_phone,photo_urls,reference,status,trade_enabled,allow_negotiation,created_at")
      .in("id", ids);

    setBoostedAds(
      data.map((boost) => ({
        ...boost,
        ad: (adsData?.find((ad) => ad.id === boost.ad_id) as AdRow | undefined) ?? null,
      })) as BoostRow[],
    );
  }

  async function login() {
    if (!email.trim() || !password) {
      toast.error("Remplis l'email et le mot de passe.");
      return;
    }

    try {
      setLoginLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.session) {
        setSession(data.session);
        await loadAdmin(data.session.user.id);
      }
    } finally {
      setLoginLoading(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setAdmin(null);
  }

  async function addGroup() {
    if (!groupName.trim() || !groupUrl.trim()) {
      toast.error("Nom et lien obligatoires.");
      return;
    }

    const { error } = await supabase.from("promotion_groups").insert({
      name: groupName.trim(),
      platform: groupPlatform,
      url: groupUrl.trim(),
      is_active: true,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    setGroupName("");
    setGroupUrl("");
    await loadGroups();
    toast.success("Groupe ajouté.");
  }

  async function toggleGroup(group: Group) {
    const { error } = await supabase
      .from("promotion_groups")
      .update({ is_active: !group.is_active })
      .eq("id", group.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    await loadGroups();
  }

  async function deleteGroup(id: string) {
    if (!confirm("Supprimer ce groupe ?")) return;

    const { error } = await supabase
      .from("promotion_groups")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    await loadGroups();
    toast.success("Groupe supprimé.");
  }

  async function saveAppSettings(value: boolean) {
    const { error } = await supabase
      .from("app_settings")
      .update({ show_sold_products: value })
      .eq("id", "main");

    if (error) {
      toast.error(error.message);
      return;
    }

    setShowSold(value);
    toast.success("Réglage enregistré.");
  }

  async function saveAdSettings(
    field: "monetag_enabled" | "adsterra_enabled" | "show_popup" | "show_banner" | "show_push",
    value: boolean,
  ) {
    const { error } = await supabase
      .from("ad_settings")
      .update({ [field]: value })
      .eq("id", "main");

    if (error) {
      toast.error(error.message);
      return;
    }

    if (field === "monetag_enabled") setMonetag(value);
    if (field === "adsterra_enabled") setAdsterra(value);
    if (field === "show_popup") setPopup(value);
    if (field === "show_banner") setBanner(value);
    if (field === "show_push") setPush(value);

    toast.success("Réglage enregistré.");
  }

  async function saveAdCode(field: "monetag_code" | "adsterra_code", value: string) {
    const { error } = await supabase
      .from("ad_settings")
      .update({ [field]: value.trim() || null })
      .eq("id", "main");

    if (error) {
      toast.error(error.message);
      return;
    }

    if (field === "monetag_code") setMonetagCode(value);
    if (field === "adsterra_code") setAdsterraCode(value);
    toast.success("Information publicitaire enregistrée.");
  }

  async function addSubAdmin() {
    if (!newAdminEmail.trim() || !newAdminId.trim()) {
      toast.error("Email et identifiant utilisateur obligatoires.");
      return;
    }

    const { error } = await supabase.from("admin_users").insert({
      id: newAdminId.trim(),
      email: newAdminEmail.trim(),
      role: "admin",
      can_manage_ads: manageAds,
      can_manage_offers: manageOffers,
      can_manage_users: manageUsers,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    setNewAdminEmail("");
    setNewAdminId("");
    await loadSubAdmins();
    toast.success("Sous-administrateur ajouté.");
  }

  async function deleteSubAdmin(id: string) {
    if (id === admin?.id) {
      toast.error("Vous ne pouvez pas supprimer votre propre compte.");
      return;
    }

    if (!confirm("Supprimer ce sous-administrateur ?")) return;

    const { error } = await supabase
      .from("admin_users")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    await loadSubAdmins();
    toast.success("Sous-administrateur supprimé.");
  }

  async function updateSubAdminPermission(
    id: string,
    field: "can_manage_ads" | "can_manage_offers" | "can_manage_users",
    value: boolean,
  ) {
    const { error } = await supabase
      .from("admin_users")
      .update({ [field]: value })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    setSubAdmins((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
    toast.success("Permission mise à jour.");
  }

  async function markAdAsSold(id: string) {
    const { error } = await supabase
      .from("ads")
      .update({ status: "sold" })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    setAds((prev) =>
      prev.map((ad) => (ad.id === id ? { ...ad, status: "sold" } : ad)),
    );
    toast.success("Produit marqué comme vendu.");
  }

  async function restoreAd(id: string) {
    const { error } = await supabase
      .from("ads")
      .update({ status: "available" })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    setAds((prev) =>
      prev.map((ad) =>
        ad.id === id ? { ...ad, status: "available" } : ad,
      ),
    );
    toast.success("Produit remis en vente.");
  }

  async function deleteAd(id: string) {
    if (!confirm("Supprimer définitivement cette annonce ?")) return;

    const { error } = await supabase.from("ads").delete().eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    setAds((prev) => prev.filter((ad) => ad.id !== id));
    toast.success("Annonce supprimée.");
  }

  async function createServiceForProfessional() {
    const regionName = regions.find((region) => region.id === serviceRegionId)?.name ?? "";
    const provinceName = provinces.find((province) => province.id === serviceProvinceId)?.name ?? "";

    if (!serviceStuffId.trim() || !serviceTitle.trim() || !serviceDescription.trim() || !serviceRegionId || !serviceProvinceId || !serviceLocation.trim() || !serviceWhatsapp.trim()) {
      toast.error("Renseigne notamment l'identifiant Stuff Market du professionnel.");
      return;
    }

    setServiceSaving(true);

    try {
      const { data: professional, error: professionalError } = await supabase
        .from("profiles")
        .select("id,stuff_id")
        .eq("stuff_id", serviceStuffId.trim().toUpperCase())
        .maybeSingle();

      if (professionalError) throw professionalError;
      if (!professional?.id) {
        throw new Error("Aucun utilisateur ne correspond à cet identifiant Stuff Market.");
      }

      const reference = `SRV-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const location = `Région: ${regionName} | Province: ${provinceName} | Localisation: ${serviceLocation.trim()}`;

      const { error } = await supabase.from("services").insert({
        user_id: professional.id,
        title: serviceTitle.trim(),
        description: serviceDescription.trim(),
        category: serviceCategory.trim() || null,
        price: servicePrice ? Number(servicePrice) : null,
        location,
        whatsapp_phone: serviceWhatsapp.trim(),
        reference,
        allow_negotiation: serviceNegotiation,
        status: "available",
      });

      if (error) throw error;

      setServiceStuffId("");
      setServiceTitle("");
      setServiceDescription("");
      setServicePrice("");
      setServiceRegionId("");
      setServiceProvinceId("");
      setServiceLocation("");
      setServiceWhatsapp("");
      setServiceNegotiation(true);
      await loadServices();
      await loadDashboard();
      toast.success("Service publié pour le professionnel.");
    } catch (error: any) {
      toast.error(error?.message || "Impossible de publier le service.");
    } finally {
      setServiceSaving(false);
    }
  }

  async function deleteService(id: string) {
    if (!confirm("Supprimer définitivement ce service ?")) return;

    const { error } = await supabase.from("services").delete().eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    setServices((prev) =>
      prev.filter((service) => service.id !== id),
    );
    toast.success("Service supprimé.");
  }

  async function toggleServiceStatus(
    id: string,
    status: "available" | "unavailable",
  ) {
    const { error } = await supabase
      .from("services")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    setServices((prev) =>
      prev.map((service) =>
        service.id === id ? { ...service, status } : service,
      ),
    );

    toast.success(
      status === "available" ? "Service activé." : "Service désactivé.",
    );
  }

  async function activateBoost(
    ad: AdRow,
    plan: "free_36h" | "7_days" | "1_month",
  ) {
    if (!session?.user?.id) {
      toast.error("Administrateur non connecté.");
      return;
    }

    const durations: Record<string, number> = {
      free_36h: 36,
      "7_days": 168,
      "1_month": 720,
    };

    const duration = durations[plan];
    if (!duration) {
      toast.error("Formule introuvable.");
      return;
    }

    const startsAt = new Date();
    const endsAt = new Date(
      startsAt.getTime() + duration * 60 * 60 * 1000,
    );

    const { error } = await supabase.from("ad_boosts").insert({
      ad_id: ad.id,
      user_id: ad.user_id,
      plan,
      status: "active",
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    await loadBoostedAds();
    toast.success("Publicité activée.");
  }

  async function cancelBoost(id: string) {
    const { error } = await supabase
      .from("ad_boosts")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    await loadBoostedAds();
    toast.success("Publicité désactivée.");
  }

  function formatPrice(value: number | null) {
    if (value === null || value === undefined) return "—";
    return `${Number(value).toLocaleString("fr-FR")} FCFA`;
  }

  function formatDate(value: string | null) {
    if (!value) return "—";
    return new Date(value).toLocaleString("fr-FR");
  }

  const filteredAds = useMemo(() => {
    const query = searchAds.trim().toLowerCase();
    if (!query) return ads;

    return ads.filter((ad) =>
      [ad.title, ad.category, ad.location, ad.reference]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query),
        ),
    );
  }, [ads, searchAds]);

  const filteredServices = useMemo(() => {
    const query = searchServices.trim().toLowerCase();
    if (!query) return services;

    return services.filter((service) =>
      [
        service.title,
        service.category,
        service.location,
        service.reference,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query),
        ),
    );
  }, [services, searchServices]);

  const soldAds = useMemo(
    () => ads.filter((ad) => ad.status === "sold"),
    [ads],
  );

  const tradeAds = useMemo(
    () => ads.filter((ad) => ad.trade_enabled === true),
    [ads],
  );

  const today = new Date().toISOString().slice(0, 10);
  const visitsToday = visits.filter(
    (visit) => visit.visit_date === today,
  ).length;

  const activeGroups = groups.filter((group) => group.is_active);

  function getPlatformLabel(platform: string) {
    if (platform === "whatsapp") return "WhatsApp";
    if (platform === "facebook") return "Facebook";
    if (platform === "telegram") return "Telegram";
    return platform;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">
          Chargement du panneau d'administration...
        </p>
      </div>
    );
  }

  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-lg">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">
              Administration Stuff Market
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Connectez-vous avec votre compte administrateur.
            </p>
          </div>

          <div className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Adresse e-mail"
              className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2"
            />

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mot de passe"
              className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2"
            />

            <button
              type="button"
              onClick={login}
              disabled={loginLoading}
              className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50"
            >
              {loginLoading ? "Connexion..." : "Se connecter"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Administration Stuff Market
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestion de la plateforme.
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Se déconnecter
          </button>
        </div>
      </div>

      <main className="container mx-auto space-y-6 px-4 py-6">
        <div className="flex flex-wrap gap-2">
          {[
            ["dashboard", "Tableau de bord"],
            ["ads", "Annonces"],
            ["trade", "Troc"],
            ["services", "Services"],
            ["sold", "Produits vendus"],
            ["boosts", "Publicités"],
            ["groups", "Groupes"],
            ["admins", "Administrateurs"],
            ["settings", "Réglages"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveSection(value)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeSection === value
                  ? "bg-primary text-primary-foreground"
                  : "border hover:bg-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeSection === "dashboard" && (
          <section className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border p-5">
                <p className="text-sm text-muted-foreground">Utilisateurs</p>
                <p className="mt-2 text-3xl font-bold">{usersCount}</p>
              </div>
              <div className="rounded-2xl border p-5">
                <p className="text-sm text-muted-foreground">Annonces</p>
                <p className="mt-2 text-3xl font-bold">{adsCount}</p>
              </div>
              <div className="rounded-2xl border p-5">
                <p className="text-sm text-muted-foreground">Services</p>
                <p className="mt-2 text-3xl font-bold">{servicesCount}</p>
              </div>
              <div className="rounded-2xl border p-5">
                <p className="text-sm text-muted-foreground">
                  Visites aujourd'hui
                </p>
                <p className="mt-2 text-3xl font-bold">{visitsToday}</p>
              </div>
            </div>

            <div className="rounded-2xl border p-5">
              <h2 className="text-lg font-semibold">Résumé</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">
                    Produits disponibles
                  </p>
                  <p className="mt-1 text-xl font-bold">
                    {ads.filter((ad) => ad.status === "available").length}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">
                    Produits vendus
                  </p>
                  <p className="mt-1 text-xl font-bold">{soldAds.length}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">
                    Produits en troc
                  </p>
                  <p className="mt-1 text-xl font-bold">{tradeAds.length}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">
                    Publicités actives
                  </p>
                  <p className="mt-1 text-xl font-bold">
                    {boostedAds.length}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeSection === "ads" && (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">Gestion des annonces</h2>
              <p className="text-sm text-muted-foreground">
                Rechercher, vendre ou supprimer les annonces.
              </p>
            </div>

            <input
              value={searchAds}
              onChange={(event) => setSearchAds(event.target.value)}
              placeholder="Rechercher une annonce..."
              className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2"
            />

            <div className="space-y-3">
              {filteredAds.length === 0 ? (
                <div className="rounded-xl border p-6 text-center text-muted-foreground">
                  Aucune annonce.
                </div>
              ) : (
                filteredAds.map((ad) => (
                  <div key={ad.id} className="rounded-xl border p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{ad.title}</h3>
                        <p className="text-sm">{formatPrice(ad.price)}</p>
                        <p className="text-sm text-muted-foreground">
                          {ad.location || "Localisation non précisée"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Référence : {ad.reference || "—"}
                        </p>
                        <div className="flex flex-wrap gap-2 pt-2">
                          <span className="rounded-full bg-muted px-2 py-1 text-xs">
                            {ad.status === "sold" ? "Vendu" : "Disponible"}
                          </span>
                          {ad.trade_enabled && (
                            <span className="rounded-full bg-muted px-2 py-1 text-xs">
                              Troc activé
                            </span>
                          )}
                          {ad.allow_negotiation && (
                            <span className="rounded-full bg-muted px-2 py-1 text-xs">
                              Marchandage
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {ad.status === "sold" ? (
                          <button
                            type="button"
                            onClick={() => restoreAd(ad.id)}
                            className="rounded-lg border px-3 py-2 text-sm"
                          >
                            Remettre en vente
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => markAdAsSold(ad.id)}
                            className="rounded-lg border px-3 py-2 text-sm"
                          >
                            Marquer vendu
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => deleteAd(ad.id)}
                          className="rounded-lg border px-3 py-2 text-sm"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {activeSection === "trade" && (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">
                Produits disponibles pour le troc
              </h2>
              <p className="text-sm text-muted-foreground">
                Annonces dont le vendeur a activé le troc.
              </p>
            </div>

            {tradeAds.length === 0 ? (
              <div className="rounded-xl border p-6 text-center text-muted-foreground">
                Aucun produit proposé en troc.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {tradeAds.map((ad) => (
                  <div key={ad.id} className="rounded-xl border p-4">
                    <h3 className="font-semibold">{ad.title}</h3>
                    <p className="mt-1 text-sm">{formatPrice(ad.price)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {ad.location || "Localisation non précisée"}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => markAdAsSold(ad.id)}
                        className="rounded-lg border px-3 py-2 text-sm"
                      >
                        Marquer vendu
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteAd(ad.id)}
                        className="rounded-lg border px-3 py-2 text-sm"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeSection === "services" && (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">Gestion des services</h2>
              <p className="text-sm text-muted-foreground">
                Gérer les services publiés sur Stuff Market.
              </p>
            </div>

            <div className="rounded-xl border bg-muted/20 p-5">
              <h3 className="font-semibold">Publier un service pour un professionnel</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Utilise ce formulaire lorsqu'un professionnel contacte les administrateurs pour demander la mise en ligne de son service.
              </p>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input value={serviceStuffId} onChange={(e) => setServiceStuffId(e.target.value)} placeholder="Identifiant Stuff Market du professionnel *" className="rounded-lg border bg-background px-3 py-2 md:col-span-2" />
                <input value={serviceTitle} onChange={(e) => setServiceTitle(e.target.value)} placeholder="Nom du service *" className="rounded-lg border bg-background px-3 py-2" />
                <select value={serviceCategory} onChange={(e) => setServiceCategory(e.target.value)} className="rounded-lg border bg-background px-3 py-2">
                  {["Plomberie","Maçonnerie","Soudure","Coiffure","Tailleur / Couture","Menuiserie","Électricité","Réparation","Entretien","Transport","Autre"].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <textarea value={serviceDescription} onChange={(e) => setServiceDescription(e.target.value)} placeholder="Description du service *" className="min-h-28 rounded-lg border bg-background px-3 py-2 md:col-span-2" />
                <input value={servicePrice} onChange={(e) => setServicePrice(e.target.value)} type="number" placeholder="Prix en FCFA (facultatif)" className="rounded-lg border bg-background px-3 py-2" />
                <input value={serviceWhatsapp} onChange={(e) => setServiceWhatsapp(e.target.value)} placeholder="WhatsApp du professionnel * (+226...)" className="rounded-lg border bg-background px-3 py-2" />

                <select value={serviceRegionId} onChange={(e) => { setServiceRegionId(e.target.value); setServiceProvinceId(""); }} className="rounded-lg border bg-background px-3 py-2">
                  <option value="">Choisir une région *</option>
                  {regions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}
                </select>

                <select value={serviceProvinceId} onChange={(e) => setServiceProvinceId(e.target.value)} disabled={!serviceRegionId} className="rounded-lg border bg-background px-3 py-2 disabled:opacity-50">
                  <option value="">{serviceRegionId ? "Choisir une province *" : "Choisir d'abord une région"}</option>
                  {provinces.filter((province) => province.region_id === serviceRegionId).map((province) => <option key={province.id} value={province.id}>{province.name}</option>)}
                </select>

                <input value={serviceLocation} onChange={(e) => setServiceLocation(e.target.value)} placeholder="Quartier, secteur, village, localisation *" className="rounded-lg border bg-background px-3 py-2 md:col-span-2" />

                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={serviceNegotiation} onChange={(e) => setServiceNegotiation(e.target.checked)} />
                  Prix négociable
                </label>
              </div>

              <button type="button" disabled={serviceSaving} onClick={createServiceForProfessional} className="mt-4 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50">
                {serviceSaving ? "Publication..." : "Publier le service"}
              </button>
            </div>

            <input
              value={searchServices}
              onChange={(event) => setSearchServices(event.target.value)}
              placeholder="Rechercher un service..."
              className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2"
            />

            <div className="space-y-3">
              {filteredServices.length === 0 ? (
                <div className="rounded-xl border p-6 text-center text-muted-foreground">
                  Aucun service.
                </div>
              ) : (
                filteredServices.map((service) => (
                  <div key={service.id} className="rounded-xl border p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="font-semibold">{service.title}</h3>
                        <p className="mt-1 text-sm">
                          {formatPrice(service.price)}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {service.location || "Localisation non précisée"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Référence : {service.reference || "—"}
                        </p>
                        <span className="mt-2 inline-block rounded-full bg-muted px-2 py-1 text-xs">
                          {service.status === "available"
                            ? "Disponible"
                            : "Indisponible"}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {service.status === "available" ? (
                          <button
                            type="button"
                            onClick={() =>
                              toggleServiceStatus(
                                service.id,
                                "unavailable",
                              )
                            }
                            className="rounded-lg border px-3 py-2 text-sm"
                          >
                            Désactiver
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              toggleServiceStatus(
                                service.id,
                                "available",
                              )
                            }
                            className="rounded-lg border px-3 py-2 text-sm"
                          >
                            Activer
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => deleteService(service.id)}
                          className="rounded-lg border px-3 py-2 text-sm"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {activeSection === "sold" && (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">Produits vendus</h2>
              <p className="text-sm text-muted-foreground">
                Produits actuellement marqués comme vendus.
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">
                    Bouton « Produits vendus » sur l'accueil
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Activer ou désactiver l'accès public aux produits vendus.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => saveAppSettings(!showSold)}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${
                    showSold
                      ? "bg-primary text-primary-foreground"
                      : "border"
                  }`}
                >
                  {showSold ? "Activé" : "Désactivé"}
                </button>
              </div>
            </div>

            {soldAds.length === 0 ? (
              <div className="rounded-xl border p-6 text-center text-muted-foreground">
                Aucun produit vendu.
              </div>
            ) : (
              <div className="space-y-3">
                {soldAds.map((ad) => (
                  <div key={ad.id} className="rounded-xl border p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="font-semibold">{ad.title}</h3>
                        <p className="text-sm">{formatPrice(ad.price)}</p>
                        <p className="text-sm text-muted-foreground">
                          {ad.location || "Localisation non précisée"}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => restoreAd(ad.id)}
                          className="rounded-lg border px-3 py-2 text-sm"
                        >
                          Remettre en vente
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteAd(ad.id)}
                          className="rounded-lg border px-3 py-2 text-sm"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeSection === "boosts" && (
          <section className="space-y-5">
            <div>
              <h2 className="text-xl font-bold">Publicités</h2>
              <p className="text-sm text-muted-foreground">
                Gestion des boosts et partage des publicités.
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <h3 className="font-semibold">Activer une publicité</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Choisissez une annonce puis une formule.
              </p>

              <div className="mt-4 space-y-3">
                {ads
                  .filter((ad) => ad.status === "available")
                  .slice(0, 20)
                  .map((ad) => (
                    <div key={ad.id} className="rounded-lg border p-3">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-medium">{ad.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(ad.price)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => activateBoost(ad, "free_36h")}
                            className="rounded-lg border px-3 py-2 text-xs"
                          >
                            Gratuit 36h
                          </button>
                          <button
                            type="button"
                            onClick={() => activateBoost(ad, "7_days")}
                            className="rounded-lg border px-3 py-2 text-xs"
                          >
                            500 FCFA / 7 jours
                          </button>
                          <button
                            type="button"
                            onClick={() => activateBoost(ad, "1_month")}
                            className="rounded-lg border px-3 py-2 text-xs"
                          >
                            1000 FCFA / mois
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <h3 className="font-semibold">Publicités actives</h3>

              <div className="mt-4 space-y-3">
                {boostedAds.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucune publicité active.
                  </p>
                ) : (
                  boostedAds.map((boost) => (
                    <div key={boost.id} className="rounded-lg border p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="font-semibold">
                            {boost.ad?.title}
                          </p>
                          <p className="text-sm">
                            Formule : {boost.plan}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Fin : {formatDate(boost.ends_at)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedBoost(boost)}
                            disabled={!boost.ad}
                            className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
                          >
                            Préparer le partage
                          </button>

                          <button
                            type="button"
                            onClick={() => cancelBoost(boost.id)}
                            className="rounded-lg border px-3 py-2 text-sm"
                          >
                            Désactiver
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {activeSection === "groups" && (
          <section className="space-y-5">
            <div>
              <h2 className="text-xl font-bold">Groupes de partage</h2>
              <p className="text-sm text-muted-foreground">
                Ajoutez les groupes WhatsApp, Facebook et Telegram utilisés
                pour partager les publicités.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <input
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                placeholder="Nom du groupe"
                className="rounded-lg border bg-background px-3 py-2"
              />

              <select
                value={groupPlatform}
                onChange={(event) => setGroupPlatform(event.target.value)}
                className="rounded-lg border bg-background px-3 py-2"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="facebook">Facebook</option>
                <option value="telegram">Telegram</option>
              </select>

              <input
                value={groupUrl}
                onChange={(event) => setGroupUrl(event.target.value)}
                placeholder="Lien du groupe"
                className="rounded-lg border bg-background px-3 py-2"
              />

              <button
                type="button"
                onClick={addGroup}
                className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground"
              >
                Ajouter
              </button>
            </div>

            <div className="space-y-3">
              {groups.length === 0 ? (
                <div className="rounded-xl border p-6 text-center text-muted-foreground">
                  Aucun groupe enregistré.
                </div>
              ) : (
                groups.map((group) => (
                  <div
                    key={group.id}
                    className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium">{group.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {getPlatformLabel(group.platform)}
                      </p>
                      <p className="mt-1 break-all text-xs text-muted-foreground">
                        {group.url}
                      </p>
                      <span className="mt-2 inline-block rounded-full bg-muted px-2 py-1 text-xs">
                        {group.is_active ? "Actif" : "Désactivé"}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => toggleGroup(group)}
                        className="rounded-lg border px-3 py-2 text-sm"
                      >
                        {group.is_active ? "Désactiver" : "Activer"}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteGroup(group.id)}
                        className="rounded-lg border px-3 py-2 text-sm"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="text-sm">
                Groupes actifs : <strong>{activeGroups.length}</strong>
              </p>
            </div>
          </section>
        )}

        {activeSection === "admins" && (
          <section className="space-y-5">
            <div>
              <h2 className="text-xl font-bold">Administrateurs</h2>
              <p className="text-sm text-muted-foreground">
                Gestion des sous-administrateurs et de leurs permissions.
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <h3 className="font-semibold">
                Ajouter un administrateur
              </h3>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input
                  value={newAdminEmail}
                  onChange={(event) => setNewAdminEmail(event.target.value)}
                  placeholder="Adresse e-mail"
                  className="rounded-lg border bg-background px-3 py-2"
                />
                <input
                  value={newAdminId}
                  onChange={(event) => setNewAdminId(event.target.value)}
                  placeholder="ID utilisateur Auth"
                  className="rounded-lg border bg-background px-3 py-2"
                />
              </div>

              <div className="mt-4 space-y-3">
                <p className="text-sm font-medium">Permissions</p>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={manageAds}
                    onChange={(event) => setManageAds(event.target.checked)}
                  />
                  Gérer les annonces
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={manageOffers}
                    onChange={(event) =>
                      setManageOffers(event.target.checked)
                    }
                  />
                  Gérer les services/offres
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={manageUsers}
                    onChange={(event) =>
                      setManageUsers(event.target.checked)
                    }
                  />
                  Gérer les utilisateurs
                </label>
              </div>

              <button
                type="button"
                onClick={addSubAdmin}
                className="mt-4 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground"
              >
                Ajouter l'administrateur
              </button>
            </div>

            <div className="space-y-3">
              {subAdmins.map((subAdmin) => (
                <div
                  key={subAdmin.id}
                  className="rounded-xl border p-4"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold">
                          {subAdmin.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ID : {subAdmin.id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Rôle : {subAdmin.role}
                        </p>
                      </div>

                      {subAdmin.id !== admin?.id && (
                        <button
                          type="button"
                          onClick={() =>
                            deleteSubAdmin(subAdmin.id)
                          }
                          className="rounded-lg border px-3 py-2 text-sm"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3">
                      <label className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                        <input
                          type="checkbox"
                          checked={subAdmin.can_manage_ads}
                          disabled={subAdmin.id === admin?.id}
                          onChange={(event) =>
                            updateSubAdminPermission(
                              subAdmin.id,
                              "can_manage_ads",
                              event.target.checked,
                            )
                          }
                        />
                        Annonces
                      </label>

                      <label className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                        <input
                          type="checkbox"
                          checked={subAdmin.can_manage_offers}
                          disabled={subAdmin.id === admin?.id}
                          onChange={(event) =>
                            updateSubAdminPermission(
                              subAdmin.id,
                              "can_manage_offers",
                              event.target.checked,
                            )
                          }
                        />
                        Services
                      </label>

                      <label className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                        <input
                          type="checkbox"
                          checked={subAdmin.can_manage_users}
                          disabled={subAdmin.id === admin?.id}
                          onChange={(event) =>
                            updateSubAdminPermission(
                              subAdmin.id,
                              "can_manage_users",
                              event.target.checked,
                            )
                          }
                        />
                        Utilisateurs
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeSection === "settings" && (
          <section className="space-y-5">
            <div>
              <h2 className="text-xl font-bold">Réglages</h2>
              <p className="text-sm text-muted-foreground">
                Configuration générale de Stuff Market.
              </p>
            </div>

            <div className="rounded-xl border p-5">
              <h3 className="font-semibold">Produits vendus</h3>

              <div className="mt-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">
                    Afficher le bouton « Produits vendus »
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Permet aux visiteurs de consulter les produits vendus.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => saveAppSettings(!showSold)}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${
                    showSold
                      ? "bg-primary text-primary-foreground"
                      : "border"
                  }`}
                >
                  {showSold ? "Activé" : "Désactivé"}
                </button>
              </div>
            </div>

            <div className="rounded-xl border p-5">
              <h3 className="font-semibold">Publicité</h3>

              <div className="mt-4 space-y-3">
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="font-medium">Identifiant / code Monetag</p>
                  <p className="mt-1 text-xs text-muted-foreground">Colle ici le code ou l'identifiant fourni par Monetag. Ne renseigne rien tant que la plateforme ne t'a pas donné cette information.</p>
                  <input value={monetagCode} onChange={(e) => setMonetagCode(e.target.value)} onBlur={() => saveAdCode("monetag_code", monetagCode)} placeholder="Code / identifiant Monetag" className="mt-3 w-full rounded-lg border bg-background px-3 py-2" />
                </div>

                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="font-medium">Identifiant / code Adsterra</p>
                  <p className="mt-1 text-xs text-muted-foreground">Colle ici le code ou l'identifiant fourni par Adsterra.</p>
                  <input value={adsterraCode} onChange={(e) => setAdsterraCode(e.target.value)} onBlur={() => saveAdCode("adsterra_code", adsterraCode)} placeholder="Code / identifiant Adsterra" className="mt-3 w-full rounded-lg border bg-background px-3 py-2" />
                </div>

                <label className="flex items-center justify-between gap-4 rounded-lg border p-3">
                  <span>
                    <span className="block font-medium">Monetag</span>
                    <span className="text-xs text-muted-foreground">
                      Activer ou désactiver Monetag.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={monetag}
                    onChange={(event) =>
                      saveAdSettings(
                        "monetag_enabled",
                        event.target.checked,
                      )
                    }
                  />
                </label>

                <label className="flex items-center justify-between gap-4 rounded-lg border p-3">
                  <span>
                    <span className="block font-medium">Adsterra</span>
                    <span className="text-xs text-muted-foreground">
                      Activer ou désactiver Adsterra.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={adsterra}
                    onChange={(event) =>
                      saveAdSettings(
                        "adsterra_enabled",
                        event.target.checked,
                      )
                    }
                  />
                </label>

                <label className="flex items-center justify-between gap-4 rounded-lg border p-3">
                  <span>
                    <span className="block font-medium">Pop-up</span>
                    <span className="text-xs text-muted-foreground">
                      Afficher les publicités pop-up.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={popup}
                    onChange={(event) =>
                      saveAdSettings(
                        "show_popup",
                        event.target.checked,
                      )
                    }
                  />
                </label>

                <label className="flex items-center justify-between gap-4 rounded-lg border p-3">
                  <span>
                    <span className="block font-medium">Bannière</span>
                    <span className="text-xs text-muted-foreground">
                      Afficher les bannières publicitaires.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={banner}
                    onChange={(event) =>
                      saveAdSettings(
                        "show_banner",
                        event.target.checked,
                      )
                    }
                  />
                </label>

                <label className="flex items-center justify-between gap-4 rounded-lg border p-3">
                  <span>
                    <span className="block font-medium">Push</span>
                    <span className="text-xs text-muted-foreground">
                      Activer les publicités push.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={push}
                    onChange={(event) =>
                      saveAdSettings(
                        "show_push",
                        event.target.checked,
                      )
                    }
                  />
                </label>
              </div>
            </div>

            <div className="rounded-xl border bg-muted/30 p-5">
              <h3 className="font-semibold">Informations</h3>
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <p>Application : Stuff Market</p>
                <p>URL actuelle : {APP_URL}</p>
                <p>Groupes actifs : {activeGroups.length}</p>
                <p>Publicités actives : {boostedAds.length}</p>
              </div>
            </div>
          </section>
        )}

        <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
          <p>
            Administrateur connecté :{" "}
            <strong className="text-foreground">
              {admin.email}
            </strong>
          </p>
          <p className="mt-1">
            Rôle :{" "}
            <strong className="text-foreground">
              {admin.role}
            </strong>
          </p>
        </div>
      </main>

      {selectedBoost && selectedBoost.ad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">
                  Partager la publicité
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedBoost.ad.title}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBoost(null)}
                className="rounded-lg border px-3 py-1 text-sm"
              >
                Fermer
              </button>
            </div>

            <div className="mt-5 rounded-xl border bg-muted/30 p-4">
              <p className="text-sm font-medium">
                Le produit est prêt à être partagé.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Copiez le message puis ouvrez les groupes WhatsApp,
                Facebook ou Telegram pour publier la publicité.
              </p>
            </div>

            <div className="mt-4 rounded-xl border p-4">
              <p className="whitespace-pre-wrap text-sm">
                {[
                  "📢 NOUVELLE PUBLICITÉ SUR STUFF MARKET",
                  "",
                  `🛍️ ${selectedBoost.ad.title}`,
                  `💰 Prix : ${formatPrice(selectedBoost.ad.price)}`,
                  `📍 Localisation : ${
                    selectedBoost.ad.location || "Non précisée"
                  }`,
                  "",
                  "🔗 Voir directement le produit :",
                  `${APP_URL}/annonce/${selectedBoost.ad.id}`,
                  "",
                  "🌐 Découvrir Stuff Market :",
                  APP_URL,
                  "",
                  "Contactez le vendeur directement sur WhatsApp.",
                ].join("\n")}
              </p>
            </div>

            <div className="mt-5">
              <h3 className="font-semibold">Groupes disponibles</h3>

              <div className="mt-3 space-y-2">
                {activeGroups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucun groupe actif.
                  </p>
                ) : (
                  activeGroups.map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={async () => {
                        const message = [
                          "📢 NOUVELLE PUBLICITÉ SUR STUFF MARKET",
                          "",
                          `🛍️ ${selectedBoost.ad!.title}`,
                          `💰 Prix : ${formatPrice(
                            selectedBoost.ad!.price,
                          )}`,
                          `📍 Localisation : ${
                            selectedBoost.ad!.location ||
                            "Non précisée"
                          }`,
                          "",
                          "🔗 Voir directement le produit :",
                          `${APP_URL}/annonce/${selectedBoost.ad!.id}`,
                          "",
                          "🌐 Découvrir Stuff Market :",
                          APP_URL,
                          "",
                          "Contactez le vendeur directement sur WhatsApp.",
                        ].join("\n");

                        try {
                          await navigator.clipboard.writeText(message);
                        } catch {
                          // Presse-papiers non disponible.
                        }

                        window.open(group.url, "_blank");

                        toast.success(
                          `${group.name} ouvert. Le message est prêt à être collé.`,
                        );
                      }}
                      className="flex w-full items-center justify-between rounded-lg border p-3 text-left hover:bg-muted"
                    >
                      <span>
                        <span className="block font-medium">
                          {group.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {getPlatformLabel(group.platform)}
                        </span>
                      </span>
                      <span className="text-sm">Ouvrir</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
