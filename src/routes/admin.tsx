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

  const [boostedAds, setBoostedAds] = useState<any[]>([]);
  const [selectedBoost, setSelectedBoost] = useState<any | null>(null);

  const [subAdmins, setSubAdmins] = useState<any[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminId, setNewAdminId] = useState("");
  const [manageAds, setManageAds] = useState(true);
  const [manageOffers, setManageOffers] = useState(true);
  const [manageUsers, setManageUsers] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);

      if (data.session) {
        loadAdmin(
          data.session.user.id,
          data.session.user.email ?? "",
        );
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);

      if (nextSession) {
        loadAdmin(
          nextSession.user.id,
          nextSession.user.email ?? "",
        );
      } else {
        setAdmin(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadAdmin(
    userId: string,
    userEmail: string,
  ) {
    setLoading(true);

    const { data, error } = await supabase
      .from("admin_users")
      .select(
        "id,email,role,can_manage_ads,can_manage_offers,can_manage_users",
      )
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
      loadGroups(),
      loadSettings(),
      loadSubAdmins(),
      loadBoostedAds(),
    ]);

    setLoading(false);
  }

  async function loadDashboard() {
    const [ads, services, users, visits] =
      await Promise.all([
        supabase
          .from("ads")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("services")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("profiles")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("app_visits")
          .select("visit_date,visitor_id")
          .order("visit_date", {
            ascending: false,
          }),
      ]);

    setAdsCount(ads.count ?? 0);
    setServicesCount(services.count ?? 0);
    setUsersCount(users.count ?? 0);
    setVisits((visits.data ?? []) as Visit[]);
  }

  async function loadGroups() {
    const { data, error } = await supabase
      .from("promotion_groups")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (!error) {
      setGroups((data ?? []) as Group[]);
    }
  }

  async function loadSettings() {
    const [app, ads] = await Promise.all([
      supabase
        .from("app_settings")
        .select("*")
        .eq("id", "main")
        .maybeSingle(),

      supabase
        .from("ad_settings")
        .select("*")
        .eq("id", "main")
        .maybeSingle(),
    ]);

    if (app.data) {
      setShowSold(
        Boolean(app.data.show_sold_products),
      );
    }

    if (ads.data) {
      setMonetag(
        Boolean(ads.data.monetag_enabled),
      );
      setAdsterra(
        Boolean(ads.data.adsterra_enabled),
      );
      setPopup(
        Boolean(ads.data.show_popup),
      );
      setBanner(
        Boolean(ads.data.show_banner),
      );
      setPush(
        Boolean(ads.data.show_push),
      );
    }
  }

  async function loadSubAdmins() {
    const { data } = await supabase
      .from("admin_users")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    setSubAdmins(data ?? []);
  }

  async function loadBoostedAds() {
    const { data, error } = await supabase
      .from("ad_boosts")
      .select(
        "id,ad_id,user_id,plan,status,starts_at,ends_at,created_at",
      )
      .eq("status", "active")
      .order("created_at", {
        ascending: false,
      });

    if (error || !data) {
      setBoostedAds([]);
      return;
    }

    const ids = data.map(
      (item) => item.ad_id,
    );

    if (!ids.length) {
      setBoostedAds([]);
      return;
    }

    const { data: ads } = await supabase
      .from("ads")
      .select(
        "id,title,price,location,whatsapp_phone,photo_urls,reference",
      )
      .in("id", ids);

    const merged = data.map((boost) => ({
      ...boost,
      ad:
        ads?.find(
          (ad) => ad.id === boost.ad_id,
        ) ?? null,
    }));

    setBoostedAds(merged);
  }

  async function login() {
    if (!email || !password) {
      toast.error(
        "Remplis l'email et le mot de passe.",
      );
      return;
    }

    try {
      setLoginLoading(true);

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.session) {
        setSession(data.session);

        await loadAdmin(
          data.session.user.id,
          data.session.user.email ?? "",
        );
      }
    } finally {
      setLoginLoading(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  async function addGroup() {
    if (
      !groupName.trim() ||
      !groupUrl.trim()
    ) {
      toast.error(
        "Nom et lien obligatoires.",
      );
      return;
    }

    const { error } = await supabase
      .from("promotion_groups")
      .insert({
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

  async function toggleGroup(
    group: Group,
  ) {
    const { error } = await supabase
      .from("promotion_groups")
      .update({
        is_active: !group.is_active,
      })
      .eq("id", group.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    await loadGroups();
  }

  async function deleteGroup(
    id: string,
  ) {
    if (
      !confirm("Supprimer ce groupe ?")
    ) {
      return;
    }

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

  async function saveAppSettings(
    value: boolean,
  ) {
    const { error } = await supabase
      .from("app_settings")
      .update({
        show_sold_products: value,
      })
      .eq("id", "main");

    if (error) {
      toast.error(error.message);
      return;
    }

    setShowSold(value);

    toast.success(
      "Réglage enregistré.",
    );
  }  async function deleteGroup(id: string) {
    const { error } = await supabase
      .from("promotion_groups")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    setGroups((prev) => prev.filter((group) => group.id !== id));
    toast.success("Groupe supprimé.");
  }

  async function createSubAdmin() {
    if (!newAdminEmail.trim()) {
      toast.error("Entrez l'adresse e-mail.");
      return;
    }

    if (!newAdminId.trim()) {
      toast.error("Entrez l'identifiant Auth de l'utilisateur.");
      return;
    }

    const { error } = await supabase
      .from("admin_users")
      .insert({
        id: newAdminId.trim(),
        email: newAdminEmail.trim(),
        role: "admin",
        can_manage_ads: newAdminAds,
        can_manage_offers: newAdminOffers,
        can_manage_users: newAdminUsers,
      });

    if (error) {
      toast.error(error.message);
      return;
    }

    setNewAdminEmail("");
    setNewAdminId("");
    setNewAdminAds(true);
    setNewAdminOffers(true);
    setNewAdminUsers(false);

    await loadSubAdmins();

    toast.success("Administrateur ajouté.");
  }

  async function deleteSubAdmin(id: string) {
    if (id === user?.id) {
      toast.error("Vous ne pouvez pas supprimer votre propre compte administrateur.");
      return;
    }

    const { error } = await supabase
      .from("admin_users")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    await loadSubAdmins();
    toast.success("Administrateur supprimé.");
  }

  async function toggleSubAdminPermission(
    id: string,
    field:
      | "can_manage_ads"
      | "can_manage_offers"
      | "can_manage_users",
    value: boolean,
  ) {
    const { error } = await supabase
      .from("admin_users")
      .update({
        [field]: value,
      })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    setSubAdmins((prev) =>
      prev.map((admin) =>
        admin.id === id
          ? {
              ...admin,
              [field]: value,
            }
          : admin,
      ),
    );
  }

  async function markAdAsSold(id: string) {
    const { error } = await supabase
      .from("ads")
      .update({
        status: "sold",
      })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    setAds((prev) =>
      prev.map((ad) =>
        ad.id === id
          ? {
              ...ad,
              status: "sold",
            }
          : ad,
      ),
    );

    toast.success("Produit marqué comme vendu.");
  }

  async function restoreAd(id: string) {
    const { error } = await supabase
      .from("ads")
      .update({
        status: "available",
      })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    setAds((prev) =>
      prev.map((ad) =>
        ad.id === id
          ? {
              ...ad,
              status: "available",
            }
          : ad,
      ),
    );

    toast.success("Produit remis en vente.");
  }

  async function deleteAd(id: string) {
    const { error } = await supabase
      .from("ads")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    setAds((prev) => prev.filter((ad) => ad.id !== id));

    toast.success("Annonce supprimée.");
  }

  async function deleteService(id: string) {
    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", id);

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
      .update({
        status,
      })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    setServices((prev) =>
      prev.map((service) =>
        service.id === id
          ? {
              ...service,
              status,
            }
          : service,
      ),
    );

    toast.success(
      status === "available"
        ? "Service activé."
        : "Service désactivé.",
    );
  }

  async function activateBoost(
    adId: string,
    plan: "free_36h" | "7_days" | "1_month",
  ) {
    if (!user) {
      toast.error("Administrateur non connecté.");
      return;
    }

    const selectedPlan = boostPlans.find(
      (item) => item.id === plan,
    );

    if (!selectedPlan) {
      toast.error("Formule introuvable.");
      return;
    }

    const startsAt = new Date();
    const endsAt = new Date(
      startsAt.getTime() +
        selectedPlan.duration_hours * 60 * 60 * 1000,
    );

    const { error } = await supabase
      .from("ad_boosts")
      .insert({
        ad_id: adId,
        user_id: user.id,
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
      .update({
        status: "cancelled",
      })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    await loadBoostedAds();

    toast.success("Publicité désactivée.");
  }

  function buildShareMessage(ad: AdRow) {
    const directLink =
      `${APP_URL}/annonce/${ad.id}`;

    return [
      "📢 NOUVELLE PUBLICITÉ SUR STUFF MARKET",
      "",
      `🛍️ ${ad.title}`,
      `💰 Prix : ${ad.price} FCFA`,
      `📍 Localisation : ${ad.location || "Non précisée"}`,
      "",
      "🔗 Voir directement le produit :",
      directLink,
      "",
      "🌐 Découvrir Stuff Market :",
      APP_URL,
      "",
      "Contactez le vendeur directement sur WhatsApp.",
    ].join("\n");
  }

  async function openShareModal(ad: AdRow) {
    setSelectedBoost(ad);
    setShareMessage(buildShareMessage(ad));
    setShareModalOpen(true);
  }

  async function copyShareMessage() {
    try {
      await navigator.clipboard.writeText(shareMessage);
      toast.success("Message copié.");
    } catch {
      toast.error("Impossible de copier le message.");
    }
  }

  async function shareToGroup(group: PromotionGroup) {
    if (!selectedBoost) {
      return;
    }

    const message = shareMessage;

    try {
      await navigator.clipboard.writeText(message);
    } catch {
      // Le navigateur peut refuser le presse-papiers.
    }

    window.open(group.url, "_blank");

    toast.success(
      `Groupe ${group.name} ouvert. Le message a été préparé.`,
    );
  }

  function closeShareModal() {
    setShareModalOpen(false);
    setSelectedBoost(null);
    setShareMessage("");
  }

  function formatDate(value: string | null | undefined) {
    if (!value) {
      return "—";
    }

    return new Date(value).toLocaleString("fr-FR");
  }

  function formatPrice(value: number | null | undefined) {
    if (value === null || value === undefined) {
      return "—";
    }

    return `${Number(value).toLocaleString("fr-FR")} FCFA`;
  }

  const filteredAds = ads.filter((ad) => {
    const query = searchAds.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return (
      ad.title.toLowerCase().includes(query) ||
      (ad.category || "").toLowerCase().includes(query) ||
      (ad.location || "").toLowerCase().includes(query)
    );
  });

  const filteredServices = services.filter((service) => {
    const query = searchServices.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return (
      service.title.toLowerCase().includes(query) ||
      (service.category || "").toLowerCase().includes(query) ||
      (service.location || "").toLowerCase().includes(query)
    );
  });

  const soldAds = ads.filter(
    (ad) => ad.status === "sold",
  );

  const tradeAds = ads.filter(
    (ad) => ad.trade_enabled === true,
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">
          Chargement du panneau d'administration...
        </p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Administration Stuff Market</CardTitle>
            <CardDescription>
              Connectez-vous avec votre compte administrateur.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Input
              type="email"
              placeholder="Adresse e-mail"
              value={loginEmail}
              onChange={(event) =>
                setLoginEmail(event.target.value)
              }
            />

            <Input
              type="password"
              placeholder="Mot de passe"
              value={loginPassword}
              onChange={(event) =>
                setLoginPassword(event.target.value)
              }
            />

            <Button
              className="w-full"
              onClick={login}
              disabled={loginLoading}
            >
              {loginLoading
                ? "Connexion..."
                : "Se connecter"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Administration Stuff Market
            </h1>

            <p className="text-sm text-muted-foreground">
              Gestion de la plateforme et des publications.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={logout}
          >
            Se déconnecter
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>
                Utilisateurs
              </CardDescription>
              <CardTitle className="text-2xl">
                {stats.users}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>
                Annonces
              </CardDescription>
              <CardTitle className="text-2xl">
                {stats.ads}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>
                Services
              </CardDescription>
              <CardTitle className="text-2xl">
                {stats.services}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>
                Visites aujourd'hui
              </CardDescription>
              <CardTitle className="text-2xl">
                {stats.visitsToday}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={
              activeSection === "dashboard"
                ? "default"
                : "outline"
            }
            onClick={() =>
              setActiveSection("dashboard")
            }
          >
            Tableau de bord
          </Button>

          <Button
            variant={
              activeSection === "ads"
                ? "default"
                : "outline"
            }
            onClick={() =>
              setActiveSection("ads")
            }
          >
            Annonces
          </Button>

          <Button
            variant={
              activeSection === "troc"
                ? "default"
                : "outline"
            }
            onClick={() =>
              setActiveSection("troc")
            }
          >
            Troc
          </Button>

          <Button
            variant={
              activeSection === "services"
                ? "default"
                : "outline"
            }
            onClick={() =>
              setActiveSection("services")
            }
          >
            Services
          </Button>

          <Button
            variant={
              activeSection === "sold"
                ? "default"
                : "outline"
            }
            onClick={() =>
              setActiveSection("sold")
            }
          >
            Produits vendus
          </Button>

          <Button
            variant={
              activeSection === "boosts"
                ? "default"
                : "outline"
            }
            onClick={() =>
              setActiveSection("boosts")
            }
          >
            Publicités
          </Button>

          <Button
            variant={
              activeSection === "groups"
                ? "default"
                : "outline"
            }
            onClick={() =>
              setActiveSection("groups")
            }
          >
            Groupes
          </Button>

          <Button
            variant={
              activeSection === "admins"
                ? "default"
                : "outline"
            }
            onClick={() =>
              setActiveSection("admins")
            }
          >
            Administrateurs
          </Button>

          <Button
            variant={
              activeSection === "settings"
                ? "default"
                : "outline"
            }
            onClick={() =>
              setActiveSection("settings")
            }
          >
            Réglages
          </Button>
        </div>

        {activeSection === "dashboard" && (
          <Card>
            <CardHeader>
              <CardTitle>Tableau de bord</CardTitle>
              <CardDescription>
                Vue générale de Stuff Market.
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">
                  Annonces disponibles
                </p>
                <p className="text-2xl font-bold">
                  {
                    ads.filter(
                      (ad) =>
                        ad.status === "available",
                    ).length
                  }
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">
                  Produits en troc
                </p>
                <p className="text-2xl font-bold">
                  {tradeAds.length}
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">
                  Produits vendus
                </p>
                <p className="text-2xl font-bold">
                  {soldAds.length}
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">
                  Publicités actives
                </p>
                <p className="text-2xl font-bold">
                  {boostedAds.length}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {activeSection === "ads" && (
          <Card>
            <CardHeader>
              <CardTitle>Gestion des annonces</CardTitle>
              <CardDescription>
                Rechercher, supprimer ou marquer les annonces
                comme vendues.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Input
                placeholder="Rechercher une annonce..."
                value={searchAds}
                onChange={(event) =>
                  setSearchAds(event.target.value)
                }
              />

              <div className="space-y-3">
                {filteredAds.map((ad) => (
                  <div
                    key={ad.id}
                    className="rounded-lg border p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="font-semibold">
                          {ad.title}
                        </h3>

                        <p className="text-sm text-muted-foreground">
                          {formatPrice(ad.price)} •{" "}
                          {ad.location || "Sans localisation"}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Statut : {ad.status}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {ad.status === "available" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              markAdAsSold(ad.id)
                            }
                          >
                            Marquer vendu
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              restoreAd(ad.id)
                            }
                          >
                            Remettre en vente
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            deleteAd(ad.id)
                          }
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredAds.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Aucune annonce trouvée.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}        {activeSection === "troc" && (
          <Card>
            <CardHeader>
              <CardTitle>Produits en troc</CardTitle>
              <CardDescription>
                Annonces pour lesquelles le vendeur accepte les échanges.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {tradeAds.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun produit disponible en troc.
                </p>
              ) : (
                <div className="space-y-3">
                  {tradeAds.map((ad) => (
                    <div
                      key={ad.id}
                      className="rounded-lg border p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="font-semibold">
                            {ad.title}
                          </h3>

                          <p className="text-sm text-muted-foreground">
                            {formatPrice(ad.price)} •{" "}
                            {ad.location || "Sans localisation"}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            Statut : {ad.status}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {ad.status === "available" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                markAdAsSold(ad.id)
                              }
                            >
                              Marquer vendu
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                restoreAd(ad.id)
                              }
                            >
                              Remettre en vente
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              deleteAd(ad.id)
                            }
                          >
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeSection === "services" && (
          <Card>
            <CardHeader>
              <CardTitle>Gestion des services</CardTitle>
              <CardDescription>
                Gérer les services publiés sur Stuff Market.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Input
                placeholder="Rechercher un service..."
                value={searchServices}
                onChange={(event) =>
                  setSearchServices(event.target.value)
                }
              />

              <div className="space-y-3">
                {filteredServices.map((service) => (
                  <div
                    key={service.id}
                    className="rounded-lg border p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="font-semibold">
                          {service.title}
                        </h3>

                        <p className="text-sm text-muted-foreground">
                          {formatPrice(service.price)} •{" "}
                          {service.location || "Sans localisation"}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Statut : {service.status}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {service.status === "available" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              toggleServiceStatus(
                                service.id,
                                "unavailable",
                              )
                            }
                          >
                            Désactiver
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              toggleServiceStatus(
                                service.id,
                                "available",
                              )
                            }
                          >
                            Activer
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            deleteService(service.id)
                          }
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredServices.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Aucun service trouvé.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeSection === "sold" && (
          <Card>
            <CardHeader>
              <CardTitle>Produits vendus</CardTitle>
              <CardDescription>
                Liste des annonces marquées comme vendues.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {soldAds.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun produit vendu.
                </p>
              ) : (
                <div className="space-y-3">
                  {soldAds.map((ad) => (
                    <div
                      key={ad.id}
                      className="rounded-lg border p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="font-semibold">
                            {ad.title}
                          </h3>

                          <p className="text-sm text-muted-foreground">
                            {formatPrice(ad.price)} •{" "}
                            {ad.location || "Sans localisation"}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            Vendu le : {formatDate(ad.updated_at)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              restoreAd(ad.id)
                            }
                          >
                            Remettre en vente
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              deleteAd(ad.id)
                            }
                          >
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeSection === "boosts" && (
          <Card>
            <CardHeader>
              <CardTitle>Publicités et boosts</CardTitle>
              <CardDescription>
                Activer une publicité et partager les produits
                boostés dans les groupes enregistrés.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-3 font-semibold">
                  Activer une publicité
                </h3>

                <div className="space-y-3">
                  {ads
                    .filter(
                      (ad) =>
                        ad.status === "available",
                    )
                    .map((ad) => (
                      <div
                        key={ad.id}
                        className="rounded-lg border p-4"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <h4 className="font-semibold">
                              {ad.title}
                            </h4>

                            <p className="text-sm text-muted-foreground">
                              {formatPrice(ad.price)}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                activateBoost(
                                  ad.id,
                                  "free_36h",
                                )
                              }
                            >
                              Gratuit 36h
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                activateBoost(
                                  ad.id,
                                  "7_days",
                                )
                              }
                            >
                              7 jours — 500 FCFA
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                activateBoost(
                                  ad.id,
                                  "1_month",
                                )
                              }
                            >
                              1 mois — 1000 FCFA
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-semibold">
                  Publicités actuellement actives
                </h3>

                {boostedAds.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucune publicité active.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {boostedAds.map((boost) => (
                      <div
                        key={boost.id}
                        className="rounded-lg border p-4"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <h4 className="font-semibold">
                              {boost.ad?.title ||
                                "Annonce"}
                            </h4>

                            <p className="text-sm text-muted-foreground">
                              Formule : {boost.plan}
                            </p>

                            <p className="text-sm text-muted-foreground">
                              Expire le :{" "}
                              {formatDate(
                                boost.ends_at,
                              )}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {boost.ad && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  openShareModal(
                                    boost.ad!,
                                  )
                                }
                              >
                                Partager la publicité
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                cancelBoost(
                                  boost.id,
                                )
                              }
                            >
                              Désactiver
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeSection === "groups" && (
          <Card>
            <CardHeader>
              <CardTitle>Groupes de partage</CardTitle>
              <CardDescription>
                Ajoutez les groupes WhatsApp, Facebook et Telegram
                utilisés pour partager les publicités.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid gap-3 md:grid-cols-3">
                <Input
                  placeholder="Nom du groupe"
                  value={newGroupName}
                  onChange={(event) =>
                    setNewGroupName(event.target.value)
                  }
                />

                <select
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={newGroupPlatform}
                  onChange={(event) =>
                    setNewGroupPlatform(
                      event.target.value as
                        | "whatsapp"
                        | "facebook"
                        | "telegram",
                    )
                  }
                >
                  <option value="whatsapp">
                    WhatsApp
                  </option>
                  <option value="facebook">
                    Facebook
                  </option>
                  <option value="telegram">
                    Telegram
                  </option>
                </select>

                <Input
                  placeholder="Lien du groupe"
                  value={newGroupUrl}
                  onChange={(event) =>
                    setNewGroupUrl(event.target.value)
                  }
                />
              </div>

              <Button onClick={addGroup}>
                Ajouter le groupe
              </Button>

              <div className="space-y-3">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-semibold">
                        {group.name}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {group.platform}
                      </p>

                      <p className="max-w-full break-all text-xs text-muted-foreground">
                        {group.url}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          toggleGroup(
                            group.id,
                            !group.is_active,
                          )
                        }
                      >
                        {group.is_active
                          ? "Désactiver"
                          : "Activer"}
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          deleteGroup(group.id)
                        }
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))}

                {groups.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Aucun groupe enregistré.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}        {activeSection === "admins" && (
          <Card>
            <CardHeader>
              <CardTitle>Administrateurs</CardTitle>
              <CardDescription>
                Gérer les comptes administrateurs et leurs permissions.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="rounded-lg border p-4 space-y-4">
                <h3 className="font-semibold">
                  Ajouter un administrateur
                </h3>

                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    placeholder="E-mail de l'utilisateur"
                    value={newAdminEmail}
                    onChange={(event) =>
                      setNewAdminEmail(event.target.value)
                    }
                  />

                  <Input
                    placeholder="ID Auth de l'utilisateur"
                    value={newAdminId}
                    onChange={(event) =>
                      setNewAdminId(event.target.value)
                    }
                  />
                </div>

                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newAdminAds}
                      onChange={(event) =>
                        setNewAdminAds(event.target.checked)
                      }
                    />
                    Gérer les annonces
                  </label>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newAdminOffers}
                      onChange={(event) =>
                        setNewAdminOffers(event.target.checked)
                      }
                    />
                    Gérer les offres
                  </label>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newAdminUsers}
                      onChange={(event) =>
                        setNewAdminUsers(event.target.checked)
                      }
                    />
                    Gérer les utilisateurs
                  </label>
                </div>

                <Button onClick={createSubAdmin}>
                  Ajouter l'administrateur
                </Button>
              </div>

              <div className="space-y-3">
                {subAdmins.map((admin) => (
                  <div
                    key={admin.id}
                    className="rounded-lg border p-4 space-y-4"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold">
                          {admin.email}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Rôle : {admin.role}
                        </p>
                      </div>

                      {admin.id !== user?.id && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            deleteSubAdmin(admin.id)
                          }
                        >
                          Supprimer
                        </Button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={admin.can_manage_ads}
                          onChange={(event) =>
                            toggleSubAdminPermission(
                              admin.id,
                              "can_manage_ads",
                              event.target.checked,
                            )
                          }
                        />
                        Annonces
                      </label>

                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={admin.can_manage_offers}
                          onChange={(event) =>
                            toggleSubAdminPermission(
                              admin.id,
                              "can_manage_offers",
                              event.target.checked,
                            )
                          }
                        />
                        Offres
                      </label>

                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={admin.can_manage_users}
                          onChange={(event) =>
                            toggleSubAdminPermission(
                              admin.id,
                              "can_manage_users",
                              event.target.checked,
                            )
                          }
                        />
                        Utilisateurs
                      </label>
                    </div>
                  </div>
                ))}

                {subAdmins.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Aucun administrateur secondaire.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeSection === "settings" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Réglages de l'application</CardTitle>
                <CardDescription>
                  Activer ou désactiver certaines fonctionnalités
                  visibles sur l'accueil.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div>
                    <p className="font-semibold">
                      Produits vendus
                    </p>

                    <p className="text-sm text-muted-foreground">
                      Afficher le bouton « Produits vendus » sur
                      l'accueil.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={showSold}
                    onChange={(event) =>
                      saveAppSettings(
                        event.target.checked,
                      )
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Publicité</CardTitle>
                <CardDescription>
                  Contrôler les formats publicitaires.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div>
                    <p className="font-semibold">
                      Monetag
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Activer le système publicitaire Monetag.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={adSettings.monetag_enabled}
                    onChange={(event) =>
                      setAdSettings((prev) => ({
                        ...prev,
                        monetag_enabled:
                          event.target.checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div>
                    <p className="font-semibold">
                      Adsterra
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Activer le système publicitaire Adsterra.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={adSettings.adsterra_enabled}
                    onChange={(event) =>
                      setAdSettings((prev) => ({
                        ...prev,
                        adsterra_enabled:
                          event.target.checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div>
                    <p className="font-semibold">
                      Popup
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Autoriser l'affichage des publicités popup.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={adSettings.show_popup}
                    onChange={(event) =>
                      setAdSettings((prev) => ({
                        ...prev,
                        show_popup:
                          event.target.checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div>
                    <p className="font-semibold">
                      Bannière
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Autoriser l'affichage des bannières.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={adSettings.show_banner}
                    onChange={(event) =>
                      setAdSettings((prev) => ({
                        ...prev,
                        show_banner:
                          event.target.checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div>
                    <p className="font-semibold">
                      Push
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Autoriser les publicités push.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={adSettings.show_push}
                    onChange={(event) =>
                      setAdSettings((prev) => ({
                        ...prev,
                        show_push:
                          event.target.checked,
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {shareModalOpen && selectedBoost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>
                  Publicité prête à être partagée
                </CardTitle>

                <CardDescription>
                  Félicitations ! Le produit est prêt à être
                  partagé dans plusieurs groupes WhatsApp,
                  Facebook et Telegram.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="rounded-lg border p-4">
                  <p className="mb-2 font-semibold">
                    Message de partage
                  </p>

                  <textarea
                    className="min-h-[260px] w-full rounded-md border bg-background p-3 text-sm"
                    value={shareMessage}
                    onChange={(event) =>
                      setShareMessage(event.target.value)
                    }
                  />

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={copyShareMessage}
                    >
                      Copier le message
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold">
                    Groupes disponibles
                  </h3>

                  <div className="space-y-2">
                    {groups
                      .filter(
                        (group) =>
                          group.is_active,
                      )
                      .map((group) => (
                        <div
                          key={group.id}
                          className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-medium">
                              {group.name}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {group.platform}
                            </p>
                          </div>

                          <Button
                            size="sm"
                            onClick={() =>
                              shareToGroup(group)
                            }
                          >
                            Ouvrir et partager
                          </Button>
                        </div>
                      ))}

                    {groups.filter(
                      (group) =>
                        group.is_active,
                    ).length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Aucun groupe actif. Ajoutez d'abord
                        vos groupes dans la section « Groupes ».
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={closeShareModal}
                  >
                    Fermer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}