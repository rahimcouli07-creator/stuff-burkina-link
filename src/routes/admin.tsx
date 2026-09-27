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
        loadAdmin(data.session.user.id, data.session.user.email ?? "");
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

  async function loadAdmin(userId: string, userEmail: string) {
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
    const [ads, services, users, visits] = await Promise.all([
      supabase.from("ads").select("id", { count: "exact", head: true }),
      supabase
        .from("services")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("app_visits")
        .select("visit_date,visitor_id")
        .order("visit_date", { ascending: false }),
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
      .order("created_at", { ascending: false });

    if (!error) {
      setGroups((data ?? []) as Group[]);
    }
  }

  async function loadSettings() {
    const [app, ads] = await Promise.all([
      supabase.from("app_settings").select("*").eq("id", "main").maybeSingle(),
      supabase.from("ad_settings").select("*").eq("id", "main").maybeSingle(),
    ]);

    if (app.data) {
      setShowSold(Boolean(app.data.show_sold_products));
    }

    if (ads.data) {
      setMonetag(Boolean(ads.data.monetag_enabled));
      setAdsterra(Boolean(ads.data.adsterra_enabled));
      setPopup(Boolean(ads.data.show_popup));
      setBanner(Boolean(ads.data.show_banner));
      setPush(Boolean(ads.data.show_push));
    }
  }

  async function loadSubAdmins() {
    const { data } = await supabase
      .from("admin_users")
      .select("*")
      .order("created_at", { ascending: false });

    setSubAdmins(data ?? []);
  }

  async function loadBoostedAds() {
    const { data, error } = await supabase
      .from("ad_boosts")
      .select(
        "id,ad_id,user_id,plan,status,starts_at,ends_at,created_at",
      )
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

    const { data: ads } = await supabase
      .from("ads")
      .select(
        "id,title,price,location,whatsapp_phone,photo_urls,reference",
      )
      .in("id", ids);

    const merged = data.map((boost) => ({
      ...boost,
      ad: ads?.find((ad) => ad.id === boost.ad_id) ?? null,
    }));

    setBoostedAds(merged);
  }

  async function login() {
    if (!email || !password) {
      toast.error("Remplis l'email et le mot de passe.");
      return;
    }

    try {
      setLoginLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.session) {
        setSession(data.session);
        await loadAdmin(data.session.user.id, data.session.user.email ?? "");
      }
    } finally {
      setLoginLoading(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
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
    field:
      | "monetag_enabled"
      | "adsterra_enabled"
      | "show_popup"
      | "show_banner"
      | "show_push",
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
    toast.success("Sous-admin ajouté.");
  }

  async function deleteSubAdmin(id: string) {
    if (id === admin?.id) {
      toast.error("Vous ne pouvez pas supprimer votre propre compte.");
      return;
    }

    if (!confirm("Supprimer ce sous-admin ?")) return;

    const { error } = await supabase
      .from("admin_users")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    await loadSubAdmins();
  }

  const activeGroups = useMemo(
    () => groups.filter((group) => group.is_active),
    [groups],
  );

  const uniqueVisitors = useMemo(() => {
    return new Set(visits.map((visit) => visit.visitor_id)).size;
  }, [visits]);

  function buildShareMessage(boost: any) {
    const ad = boost.ad;

    const productUrl = `${APP_URL}/annonce/${ad?.id ?? boost.ad_id}`;

    return `🛍️ NOUVEAU PRODUIT SUR STUFF MARKET

📦 Produit : ${ad?.title ?? "Produit"}
💰 Prix : ${ad?.price != null ? `${ad.price} FCFA` : "À négocier"}
📍 Localisation : ${ad?.location ?? "Burkina Faso"}

Découvrez cette annonce sur Stuff Market.

🔗 Voir le produit :
${productUrl}

🌐 Accéder à Stuff Market :
${APP_URL}`;
  }

  async function shareBoost(boost: any) {
    const message = buildShareMessage(boost);

    try {
      await navigator.clipboard.writeText(message);
    } catch {
      // Le navigateur peut refuser le presse-papiers.
    }

    setSelectedBoost({
      ...boost,
      message,
    });
  }

  function openGroup(group: Group) {
    window.open(group.url, "_blank", "noopener,noreferrer");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-10 text-white">
        Chargement de l'administration...
      </div>
    );
  }

  if (!session || !admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-white shadow-2xl backdrop-blur">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-400">
              Stuff Market
            </p>
            <h1 className="mt-3 text-3xl font-bold">
              Administration
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Connectez-vous pour accéder au tableau de bord.
            </p>
          </div>

          <div className="space-y-4">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email administrateur"
              type="email"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-blue-500"
            />

            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              type="password"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-blue-500"
            />

            <button
              onClick={login}
              disabled={loginLoading}
              className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {loginLoading ? "Connexion..." : "Se connecter"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const menu = [
    ["dashboard", "Tableau de bord"],
    ["ads", "Annonces"],
    ["troc", "Troc"],
    ["services", "Services"],
    ["users", "Utilisateurs"],
    ["sold", "Produits vendus"],
    ["advertising", "Publicité"],
    ["boosts", "Produits boostés"],
    ["groups", "Groupes de partage"],
    ["admins", "Sous-administrateurs"],
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="w-full border-b border-white/10 bg-[#0b1020] p-4 lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-400">
              Stuff Market
            </p>

            <h1 className="mt-2 text-2xl font-bold">
              Admin Center
            </h1>
          </div>

          <nav className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            {menu.map(([id, label]) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                  activeSection === id
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <button
            onClick={logout}
            className="mt-6 w-full rounded-xl border border-red-500/20 px-4 py-3 text-left text-sm text-red-300 hover:bg-red-500/10"
          >
            Se déconnecter
          </button>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="text-sm text-blue-400">
                  Administration
                </p>

                <h2 className="mt-1 text-3xl font-bold">
                  {menu.find((item) => item[0] === activeSection)?.[1]}
                </h2>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                <span className="text-slate-400">Connecté :</span>{" "}
                {admin.email}
              </div>
            </div>

            {activeSection === "dashboard" && (
              <section>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Annonces", adsCount],
                    ["Services", servicesCount],
                    ["Utilisateurs", usersCount],
                    ["Visiteurs uniques", uniqueVisitors],
                  ].map(([label, value]) => (
                    <div
                      key={String(label)}
                      className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl"
                    >
                      <p className="text-sm text-slate-400">{label}</p>
                      <p className="mt-3 text-4xl font-bold">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
                  <h3 className="text-xl font-semibold">
                    Visites de l'application
                  </h3>

                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-slate-400">
                        <tr>
                          <th className="pb-3">Date</th>
                          <th className="pb-3">Visiteurs</th>
                        </tr>
                      </thead>

                      <tbody>
                        {Array.from(
                          visits.reduce((map, visit) => {
                            map.set(
                              visit.visit_date,
                              (map.get(visit.visit_date) ?? 0) + 1,
                            );
                            return map;
                          }, new Map<string, number>()),
                        )
                          .slice(0, 20)
                          .map(([date, count]) => (
                            <tr
                              key={date}
                              className="border-t border-white/5"
                            >
                              <td className="py-3">{date}</td>
                              <td className="py-3">{count}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {activeSection === "ads" && (
              <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-xl font-semibold">
                  Gestion des annonces
                </h3>

                <p className="mt-2 text-slate-400">
                  {adsCount} annonce(s) actuellement enregistrée(s).
                </p>

                <p className="mt-6 text-sm text-slate-500">
                  Les actions détaillées sur les annonces pourront être
                  ajoutées ici sans modifier le reste du tableau de bord.
                </p>
              </section>
            )}

            {activeSection === "troc" && (
              <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-xl font-semibold">
                  Gestion du troc
                </h3>

                <p className="mt-2 text-slate-400">
                  Les annonces ayant activé « J'accepte le troc » utilisent
                  le champ <code>trade_enabled</code>.
                </p>
              </section>
            )}

            {activeSection === "services" && (
              <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-xl font-semibold">
                  Gestion des services
                </h3>

                <p className="mt-2 text-slate-400">
                  {servicesCount} service(s) enregistré(s).
                </p>
              </section>
            )}

            {activeSection === "users" && (
              <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-xl font-semibold">
                  Utilisateurs
                </h3>

                <p className="mt-2 text-slate-400">
                  {usersCount} utilisateur(s) enregistré(s).
                </p>
              </section>
            )}

            {activeSection === "sold" && (
   