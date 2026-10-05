import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRightLeft,
  BarChart3,
  Bell,
  Building2,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Home,
  Megaphone,
  Package,
  RefreshCw,
  Settings,
  Shield,
  ShoppingBag,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type ChartPoint = { label: string; value: number };
type Region = { id: string; name: string };
type Province = { id: string; name: string; region_id: string };
type Group = {
  id: string;
  name: string;
  platform: string;
  url: string;
  is_active: boolean;
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
  status: string | null;
  trade_enabled: boolean;
  allow_negotiation: boolean;
  created_at: string;
  updated_at?: string;
  country?: string | null;
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
  status: string | null;
  allow_negotiation: boolean;
  created_at: string;
  updated_at?: string;
  country?: string | null;
};
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
type BoostRequestRow = {
  id: string;
  ad_id: string;
  user_id: string;
  plan_id: string;
  status: string;
  requested_at: string;
  notes: string | null;
  ad: AdRow | null;
};
type AdminProfile = {
  id: string;
  email: string;
  role: string;
  country?: string | null;
  region_id?: string | null;
  can_manage_ads?: boolean;
  can_manage_offers?: boolean;
  can_manage_users?: boolean;
  view_ads?: boolean;
  create_ads?: boolean;
  edit_ads?: boolean;
  delete_ads?: boolean;
  change_ad_status?: boolean;
  manage_boosts?: boolean;
  view_users?: boolean;
  edit_users?: boolean;
  suspend_users?: boolean;
  view_services?: boolean;
  edit_services?: boolean;
  delete_services?: boolean;
  view_followup?: boolean;
  view_stats?: boolean;
  manage_reports?: boolean;
};
type PermissionKey =
  | "view_ads"
  | "create_ads"
  | "edit_ads"
  | "delete_ads"
  | "change_ad_status"
  | "manage_boosts"
  | "view_users"
  | "edit_users"
  | "suspend_users"
  | "view_services"
  | "edit_services"
  | "delete_services"
  | "view_followup"
  | "view_stats"
  | "manage_reports";

const COUNTRIES = [
  "Burkina Faso",
  "Côte d’Ivoire",
  "Mali",
  "Niger",
  "Sénégal",
  "Togo",
  "Bénin",
  "Ghana",
  "Nigeria",
  "France",
  "Autre",
];

const PERMISSIONS: Array<{ key: PermissionKey; label: string; group: string }> = [
  { key: "view_ads", label: "Voir les annonces", group: "Annonces" },
  { key: "create_ads", label: "Créer des annonces", group: "Annonces" },
  { key: "edit_ads", label: "Modifier les annonces", group: "Annonces" },
  { key: "delete_ads", label: "Supprimer les annonces", group: "Annonces" },
  { key: "change_ad_status", label: "Changer le statut des annonces", group: "Annonces" },
  { key: "manage_boosts", label: "Gérer les boosts", group: "Annonces" },
  { key: "view_users", label: "Voir les utilisateurs", group: "Utilisateurs" },
  { key: "edit_users", label: "Modifier les utilisateurs", group: "Utilisateurs" },
  { key: "suspend_users", label: "Suspendre les utilisateurs", group: "Utilisateurs" },
  { key: "view_services", label: "Voir les services", group: "Services" },
  { key: "edit_services", label: "Modifier les services", group: "Services" },
  { key: "delete_services", label: "Supprimer les services", group: "Services" },
  { key: "view_followup", label: "Voir notifications et activités", group: "Suivi" },
  { key: "view_stats", label: "Voir le tableau de bord et les statistiques", group: "Suivi" },
  { key: "manage_reports", label: "Gérer les signalements", group: "Suivi" },
];

const DEFAULT_PERMISSIONS: Record<PermissionKey, boolean> = {
  view_ads: true,
  create_ads: true,
  edit_ads: true,
  delete_ads: false,
  change_ad_status: true,
  manage_boosts: true,
  view_users: true,
  edit_users: false,
  suspend_users: false,
  view_services: true,
  edit_services: true,
  delete_services: false,
  view_followup: true,
  view_stats: true,
  manage_reports: false,
};

const db = supabase as any;

function buildMonthlyChart(dates: string[]): ChartPoint[] {
  const now = new Date();
  const buckets = new Map<string, { label: string; value: number }>();

  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date
      .toLocaleDateString("fr-FR", { month: "short" })
      .replace(".", "");
    buckets.set(key, { label, value: 0 });
  }

  for (const raw of dates) {
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.value += 1;
  }

  return Array.from(buckets.values());
}

function LineChart({
  title,
  description,
  data,
}: {
  title: string;
  description: string;
  data: ChartPoint[];
}) {
  const width = 760;
  const height = 230;
  const padX = 32;
  const padY = 30;
  const max = Math.max(1, ...data.map((point) => point.value));
  const points = data.map((point, index) => ({
    ...point,
    x: padX + (index * (width - padX * 2)) / Math.max(1, data.length - 1),
    y: height - padY - (point.value / max) * (height - padY * 2),
  }));
  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        <span className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-500">
          12 mois
        </span>
      </div>
      <div className="overflow-hidden rounded-2xl bg-slate-50 p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-56 w-full"
          role="img"
          aria-label={title}
        >
          <line
            x1={padX}
            y1={height - padY}
            x2={width - padX}
            y2={height - padY}
            stroke="currentColor"
            opacity="0.12"
          />
          <line
            x1={padX}
            y1={padY}
            x2={padX}
            y2={height - padY}
            stroke="currentColor"
            opacity="0.12"
          />
          {path && (
            <path
              d={path}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
            />
          )}
          {points.map((point) => (
            <g key={`${point.label}-${point.x}`}>
              <circle cx={point.x} cy={point.y} r="4" fill="currentColor" />
              <text
                x={point.x}
                y={height - 8}
                textAnchor="middle"
                fontSize="10"
                fill="currentColor"
                opacity="0.55"
              >
                {point.label}
              </text>
              <text
                x={point.x}
                y={point.y - 9}
                textAnchor="middle"
                fontSize="10"
                fill="currentColor"
                opacity="0.7"
              >
                {point.value}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [ads, setAds] = useState<AdRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [businessesCount, setBusinessesCount] = useState(0);
  const [boostsCount, setBoostsCount] = useState(0);
  const [boostRequestsCount, setBoostRequestsCount] = useState(0);
  const [visits, setVisits] = useState<any[]>([]);
  const [usersCount, setUsersCount] = useState(0);
  const [adsCount, setAdsCount] = useState(0);
  const [servicesCount, setServicesCount] = useState(0);
  const [soldCount, setSoldCount] = useState(0);

  const [userChart, setUserChart] = useState<ChartPoint[]>([]);
  const [adsChart, setAdsChart] = useState<ChartPoint[]>([]);
  const [soldChart, setSoldChart] = useState<ChartPoint[]>([]);
  const [categoryStats, setCategoryStats] = useState<Array<{ name: string; count: number }>>([]);
  const [activities, setActivities] = useState<Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    created_at: string;
  }>>([]);

  const [regions, setRegions] = useState<Region[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [boostedAds, setBoostedAds] = useState<BoostRow[]>([]);
  const [boostRequests, setBoostRequests] = useState<BoostRequestRow[]>([]);
  const [selectedBoost, setSelectedBoost] = useState<BoostRow | null>(null);

  const [showSold, setShowSold] = useState(false);
  const [adSettings, setAdSettings] = useState<Record<string, any>>({});

  const [searchAds, setSearchAds] = useState("");
  const [searchServices, setSearchServices] = useState("");
  const [searchUsers, setSearchUsers] = useState("");
  const [searchReports, setSearchReports] = useState("");

  const [groupName, setGroupName] = useState("");
  const [groupPlatform, setGroupPlatform] = useState("whatsapp");
  const [groupUrl, setGroupUrl] = useState("");

  const [subAdmins, setSubAdmins] = useState<AdminProfile[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminId, setNewAdminId] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<
    "admin" | "country_admin" | "country_regional_admin"
  >("admin");
  const [newAdminCountry, setNewAdminCountry] = useState("Burkina Faso");
  const [newAdminRegionId, setNewAdminRegionId] = useState("");
  const [newPermissions, setNewPermissions] = useState<Record<PermissionKey, boolean>>(
    DEFAULT_PERMISSIONS,
  );

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

  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedCountryFilter, setSelectedCountryFilter] = useState("");
  const [selectedRegionFilter, setSelectedRegionFilter] = useState("");

  const isSuperAdmin = admin?.role === "super_admin";
  const isCountryAdmin =
    admin?.role === "country_admin" || admin?.role === "country_regional_admin";
  const isRegionalAdmin =
    admin?.role === "country_regional_admin" || admin?.role === "regional_admin";

  function can(permission: PermissionKey) {
    if (!admin) return false;
    if (admin.role === "super_admin") return true;
    const direct = admin[permission];
    if (typeof direct === "boolean") return direct;
    if (permission === "view_ads" || permission === "create_ads" || permission === "edit_ads" || permission === "change_ad_status" || permission === "delete_ads") {
      return Boolean(admin.can_manage_ads);
    }
    if (permission === "view_services" || permission === "edit_services" || permission === "delete_services") {
      return Boolean(admin.can_manage_offers);
    }
    if (permission === "view_users" || permission === "edit_users" || permission === "suspend_users") {
      return Boolean(admin.can_manage_users);
    }
    return false;
  }

  function requirePermission(permission: PermissionKey) {
    if (can(permission)) return true;
    toast.error("Vous n'avez pas la permission nécessaire.");
    return false;
  }

  function roleScopeLabel() {
    if (!admin) return "";
    if (admin.role === "super_admin") return "Tous les pays";
    if (admin.role === "country_regional_admin" || admin.role === "regional_admin") {
      const region = regions.find((item) => item.id === admin.region_id);
      return `${admin.country || "Pays non défini"}${region ? ` • ${region.name}` : ""}`;
    }
    if (admin.role === "country_admin") return admin.country || "Pays non défini";
    return "Périmètre général";
  }

  async function getScopedUserIds(): Promise<string[] | null> {
    if (!admin || admin.role === "super_admin") return null;

    let query = db.from("profiles").select("id");
    if (admin.country) query = query.eq("country", admin.country);
    if (isRegionalAdmin && admin.region_id) {
      query = query.eq("region_id", admin.region_id);
    }
    const { data, error } = await query;
    if (error) {
      // Older schemas may not have profiles.country yet; region filtering still works.
      let fallback = db.from("profiles").select("id");
      if (isRegionalAdmin && admin.region_id) fallback = fallback.eq("region_id", admin.region_id);
      const fallbackResult = await fallback;
      if (fallbackResult.error) {
        toast.error(`Impossible de déterminer le périmètre : ${fallbackResult.error.message}`);
        return [];
      }
      return (fallbackResult.data ?? []).map((row: any) => row.id);
    }
    return (data ?? []).map((row: any) => row.id);
  }

  async function applyScope(query: any, table: string) {
    if (!admin || admin.role === "super_admin") return query;

    // Country is applied directly to the target table whenever the column exists.
    if (admin.country) {
      const probe = await db.from(table).select("country").limit(1);
      if (!probe.error) query = query.eq("country", admin.country);
      else {
        const ids = await getScopedUserIds();
        if (ids) query = ids.length ? query.in("user_id", ids) : query.eq("id", "__no_scope__");
        return query;
      }
    }

    if (isRegionalAdmin && admin.region_id) {
      const ids = await getScopedUserIds();
      query = ids?.length ? query.in("user_id", ids) : query.eq("id", "__no_scope__");
    }

    return query;
  }

  async function loadAdmin(userId: string) {
    setLoading(true);
    const rpcResult = await db.rpc("get_my_admin_profile");
    const rpcProfile = Array.isArray(rpcResult.data) ? rpcResult.data[0] : rpcResult.data;
    const direct = await db.from("admin_users").select("*").eq("id", userId).maybeSingle();
    const profile = direct.data ?? rpcProfile;

    if (direct.error && !rpcProfile) {
      setAdmin(null);
      setLoading(false);
      return;
    }
    if (!profile || profile.id !== userId) {
      setAdmin(null);
      setLoading(false);
      return;
    }

    setAdmin(profile as AdminProfile);
    await loadAll(profile as AdminProfile);
    setLoading(false);
  }

  async function loadAll(currentAdmin = admin) {
    if (!currentAdmin) return;
    await Promise.all([
      loadDashboard(currentAdmin),
      loadAds(currentAdmin),
      loadServices(currentAdmin),
      loadUsers(currentAdmin),
      loadBusinesses(currentAdmin),
      loadGroups(),
      loadLocations(),
      loadSettings(),
      loadBoostedAds(currentAdmin),
      loadBoostRequests(currentAdmin),
      loadNotifications(currentAdmin),
      loadReports(currentAdmin),
      loadSubAdmins(currentAdmin),
    ]);
  }

  async function refreshAll() {
    if (!admin) return;
    setRefreshing(true);
    try {
      await loadAll(admin);
      toast.success("Données actualisées depuis Supabase.");
    } finally {
      setRefreshing(false);
    }
  }

  async function loadLocations() {
    const [r, p] = await Promise.all([
      db.from("regions").select("id,name").order("name"),
      db.from("provinces").select("id,name,region_id").order("name"),
    ]);
    setRegions((r.data ?? []) as Region[]);
    setProvinces((p.data ?? []) as Province[]);
  }

  async function loadDashboard(currentAdmin: AdminProfile) {
    if (!canFor(currentAdmin, "view_stats")) return;

    let adsQuery = db.from("ads").select("id,category,status,created_at,updated_at,title,user_id");
    adsQuery = await applyScopeFor(currentAdmin, adsQuery, "ads");
    let servicesQuery = db.from("services").select("id,created_at,user_id");
    servicesQuery = await applyScopeFor(currentAdmin, servicesQuery, "services");
    let usersQuery = db.from("profiles").select("id,created_at");
    usersQuery = await applyScopeFor(currentAdmin, usersQuery, "profiles");
    let businessesQuery = db.from("businesses").select("id,created_at,user_id");
    businessesQuery = await applyScopeFor(currentAdmin, businessesQuery, "businesses");
    let boostsQuery = db.from("ad_boosts").select("id,created_at,ad_id,user_id,status");
    boostsQuery = await applyScopeFor(currentAdmin, boostsQuery, "ad_boosts");
    let requestsQuery = db.from("boost_requests").select("id,requested_at,ad_id,user_id,status");
    requestsQuery = await applyScopeFor(currentAdmin, requestsQuery, "boost_requests");
    let visitsQuery = db.from("app_visits").select("visit_date,visitor_id,user_id").eq(
      "visit_date",
      new Date().toISOString().slice(0, 10),
    );
    visitsQuery = await applyScopeFor(currentAdmin, visitsQuery, "app_visits");

    const [adsResult, servicesResult, usersResult, businessesResult, boostsResult, requestsResult, visitsResult] =
      await Promise.all([
        adsQuery,
        servicesQuery,
        usersQuery,
        businessesQuery,
        boostsQuery,
        requestsQuery,
        visitsQuery,
      ]);

    const adsData = adsResult.data ?? [];
    const servicesData = servicesResult.data ?? [];
    const usersData = usersResult.data ?? [];
    const businessesData = businessesResult.data ?? [];
    const boostsData = boostsResult.data ?? [];
    const requestsData = requestsResult.data ?? [];

    setAdsCount(adsData.length);
    setServicesCount(servicesData.length);
    setUsersCount(usersData.length);
    setBusinessesCount(businessesData.length);
    setBoostsCount(boostsData.filter((row: any) => row.status === "active").length);
    setBoostRequestsCount(requestsData.filter((row: any) => row.status === "pending").length);
    setSoldCount(adsData.filter((row: any) => row.status === "sold").length);
    setVisits(visitsResult.data ?? []);

    // Historiques séparés pour conserver les 12 mois complets, avec le même périmètre.
    let profilesHistoryQuery = db.from("profiles").select("created_at");
    profilesHistoryQuery = await applyScopeFor(currentAdmin, profilesHistoryQuery, "profiles");
    let adsHistoryQuery = db.from("ads").select("created_at");
    adsHistoryQuery = await applyScopeFor(currentAdmin, adsHistoryQuery, "ads");
    let soldHistoryQuery = db.from("ads").select("status,created_at,updated_at").eq("status", "sold");
    soldHistoryQuery = await applyScopeFor(currentAdmin, soldHistoryQuery, "ads");

    const [profilesHistory, adsHistory, soldHistory] = await Promise.all([
      profilesHistoryQuery,
      adsHistoryQuery,
      soldHistoryQuery,
    ]);

    setUserChart(
      buildMonthlyChart((profilesHistory.data ?? []).map((row: any) => row.created_at)),
    );
    setAdsChart(
      buildMonthlyChart((adsHistory.data ?? []).map((row: any) => row.created_at)),
    );
    setSoldChart(
      buildMonthlyChart(
        (soldHistory.data ?? []).map((row: any) => row.updated_at || row.created_at),
      ),
    );

    const categoryMap = new Map<string, number>();
    for (const row of adsData) {
      const category = String(row.category ?? "Autres").trim() || "Autres";
      categoryMap.set(category, (categoryMap.get(category) ?? 0) + 1);
    }
    setCategoryStats(
      Array.from(categoryMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    );

    await loadActivities(currentAdmin);
  }

  async function loadActivities(currentAdmin: AdminProfile) {
    if (!canFor(currentAdmin, "view_followup")) return;
    const activities: Array<{
      id: string;
      title: string;
      description: string;
      type: string;
      created_at: string;
    }> = [];

    let profilesQuery = db.from("profiles").select("id,stuff_id,created_at").order("created_at", { ascending: false }).limit(15);
    profilesQuery = await applyScopeFor(currentAdmin, profilesQuery, "profiles");
    let adsQuery = db.from("ads").select("id,title,status,created_at,updated_at,user_id").order("created_at", { ascending: false }).limit(15);
    adsQuery = await applyScopeFor(currentAdmin, adsQuery, "ads");
    let servicesQuery = db.from("services").select("id,title,created_at,status,user_id").order("created_at", { ascending: false }).limit(15);
    servicesQuery = await applyScopeFor(currentAdmin, servicesQuery, "services");
    let businessesQuery = db.from("businesses").select("id,name,created_at,status,user_id").order("created_at", { ascending: false }).limit(15);
    businessesQuery = await applyScopeFor(currentAdmin, businessesQuery, "businesses");
    let boostsQuery = db.from("ad_boosts").select("id,plan,status,created_at,user_id").order("created_at", { ascending: false }).limit(15);
    boostsQuery = await applyScopeFor(currentAdmin, boostsQuery, "ad_boosts");
    let notificationsQuery = db.from("notifications").select("id,title,message,type,created_at,user_id").order("created_at", { ascending: false }).limit(15);
    notificationsQuery = await applyScopeFor(currentAdmin, notificationsQuery, "notifications");

    const [p, a, s, b, boosts, n] = await Promise.all([
      profilesQuery,
      adsQuery,
      servicesQuery,
      businessesQuery,
      boostsQuery,
      notificationsQuery,
    ]);

    (p.data ?? []).forEach((row: any) =>
      activities.push({
        id: `profile-${row.id}`,
        title: "Nouvel utilisateur",
        description: row.stuff_id ? `Stuff ID ${row.stuff_id}` : "Compte créé",
        type: "Utilisateurs",
        created_at: row.created_at,
      }),
    );
    (a.data ?? []).forEach((row: any) =>
      activities.push({
        id: `ad-${row.id}`,
        title: row.status === "sold" ? "Produit vendu" : "Nouvelle annonce",
        description: row.title || "Annonce",
        type: row.status === "sold" ? "Ventes" : "Annonces",
        created_at: row.status === "sold" ? row.updated_at || row.created_at : row.created_at,
      }),
    );
    (s.data ?? []).forEach((row: any) =>
      activities.push({
        id: `service-${row.id}`,
        title: "Nouveau service",
        description: row.title || "Service",
        type: "Services",
        created_at: row.created_at,
      }),
    );
    (b.data ?? []).forEach((row: any) =>
      activities.push({
        id: `business-${row.id}`,
        title: "Nouvelle boutique",
        description: row.name || "Boutique",
        type: "Boutiques",
        created_at: row.created_at,
      }),
    );
    (boosts.data ?? []).forEach((row: any) =>
      activities.push({
        id: `boost-${row.id}`,
        title: row.status === "active" ? "Boost actif" : "Boost enregistré",
        description: `Formule ${row.plan || "non précisée"}`,
        type: "Boosts",
        created_at: row.created_at,
      }),
    );
    (n.data ?? []).forEach((row: any) =>
      activities.push({
        id: `notification-${row.id}`,
        title: row.title || "Notification",
        description: row.message || "Notification enregistrée",
        type: row.type || "Notifications",
        created_at: row.created_at,
      }),
    );

    activities.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    setActivities(activities.slice(0, 30));
  }

  function canFor(currentAdmin: AdminProfile, permission: PermissionKey) {
    if (currentAdmin.role === "super_admin") return true;
    const direct = currentAdmin[permission];
    if (typeof direct === "boolean") return direct;
    if (
      permission === "view_ads" ||
      permission === "create_ads" ||
      permission === "edit_ads" ||
      permission === "delete_ads" ||
      permission === "change_ad_status"
    ) return Boolean(currentAdmin.can_manage_ads);
    if (
      permission === "view_services" ||
      permission === "edit_services" ||
      permission === "delete_services"
    ) return Boolean(currentAdmin.can_manage_offers);
    if (
      permission === "view_users" ||
      permission === "edit_users" ||
      permission === "suspend_users"
    ) return Boolean(currentAdmin.can_manage_users);
    return false;
  }

  async function applyScopeFor(currentAdmin: AdminProfile, query: any, table: string) {
    if (!currentAdmin || currentAdmin.role === "super_admin") return query;

    const regional =
      currentAdmin.role === "country_regional_admin" ||
      currentAdmin.role === "regional_admin";

    // Prefer a direct country filter on the target table.
    if (currentAdmin.country) {
      const targetProbe = await db.from(table).select("country").limit(1);
      if (!targetProbe.error) {
        query = query.eq("country", currentAdmin.country);
      } else {
        // Fallback: scope through the owner's profile if the target table has no country column.
        let idsQuery = db.from("profiles").select("id");
        const profileCountryProbe = await db.from("profiles").select("country").limit(1);
        if (!profileCountryProbe.error) {
          idsQuery = idsQuery.eq("country", currentAdmin.country);
        }
        if (regional && currentAdmin.region_id) {
          idsQuery = idsQuery.eq("region_id", currentAdmin.region_id);
        }
        const idsResult = await idsQuery;
        const ids = (idsResult.data ?? []).map((row: any) => row.id);
        return ids.length ? query.in(table === "profiles" ? "id" : "user_id", ids) : query.eq("id", "__no_scope__");
      }
    }

    // A regional admin is always restricted to users in the selected region.
    if (regional && currentAdmin.region_id) {
      let idsQuery = db.from("profiles").select("id").eq("region_id", currentAdmin.region_id);
      if (currentAdmin.country) {
        const profileCountryProbe = await db.from("profiles").select("country").limit(1);
        if (!profileCountryProbe.error) {
          idsQuery = idsQuery.eq("country", currentAdmin.country);
        }
      }
      const idsResult = await idsQuery;
      const ids = (idsResult.data ?? []).map((row: any) => row.id);
      return ids.length ? query.in(table === "profiles" ? "id" : "user_id", ids) : query.eq("id", "__no_scope__");
    }

    return query;
  }

  async function loadAds(currentAdmin: AdminProfile) {
    if (!canFor(currentAdmin, "view_ads")) {
      setAds([]);
      return;
    }
    let query = db.from("ads").select("*").order("created_at", { ascending: false });
    query = await applyScopeFor(currentAdmin, query, "ads");
    const { data, error } = await query;
    if (error) {
      toast.error(`Erreur annonces : ${error.message}`);
      return;
    }
    setAds((data ?? []) as AdRow[]);
  }

  async function loadServices(currentAdmin: AdminProfile) {
    if (!canFor(currentAdmin, "view_services")) {
      setServices([]);
      return;
    }
    let query = db.from("services").select("*").order("created_at", { ascending: false });
    query = await applyScopeFor(currentAdmin, query, "services");
    const { data, error } = await query;
    if (error) {
      toast.error(`Erreur services : ${error.message}`);
      return;
    }
    setServices((data ?? []) as ServiceRow[]);
  }

  async function loadUsers(currentAdmin: AdminProfile) {
    if (!canFor(currentAdmin, "view_users")) {
      setUsers([]);
      return;
    }
    let query = db.from("profiles").select("*").order("created_at", { ascending: false });
    query = await applyScopeFor(currentAdmin, query, "profiles");
    const { data } = await query;
    setUsers(data ?? []);
  }

  async function loadBusinesses(currentAdmin: AdminProfile) {
    let query = db.from("businesses").select("id,user_id,name,status,created_at");
    query = await applyScopeFor(currentAdmin, query, "businesses");
    const { data, error } = await query;
    setBusinessesCount(error ? 0 : (data ?? []).length);
  }

  async function loadNotifications(currentAdmin: AdminProfile) {
    if (!canFor(currentAdmin, "view_followup")) {
      setNotifications([]);
      return;
    }
    let query = db.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
    query = await applyScopeFor(currentAdmin, query, "notifications");
    const { data } = await query;
    setNotifications(data ?? []);
  }

  async function loadReports(currentAdmin: AdminProfile) {
    if (!canFor(currentAdmin, "view_followup")) {
      setReports([]);
      return;
    }
    let query = db.from("reports").select("*").order("created_at", { ascending: false }).limit(50);
    query = await applyScopeFor(currentAdmin, query, "reports");
    const { data } = await query;
    setReports(data ?? []);
  }

  async function loadGroups() {
    const { data } = await db.from("promotion_groups").select("*").order("created_at", { ascending: false });
    setGroups((data ?? []) as Group[]);
  }

  async function loadSettings() {
    const [app, adsSetting] = await Promise.all([
      db.from("app_settings").select("*").eq("id", "main").maybeSingle(),
      db.from("ad_settings").select("*").eq("id", "main").maybeSingle(),
    ]);
    if (app.data) setShowSold(Boolean(app.data.show_sold_products));
    if (adsSetting.data) setAdSettings(adsSetting.data);
  }

  async function loadBoostedAds(currentAdmin: AdminProfile) {
    if (!canFor(currentAdmin, "manage_boosts")) {
      setBoostedAds([]);
      return;
    }
    let query = db.from("ad_boosts").select("*").eq("status", "active").order("created_at", { ascending: false });
    query = await applyScopeFor(currentAdmin, query, "ad_boosts");
    const { data, error } = await query;
    if (error || !data) {
      setBoostedAds([]);
      return;
    }
    const ids = data.map((row: any) => row.ad_id).filter(Boolean);
    if (!ids.length) {
      setBoostedAds([]);
      return;
    }
    let adsQuery = db.from("ads").select("*").in("id", ids);
    adsQuery = await applyScopeFor(currentAdmin, adsQuery, "ads");
    const adsResult = await adsQuery;
    setBoostedAds(
      data.map((boost: any) => ({
        ...boost,
        ad: (adsResult.data ?? []).find((ad: any) => ad.id === boost.ad_id) ?? null,
      })),
    );
  }

  async function loadBoostRequests(currentAdmin: AdminProfile) {
    if (!canFor(currentAdmin, "manage_boosts")) {
      setBoostRequests([]);
      return;
    }
    let query = db.from("boost_requests").select("*").eq("status", "pending").order("requested_at", { ascending: false });
    query = await applyScopeFor(currentAdmin, query, "boost_requests");
    const { data, error } = await query;
    if (error || !data) {
      setBoostRequests([]);
      return;
    }
    const ids = data.map((row: any) => row.ad_id).filter(Boolean);
    if (!ids.length) {
      setBoostRequests(data);
      return;
    }
    let adsQuery = db.from("ads").select("*").in("id", ids);
    adsQuery = await applyScopeFor(currentAdmin, adsQuery, "ads");
    const adsResult = await adsQuery;
    setBoostRequests(
      data.map((request: any) => ({
        ...request,
        ad: (adsResult.data ?? []).find((ad: any) => ad.id === request.ad_id) ?? null,
      })),
    );
  }

  async function login() {
    if (!email.trim() || !password) {
      toast.error("Remplis l'email et le mot de passe.");
      return;
    }
    setLoginLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoginLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      setSession(data.session);
      await loadAdmin(data.session.user.id);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setAdmin(null);
  }

  async function markAdAsSold(id: string) {
    if (!requirePermission("change_ad_status")) return;
    const target = ads.find((ad) => ad.id === id);
    if (!target) return;
    let query = db.from("ads").update({ status: "sold" }).eq("id", id);
    query = await applyScopeFor(admin!, query, "ads");
    const { error } = await query;
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshAfterAction("Produit marqué comme vendu.");
  }

  async function restoreAd(id: string) {
    if (!requirePermission("change_ad_status")) return;
    let query = db.from("ads").update({ status: "available" }).eq("id", id);
    query = await applyScopeFor(admin!, query, "ads");
    const { error } = await query;
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshAfterAction("Produit remis en vente.");
  }

  async function deleteAd(id: string) {
    if (!requirePermission("delete_ads")) return;
    if (!confirm("Supprimer définitivement cette annonce ?")) return;
    let query = db.from("ads").delete().eq("id", id);
    query = await applyScopeFor(admin!, query, "ads");
    const { error } = await query;
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshAfterAction("Annonce supprimée.");
  }

  async function toggleServiceStatus(id: string, status: "available" | "unavailable") {
    if (!requirePermission("edit_services")) return;
    let query = db.from("services").update({ status }).eq("id", id);
    query = await applyScopeFor(admin!, query, "services");
    const { error } = await query;
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshAfterAction(status === "available" ? "Service activé." : "Service désactivé.");
  }

  async function deleteService(id: string) {
    if (!requirePermission("delete_services")) return;
    if (!confirm("Supprimer définitivement ce service ?")) return;
    let query = db.from("services").delete().eq("id", id);
    query = await applyScopeFor(admin!, query, "services");
    const { error } = await query;
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshAfterAction("Service supprimé.");
  }

  async function updateUser(id: string, patch: Record<string, unknown>) {
    if (!requirePermission("edit_users")) return;
    let query = db.from("profiles").update(patch).eq("id", id);
    query = await applyScopeFor(admin!, query, "profiles");
    const { error } = await query;
    if (error) {
      toast.error(error.message);
      return;
    }
    await loadUsers(admin!);
    toast.success("Utilisateur mis à jour.");
  }

  async function suspendUser(user: any, suspended: boolean) {
    if (!requirePermission("suspend_users")) return;
    let query = db.from("profiles").update({ is_suspended: suspended }).eq("id", user.id);
    query = await applyScopeFor(admin!, query, "profiles");
    const { error } = await query;
    if (error) {
      toast.error(error.message);
      return;
    }
    await loadUsers(admin!);
    setSelectedUser(null);
    toast.success(suspended ? "Utilisateur suspendu." : "Utilisateur réactivé.");
  }

  async function addGroup() {
    if (!isSuperAdmin) {
      toast.error("Seul le super administrateur peut gérer les groupes.");
      return;
    }
    if (!groupName.trim() || !groupUrl.trim()) {
      toast.error("Nom et lien obligatoires.");
      return;
    }
    const { error } = await db.from("promotion_groups").insert({
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
    if (!isSuperAdmin) return toast.error("Action réservée au super administrateur.");
    const { error } = await db.from("promotion_groups").update({ is_active: !group.is_active }).eq("id", group.id);
    if (error) return toast.error(error.message);
    await loadGroups();
  }

  async function deleteGroup(id: string) {
    if (!isSuperAdmin) return toast.error("Action réservée au super administrateur.");
    if (!confirm("Supprimer ce groupe ?")) return;
    const { error } = await db.from("promotion_groups").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await loadGroups();
  }

  async function saveAppSettings(value: boolean) {
    if (!isSuperAdmin) {
      toast.error("Action réservée au super administrateur.");
      return;
    }
    const { error } = await db.from("app_settings").update({ show_sold_products: value }).eq("id", "main");
    if (error) return toast.error(error.message);
    setShowSold(value);
    toast.success("Réglage enregistré.");
  }

  async function saveAdSetting(field: string, value: boolean | string) {
    if (!isSuperAdmin) {
      toast.error("Action réservée au super administrateur.");
      return;
    }
    const { error } = await db.from("ad_settings").update({ [field]: value }).eq("id", "main");
    if (error) return toast.error(error.message);
    setAdSettings((prev) => ({ ...prev, [field]: value }));
    toast.success("Réglage publicitaire enregistré.");
  }

  async function createServiceForProfessional() {
    if (!requirePermission("edit_services")) return;
    if (
      !serviceStuffId.trim() ||
      !serviceTitle.trim() ||
      !serviceDescription.trim() ||
      !serviceRegionId ||
      !serviceProvinceId ||
      !serviceLocation.trim() ||
      !serviceWhatsapp.trim()
    ) {
      toast.error("Renseigne le professionnel et toutes les informations obligatoires.");
      return;
    }
    setServiceSaving(true);
    try {
      const { data: professional, error: professionalError } = await db
        .from("profiles")
        .select("id,stuff_id")
        .eq("stuff_id", serviceStuffId.trim().toUpperCase())
        .maybeSingle();
      if (professionalError) throw professionalError;
      if (!professional?.id) throw new Error("Aucun utilisateur ne correspond à cet identifiant Stuff Market.");

      if (
        admin?.role !== "super_admin" &&
        admin?.country &&
        professional.country &&
        professional.country !== admin.country
      ) {
        throw new Error("Ce professionnel est hors du périmètre de cet administrateur.");
      }
      if (isRegionalAdmin && admin?.region_id && professional.region_id !== admin.region_id) {
        throw new Error("Ce professionnel est hors de la région autorisée.");
      }

      const regionName = regions.find((region) => region.id === serviceRegionId)?.name ?? "";
      const provinceName = provinces.find((province) => province.id === serviceProvinceId)?.name ?? "";
      const reference = `SRV-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const location = `Pays: ${admin?.country || "Burkina Faso"} | Région: ${regionName} | Province: ${provinceName} | Localisation: ${serviceLocation.trim()}`;

      const payload: Record<string, unknown> = {
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
      };
      if (admin?.country) payload.country = admin.country;

      const { error } = await db.from("services").insert(payload);
      if (error) throw error;

      setServiceStuffId("");
      setServiceTitle("");
      setServiceDescription("");
      setServicePrice("");
      setServiceRegionId("");
      setServiceProvinceId("");
      setServiceLocation("");
      setServiceWhatsapp("");
      await loadServices(admin!);
      await loadDashboard(admin!);
      toast.success("Service publié pour le professionnel.");
    } catch (error: any) {
      toast.error(error?.message || "Impossible de publier le service.");
    } finally {
      setServiceSaving(false);
    }
  }

  async function approveBoostRequest(request: BoostRequestRow) {
    if (!requirePermission("manage_boosts")) return;
    if (!request.ad) return;
    const durations: Record<string, number> = {
      free_36h: 36,
      "7_days": 168,
      "1_month": 720,
    };
    const duration = durations[request.plan_id];
    if (!duration) return toast.error("Formule de boost inconnue.");
    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + duration * 3600000);

    const { error: boostError } = await db.from("ad_boosts").insert({
      ad_id: request.ad_id,
      user_id: request.user_id,
      plan: request.plan_id,
      status: "active",
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
    });
    if (boostError) return toast.error(boostError.message);

    const { error } = await db
      .from("boost_requests")
      .update({
        status: "approved",
        processed_at: new Date().toISOString(),
        processed_by: session?.user?.id,
      })
      .eq("id", request.id);
    if (error) return toast.error(error.message);

    await refreshAfterAction("Boost activé.");
  }

  async function rejectBoostRequest(request: BoostRequestRow) {
    if (!requirePermission("manage_boosts")) return;
    const { error } = await db
      .from("boost_requests")
      .update({
        status: "rejected",
        processed_at: new Date().toISOString(),
        processed_by: session?.user?.id,
      })
      .eq("id", request.id);
    if (error) return toast.error(error.message);
    await refreshAfterAction("Demande de boost refusée.");
  }

  async function cancelBoost(id: string) {
    if (!requirePermission("manage_boosts")) return;
    const { error } = await db.from("ad_boosts").update({ status: "cancelled" }).eq("id", id);
    if (error) return toast.error(error.message);
    await refreshAfterAction("Boost désactivé.");
  }

  async function refreshAfterAction(message: string) {
    if (!admin) return;
    await loadAll(admin);
    toast.success(message);
  }

  async function addSubAdmin() {
    if (!isSuperAdmin) {
      toast.error("Seul le super administrateur peut créer des administrateurs.");
      return;
    }
    if (!newAdminEmail.trim() || !newAdminId.trim()) {
      toast.error("Email et ID utilisateur Auth obligatoires.");
      return;
    }
    if (newAdminRole !== "admin" && !newAdminCountry) {
      toast.error("Choisis un pays.");
      return;
    }
    if (newAdminRole === "country_regional_admin" && !newAdminRegionId) {
      toast.error("Choisis une région.");
      return;
    }

    const permissionPayload = Object.fromEntries(
      PERMISSIONS.map(({ key }) => [key, Boolean(newPermissions[key])]),
    );
    const payload = {
      id: newAdminId.trim(),
      email: newAdminEmail.trim(),
      role: newAdminRole,
      country: newAdminRole === "admin" ? null : newAdminCountry,
      region_id: newAdminRole === "country_regional_admin" ? newAdminRegionId : null,
      can_manage_ads: Boolean(newPermissions.view_ads || newPermissions.edit_ads || newPermissions.delete_ads),
      can_manage_offers: Boolean(newPermissions.view_services || newPermissions.edit_services || newPermissions.delete_services),
      can_manage_users: Boolean(newPermissions.view_users || newPermissions.edit_users || newPermissions.suspend_users),
      ...permissionPayload,
    };

    const { error } = await db.from("admin_users").insert(payload);
    if (error) {
      toast.error(error.message);
      return;
    }

    setNewAdminEmail("");
    setNewAdminId("");
    setNewAdminRole("admin");
    setNewAdminCountry("Burkina Faso");
    setNewAdminRegionId("");
    setNewPermissions(DEFAULT_PERMISSIONS);
    await loadSubAdmins();
    toast.success("Administrateur ajouté.");
  }

  async function loadSubAdmins(currentAdmin: AdminProfile | null = admin) {
    if (!currentAdmin || currentAdmin.role !== "super_admin") return;
    const { data, error } = await db.from("admin_users").select("*").order("created_at", { ascending: false });
    if (error) {
      toast.error(`Erreur administrateurs : ${error.message}`);
      return;
    }
    setSubAdmins((data ?? []) as AdminProfile[]);
  }

  async function deleteSubAdmin(id: string) {
    if (!isSuperAdmin || id === admin?.id) return;
    if (!confirm("Supprimer cet administrateur ?")) return;
    const { error } = await db.from("admin_users").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await loadSubAdmins();
    toast.success("Administrateur supprimé.");
  }

  async function updateAdminPermission(id: string, key: PermissionKey, value: boolean) {
    if (!isSuperAdmin || id === admin?.id) return;
    const { error } = await db.from("admin_users").update({
      [key]: value,
      can_manage_ads: ["view_ads", "create_ads", "edit_ads", "delete_ads", "change_ad_status", "manage_boosts"]
        .some((permission) => permission === key ? value : Boolean(subAdmins.find((item) => item.id === id)?.[permission as PermissionKey])),
      can_manage_offers: ["view_services", "edit_services", "delete_services"]
        .some((permission) => permission === key ? value : Boolean(subAdmins.find((item) => item.id === id)?.[permission as PermissionKey])),
      can_manage_users: ["view_users", "edit_users", "suspend_users"]
        .some((permission) => permission === key ? value : Boolean(subAdmins.find((item) => item.id === id)?.[permission as PermissionKey])),
    }).eq("id", id);
    if (error) return toast.error(error.message);
    await loadSubAdmins();
    toast.success("Permission mise à jour.");
  }

  async function updateAdminScope(id: string, patch: Record<string, unknown>) {
    if (!isSuperAdmin || id === admin?.id) return;
    const { error } = await db.from("admin_users").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    await loadSubAdmins();
    toast.success("Périmètre mis à jour.");
  }

  async function updateReport(id: string, status: string) {
    if (!requirePermission("manage_reports")) return;
    const { error } = await db.from("reports").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    await loadReports(admin!);
    toast.success("Signalement mis à jour.");
  }

  function formatPrice(value: number | null | undefined) {
    if (value === null || value === undefined) return "—";
    return `${Number(value).toLocaleString("fr-FR")} FCFA`;
  }

  function formatDate(value: string | null | undefined) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
  }

  const filteredAds = useMemo(() => {
    const q = searchAds.trim().toLowerCase();
    if (!q) return ads;
    return ads.filter((ad) =>
      [ad.title, ad.category, ad.location, ad.reference, ad.country]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [ads, searchAds]);

  const filteredServices = useMemo(() => {
    const q = searchServices.trim().toLowerCase();
    if (!q) return services;
    return services.filter((service) =>
      [service.title, service.category, service.location, service.reference, service.country]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [services, searchServices]);

  const filteredUsers = useMemo(() => {
    const q = searchUsers.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) =>
      [user.email, user.first_name, user.last_name, user.stuff_id, user.whatsapp_phone, user.country]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [users, searchUsers]);

  const filteredReports = useMemo(() => {
    const q = searchReports.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter((report) =>
      [report.reason, report.description, report.status, report.id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [reports, searchReports]);

  const soldAds = useMemo(() => ads.filter((ad) => ad.status === "sold"), [ads]);
  const tradeAds = useMemo(() => ads.filter((ad) => ad.trade_enabled), [ads]);
  const activeGroups = groups.filter((group) => group.is_active);
  const visitsToday = visits.length;
  const filteredProvinces = provinces.filter((province) => province.region_id === serviceRegionId);
  const roleScope = roleScopeLabel();

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) void loadAdmin(data.session.user.id);
      else setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      if (nextSession) void loadAdmin(nextSession.user.id);
      else {
        setAdmin(null);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbfbfa]">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-red-200 border-t-red-500" />
          <p className="text-sm text-slate-500">Chargement de l'administration…</p>
        </div>
      </div>
    );
  }

  if (!session || !admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbfbfa] p-4">
        <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-red-500 text-xl font-black text-white">S</span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-500">STUFF MARKET</p>
              <h1 className="text-2xl font-black">Administration</h1>
            </div>
          </div>
          <p className="mb-5 text-sm text-slate-500">Connectez-vous avec votre compte administrateur.</p>
          <div className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Adresse e-mail"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-red-200"
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mot de passe"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-red-200"
            />
            <button
              type="button"
              onClick={login}
              disabled={loginLoading}
              className="w-full rounded-xl bg-red-500 px-4 py-3 font-bold text-white disabled:opacity-50"
            >
              {loginLoading ? "Connexion…" : "Se connecter"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const nav = [
    ["dashboard", "Tableau de bord", Home, can("view_stats")],
    ["ads", "Annonces", Megaphone, can("view_ads")],
    ["trade", "Troc", ArrowRightLeft, can("view_ads")],
    ["services", "Services", ShoppingBag, can("view_services")],
    ["sold", "Produits vendus", Package, can("view_ads")],
    ["boosts", "Boosts", CircleDollarSign, can("manage_boosts")],
    ["groups", "Groupes", Users, isSuperAdmin],
    ["users", "Utilisateurs", Users, can("view_users")],
    ["notifications", "Notifications", Bell, can("view_followup")],
    ["reports", "Signalements", FileText, can("view_followup")],
    ["admins", "Administrateurs", Shield, isSuperAdmin],
    ["settings", "Réglages", Settings, isSuperAdmin],
  ].filter((item) => item[3]);

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="flex h-[74px] items-center">
          <div className={`flex shrink-0 items-center justify-center border-r border-slate-200 transition-all duration-200 ${sidebarOpen ? "w-[250px]" : "w-[72px]"}`}>
            <button
              type="button"
              onClick={() => setSidebarOpen((open) => !open)}
              className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-red-50 hover:text-red-500"
              aria-label={sidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              <ChevronRight className={`h-5 w-5 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
            </button>
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 md:px-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-red-500 text-white shadow-sm">
                <span className="text-lg font-black">S</span>
              </div>
              <div>
                <p className="text-lg font-black tracking-tight">
                  STUFF <span className="text-red-500">MARKET</span>
                </p>
                <p className="hidden text-[11px] text-slate-500 sm:block">{roleScope}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 md:block">
                {admin.role === "super_admin" ? "Super administrateur" : admin.role}
              </div>
              <button
                type="button"
                onClick={refreshAll}
                disabled={refreshing}
                className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 disabled:opacity-50"
                aria-label="Actualiser"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </button>
              <button
                type="button"
                onClick={logout}
                className="hidden rounded-full border border-slate-200 px-4 py-2 text-sm font-bold sm:block"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside
          className={`sticky top-[74px] z-40 flex h-[calc(100vh-74px)] shrink-0 flex-col border-r border-slate-200 bg-white py-5 transition-[width,padding] duration-200 ${
            sidebarOpen ? "w-[250px] px-3" : "w-0 overflow-hidden border-r-0 px-0 py-0"
          }`}
        >
          {sidebarOpen && (
            <>
              <div className="mb-4 px-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Navigation
              </div>
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
                {nav.map(([value, label, Icon]) => {
                  const I = Icon as any;
                  return (
                    <button
                      key={String(value)}
                      type="button"
                      onClick={() => setActiveSection(String(value))}
                      className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition ${
                        activeSection === value
                          ? "bg-red-500 text-white"
                          : "text-slate-700 hover:bg-red-50 hover:text-red-500"
                      }`}
                    >
                      <I className="h-5 w-5 shrink-0" />
                      <span>{String(label)}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 md:px-6 lg:px-8">
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-red-500">
                  STUFF MARKET • CONTROL CENTER
                </p>
                <h1 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">
                  Administration
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Données affichées directement depuis Supabase • {roleScope}
                </p>
              </div>
              <button
                type="button"
                onClick={refreshAll}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold shadow-sm"
              >
                <RefreshCw className="h-4 w-4" />
                Actualiser les données
              </button>
            </div>

            {activeSection === "dashboard" && can("view_stats") && (
              <section className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    ["Utilisateurs", usersCount, Users],
                    ["Annonces", adsCount, Megaphone],
                    ["Services", servicesCount, ShoppingBag],
                    ["Visites aujourd'hui", visitsToday, Activity],
                    ["Produits vendus", soldCount, Package],
                    ["Boutiques", businessesCount, Building2],
                    ["Boosts actifs", boostsCount, CircleDollarSign],
                    ["Demandes de boost", boostRequestsCount, BarChart3],
                  ].map(([label, value, Icon]) => {
                    const I = Icon as any;
                    return (
                      <div key={String(label)} className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4 grid h-11 w-11 place-items-center rounded-full bg-red-50 text-red-500">
                          <I className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-medium text-slate-600">{String(label)}</p>
                        <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">
                          {Number(value).toLocaleString("fr-FR")}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <LineChart
                  title="Évolution des utilisateurs"
                  description="Nouveaux comptes créés par mois à partir de profiles.created_at."
                  data={userChart}
                />
                <div className="grid gap-5 lg:grid-cols-2">
                  <LineChart
                    title="Évolution des annonces"
                    description="Nouvelles annonces créées par mois."
                    data={adsChart}
                  />
                  <LineChart
                    title="Produits vendus"
                    description="Annonces au statut sold, regroupées par mois."
                    data={soldChart}
                  />
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4">
                      <h3 className="font-bold">Top catégories</h3>
                      <p className="text-xs text-slate-500">Catégories réellement présentes dans ads.</p>
                    </div>
                    <div className="space-y-3">
                      {categoryStats.length === 0 ? (
                        <p className="text-sm text-slate-500">Aucune donnée réelle disponible.</p>
                      ) : (
                        categoryStats.map((item) => (
                          <div key={item.name} className="flex items-center justify-between gap-4">
                            <span className="truncate text-sm font-semibold">{item.name}</span>
                            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-500">
                              {item.count}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-red-50 text-red-500">
                        <Activity className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="font-bold">Dernières activités</h3>
                        <p className="text-xs text-slate-500">Uniquement des événements provenant des tables réelles.</p>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {activities.length === 0 ? (
                        <p className="py-4 text-sm text-slate-500">Aucune activité enregistrée.</p>
                      ) : (
                        activities.slice(0, 12).map((event) => (
                          <div key={event.id} className="flex gap-3 py-3">
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800">{event.title}</p>
                              <p className="truncate text-xs text-slate-500">{event.description}</p>
                              <p className="mt-1 text-[11px] text-slate-400">
                                {event.type} • {formatDate(event.created_at)}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="font-bold">Administrateur connecté</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div><p className="text-xs text-slate-400">Email</p><p className="mt-1 font-semibold">{admin.email}</p></div>
                    <div><p className="text-xs text-slate-400">Rôle</p><p className="mt-1 font-semibold">{admin.role}</p></div>
                    <div><p className="text-xs text-slate-400">Pays</p><p className="mt-1 font-semibold">{admin.country || "Tous"}</p></div>
                    <div><p className="text-xs text-slate-400">Périmètre</p><p className="mt-1 font-semibold">{roleScope}</p></div>
                  </div>
                </div>
              </section>
            )}

            {activeSection === "ads" && can("view_ads") && (
              <section className="space-y-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="text-xl font-black">Annonces</h2>
                    <p className="text-sm text-slate-500">Annonces réellement chargées depuis Supabase.</p>
                  </div>
                  <input
                    value={searchAds}
                    onChange={(event) => setSearchAds(event.target.value)}
                    placeholder="Rechercher..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 md:max-w-sm"
                  />
                </div>
                <div className="space-y-3">
                  {filteredAds.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Aucune annonce dans votre périmètre.</div>
                  ) : filteredAds.map((ad) => (
                    <div key={ad.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold">{ad.title}</h3>
                            <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${ad.status === "sold" ? "bg-slate-100 text-slate-600" : "bg-red-50 text-red-500"}`}>
                              {ad.status === "sold" ? "Vendu" : "Disponible"}
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-semibold">{formatPrice(ad.price)}</p>
                          <p className="mt-1 text-sm text-slate-500">{ad.location || "Localisation non précisée"}</p>
                          <p className="mt-1 text-xs text-slate-400">{ad.category || "Sans catégorie"} • {ad.reference || "Sans référence"}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {ad.status === "sold" ? (
                            can("change_ad_status") && <button type="button" onClick={() => restoreAd(ad.id)} className="rounded-lg border px-3 py-2 text-sm font-semibold">Remettre en vente</button>
                          ) : (
                            can("change_ad_status") && <button type="button" onClick={() => markAdAsSold(ad.id)} className="rounded-lg border px-3 py-2 text-sm font-semibold">Marquer vendu</button>
                          )}
                          {can("delete_ads") && (
                            <button type="button" onClick={() => deleteAd(ad.id)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-500">
                              <Trash2 className="mr-1 inline h-4 w-4" /> Supprimer
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeSection === "trade" && can("view_ads") && (
              <section className="space-y-5">
                <div>
                  <h2 className="text-xl font-black">Troc</h2>
                  <p className="text-sm text-slate-500">Annonces réelles ayant activé le troc.</p>
                </div>
                <div className="space-y-3">
                  {tradeAds.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Aucune annonce en troc.</div>
                  ) : tradeAds.map((ad) => (
                    <div key={ad.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="font-bold">{ad.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{ad.location || "Localisation non précisée"}</p>
                      <p className="mt-1 text-sm font-semibold">{formatPrice(ad.price)}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeSection === "services" && can("view_services") && (
              <section className="space-y-5">
                <div>
                  <h2 className="text-xl font-black">Services</h2>
                  <p className="text-sm text-slate-500">Gestion des services professionnels réels.</p>
                </div>
                {can("edit_services") && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="font-bold">Publier un service pour un professionnel</h3>
                    <p className="mt-1 text-xs text-slate-500">Le professionnel est recherché par son Stuff ID.</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <input value={serviceStuffId} onChange={(e) => setServiceStuffId(e.target.value)} placeholder="Stuff ID du professionnel" className="rounded-xl border px-4 py-3" />
                      <input value={serviceTitle} onChange={(e) => setServiceTitle(e.target.value)} placeholder="Titre du service" className="rounded-xl border px-4 py-3" />
                      <input value={serviceCategory} onChange={(e) => setServiceCategory(e.target.value)} placeholder="Catégorie" className="rounded-xl border px-4 py-3" />
                      <input value={servicePrice} onChange={(e) => setServicePrice(e.target.value)} type="number" placeholder="Prix" className="rounded-xl border px-4 py-3" />
                      <select value={serviceRegionId} onChange={(e) => { setServiceRegionId(e.target.value); setServiceProvinceId(""); }} className="rounded-xl border px-4 py-3">
                        <option value="">Région</option>
                        {regions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}
                      </select>
                      <select value={serviceProvinceId} onChange={(e) => setServiceProvinceId(e.target.value)} className="rounded-xl border px-4 py-3">
                        <option value="">Province</option>
                        {filteredProvinces.map((province) => <option key={province.id} value={province.id}>{province.name}</option>)}
                      </select>
                      <input value={serviceLocation} onChange={(e) => setServiceLocation(e.target.value)} placeholder="Localisation" className="rounded-xl border px-4 py-3" />
                      <input value={serviceWhatsapp} onChange={(e) => setServiceWhatsapp(e.target.value)} placeholder="WhatsApp international" className="rounded-xl border px-4 py-3" />
                      <textarea value={serviceDescription} onChange={(e) => setServiceDescription(e.target.value)} placeholder="Description" className="min-h-28 rounded-xl border px-4 py-3 md:col-span-2" />
                    </div>
                    <button type="button" onClick={createServiceForProfessional} disabled={serviceSaving} className="mt-4 rounded-xl bg-red-500 px-5 py-3 font-bold text-white disabled:opacity-50">
                      {serviceSaving ? "Publication…" : "Publier le service"}
                    </button>
                  </div>
                )}
                <input value={searchServices} onChange={(e) => setSearchServices(e.target.value)} placeholder="Rechercher un service..." className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" />
                <div className="space-y-3">
                  {filteredServices.length === 0 ? (
                    <div className="rounded-2xl border bg-white p-8 text-center text-sm text-slate-500">Aucun service.</div>
                  ) : filteredServices.map((service) => (
                    <div key={service.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="font-bold">{service.title}</p>
                          <p className="mt-1 text-sm font-semibold">{formatPrice(service.price)}</p>
                          <p className="mt-1 text-sm text-slate-500">{service.location || "Localisation non précisée"}</p>
                          <p className="mt-1 text-xs text-slate-400">{service.category || "Sans catégorie"} • {service.reference || "Sans référence"}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {can("edit_services") && (
                            <button type="button" onClick={() => toggleServiceStatus(service.id, service.status === "available" ? "unavailable" : "available")} className="rounded-lg border px-3 py-2 text-sm font-semibold">
                              {service.status === "available" ? "Désactiver" : "Activer"}
                            </button>
                          )}
                          {can("delete_services") && <button type="button" onClick={() => deleteService(service.id)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-500">Supprimer</button>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeSection === "sold" && can("view_ads") && (
              <section className="space-y-5">
                <div>
                  <h2 className="text-xl font-black">Produits vendus</h2>
                  <p className="text-sm text-slate-500">{soldAds.length} produit(s) actuellement marqué(s) vendu dans votre périmètre.</p>
                </div>
                {soldAds.length === 0 ? (
                  <div className="rounded-2xl border bg-white p-8 text-center text-sm text-slate-500">Aucun produit vendu.</div>
                ) : soldAds.map((ad) => (
                  <div key={ad.id} className="rounded-2xl border bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div><p className="font-bold">{ad.title}</p><p className="text-sm text-slate-500">{formatPrice(ad.price)} • {ad.location || "—"}</p></div>
                      {can("change_ad_status") && <button type="button" onClick={() => restoreAd(ad.id)} className="rounded-lg border px-3 py-2 text-sm font-semibold">Remettre en vente</button>}
                    </div>
                  </div>
                ))}
              </section>
            )}

            {activeSection === "boosts" && can("manage_boosts") && (
              <section className="space-y-5">
                <div>
                  <h2 className="text-xl font-black">Boosts</h2>
                  <p className="text-sm text-slate-500">Demandes et boosts réellement présents dans Supabase.</p>
                </div>
                <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4">
                  <h3 className="font-bold">Demandes en attente</h3>
                  <div className="mt-3 space-y-3">
                    {boostRequests.length === 0 ? <p className="text-sm text-slate-500">Aucune demande en attente.</p> : boostRequests.map((request) => (
                      <div key={request.id} className="rounded-xl border bg-white p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-bold">{request.ad?.title || "Annonce introuvable"}</p>
                            <p className="text-sm">Formule : {request.plan_id}</p>
                            <p className="text-xs text-slate-400">{formatDate(request.requested_at)}</p>
                          </div>
                          <div className="flex gap-2">
                            <button type="button" disabled={!request.ad} onClick={() => approveBoostRequest(request)} className="rounded-lg bg-red-500 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">Approuver</button>
                            <button type="button" onClick={() => rejectBoostRequest(request)} className="rounded-lg border px-3 py-2 text-sm font-semibold">Refuser</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border bg-white p-5">
                  <h3 className="font-bold">Boosts actifs</h3>
                  <div className="mt-3 space-y-3">
                    {boostedAds.length === 0 ? <p className="text-sm text-slate-500">Aucun boost actif.</p> : boostedAds.map((boost) => (
                      <div key={boost.id} className="rounded-xl border p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-bold">{boost.ad?.title || "Annonce"}</p>
                            <p className="text-sm">Formule : {boost.plan}</p>
                            <p className="text-xs text-slate-400">Fin : {formatDate(boost.ends_at)}</p>
                          </div>
                          <button type="button" onClick={() => cancelBoost(boost.id)} className="rounded-lg border px-3 py-2 text-sm font-semibold">Désactiver</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {activeSection === "groups" && isSuperAdmin && (
              <section className="space-y-5">
                <div><h2 className="text-xl font-black">Groupes de partage</h2><p className="text-sm text-slate-500">Groupes enregistrés réellement dans Supabase.</p></div>
                <div className="grid gap-3 md:grid-cols-[1fr_160px_2fr_auto]">
                  <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Nom du groupe" className="rounded-xl border px-4 py-3" />
                  <select value={groupPlatform} onChange={(e) => setGroupPlatform(e.target.value)} className="rounded-xl border px-4 py-3"><option value="whatsapp">WhatsApp</option><option value="facebook">Facebook</option><option value="telegram">Telegram</option></select>
                  <input value={groupUrl} onChange={(e) => setGroupUrl(e.target.value)} placeholder="Lien" className="rounded-xl border px-4 py-3" />
                  <button type="button" onClick={addGroup} className="rounded-xl bg-red-500 px-4 py-3 font-bold text-white">Ajouter</button>
                </div>
                <div className="space-y-3">
                  {groups.length === 0 ? <div className="rounded-2xl border bg-white p-8 text-center text-sm text-slate-500">Aucun groupe.</div> : groups.map((group) => (
                    <div key={group.id} className="flex flex-col gap-3 rounded-2xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div><p className="font-bold">{group.name}</p><p className="text-xs text-slate-500">{group.platform} • {group.url}</p><p className="mt-1 text-xs">{group.is_active ? "Actif" : "Désactivé"}</p></div>
                      <div className="flex gap-2"><button type="button" onClick={() => toggleGroup(group)} className="rounded-lg border px-3 py-2 text-sm">{group.is_active ? "Désactiver" : "Activer"}</button><button type="button" onClick={() => deleteGroup(group.id)} className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-500">Supprimer</button></div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeSection === "users" && can("view_users") && (
              <section className="space-y-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div><h2 className="text-xl font-black">Utilisateurs</h2><p className="text-sm text-slate-500">Utilisateurs réels de votre périmètre.</p></div>
                  <input value={searchUsers} onChange={(e) => setSearchUsers(e.target.value)} placeholder="Rechercher..." className="w-full rounded-xl border px-4 py-3 md:max-w-sm" />
                </div>
                <div className="space-y-3">
                  {filteredUsers.length === 0 ? <div className="rounded-2xl border bg-white p-8 text-center text-sm text-slate-500">Aucun utilisateur.</div> : filteredUsers.map((user) => (
                    <div key={user.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-bold">{[user.first_name, user.last_name].filter(Boolean).join(" ") || "Utilisateur"}</p>
                          <p className="text-sm text-slate-500">{user.email || "Sans email"} • {user.stuff_id || "Sans Stuff ID"}</p>
                          <p className="text-xs text-slate-400">{user.country || "Pays non défini"} {user.whatsapp_phone ? `• ${user.whatsapp_phone}` : ""}</p>
                          {user.is_suspended && <span className="mt-2 inline-block rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-500">Suspendu</span>}
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setSelectedUser(user)} className="rounded-lg border px-3 py-2 text-sm font-semibold">Détails</button>
                          {can("suspend_users") && <button type="button" onClick={() => suspendUser(user, !Boolean(user.is_suspended))} className="rounded-lg border px-3 py-2 text-sm font-semibold">{user.is_suspended ? "Réactiver" : "Suspendre"}</button>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeSection === "notifications" && can("view_followup") && (
              <section className="space-y-5">
                <div><h2 className="text-xl font-black">Notifications et activités</h2><p className="text-sm text-slate-500">Aucune activité fictive : uniquement les lignes présentes dans Supabase.</p></div>
                <div className="rounded-2xl border bg-white p-5">
                  <div className="space-y-3">
                    {notifications.length === 0 ? <p className="text-sm text-slate-500">Aucune notification réelle.</p> : notifications.map((notification) => (
                      <div key={notification.id} className="border-b border-slate-100 pb-3 last:border-0">
                        <p className="font-bold">{notification.title || "Notification"}</p>
                        <p className="text-sm text-slate-500">{notification.message || "—"}</p>
                        <p className="mt-1 text-xs text-slate-400">{notification.type || "Notification"} • {formatDate(notification.created_at)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {activeSection === "reports" && can("view_followup") && (
              <section className="space-y-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div><h2 className="text-xl font-black">Signalements</h2><p className="text-sm text-slate-500">Signalements réellement enregistrés.</p></div>
                  <input value={searchReports} onChange={(e) => setSearchReports(e.target.value)} placeholder="Rechercher..." className="w-full rounded-xl border px-4 py-3 md:max-w-sm" />
                </div>
                <div className="space-y-3">
                  {filteredReports.length === 0 ? <div className="rounded-2xl border bg-white p-8 text-center text-sm text-slate-500">Aucun signalement.</div> : filteredReports.map((report) => (
                    <div key={report.id} className="rounded-2xl border bg-white p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div><p className="font-bold">{report.reason || "Signalement"}</p><p className="text-sm text-slate-500">{report.description || "Sans description"}</p><p className="mt-1 text-xs text-slate-400">{formatDate(report.created_at)} • {report.status || "pending"}</p></div>
                        {can("manage_reports") && <select value={report.status || "pending"} onChange={(e) => updateReport(report.id, e.target.value)} className="rounded-lg border px-3 py-2 text-sm"><option value="pending">En attente</option><option value="reviewing">En cours</option><option value="resolved">Résolu</option><option value="rejected">Rejeté</option></select>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeSection === "admins" && isSuperAdmin && (
              <section className="space-y-5">
                <div><h2 className="text-xl font-black">Administrateurs</h2><p className="text-sm text-slate-500">Création par rôle, pays, région et permissions individuelles.</p></div>
                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                  <h3 className="font-bold">Ajouter un administrateur</h3>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <input value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} placeholder="Adresse e-mail" className="rounded-xl border px-4 py-3" />
                    <input value={newAdminId} onChange={(e) => setNewAdminId(e.target.value)} placeholder="ID utilisateur Auth" className="rounded-xl border px-4 py-3" />
                    <select value={newAdminRole} onChange={(e) => { const role = e.target.value as typeof newAdminRole; setNewAdminRole(role); if (role === "admin") { setNewAdminCountry("Burkina Faso"); setNewAdminRegionId(""); } }} className="rounded-xl border px-4 py-3">
                      <option value="admin">Administrateur classique</option>
                      <option value="country_admin">Administrateur pays</option>
                      <option value="country_regional_admin">Administrateur pays régional</option>
                    </select>
                    <select value={newAdminCountry} disabled={newAdminRole === "admin"} onChange={(e) => setNewAdminCountry(e.target.value)} className="rounded-xl border px-4 py-3 disabled:bg-slate-50">
                      {COUNTRIES.map((country) => <option key={country} value={country}>{country}</option>)}
                    </select>
                    {newAdminRole === "country_regional_admin" && (
                      <select value={newAdminRegionId} onChange={(e) => setNewAdminRegionId(e.target.value)} className="rounded-xl border px-4 py-3 md:col-span-2">
                        <option value="">Choisir une région</option>
                        {regions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}
                      </select>
                    )}
                  </div>
                  <div className="mt-5">
                    <p className="mb-3 text-sm font-bold">Permissions individuelles</p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {PERMISSIONS.map((permission) => (
                        <label key={permission.key} className="flex items-center gap-2 rounded-xl border p-3 text-sm">
                          <input type="checkbox" checked={Boolean(newPermissions[permission.key])} onChange={(e) => setNewPermissions((prev) => ({ ...prev, [permission.key]: e.target.checked }))} />
                          <span>{permission.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <button type="button" onClick={addSubAdmin} className="mt-5 rounded-xl bg-red-500 px-5 py-3 font-bold text-white">Ajouter l'administrateur</button>
                </div>

                <div className="space-y-3">
                  {subAdmins.map((subAdmin) => (
                    <div key={subAdmin.id} className="rounded-2xl border bg-white p-5 shadow-sm">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="font-bold">{subAdmin.email}</p>
                          <p className="text-xs text-slate-400">{subAdmin.id} • {subAdmin.role}</p>
                          <p className="mt-1 text-sm text-slate-500">{subAdmin.country || "Tous les pays"} {subAdmin.region_id ? `• ${regions.find((r) => r.id === subAdmin.region_id)?.name || "Région"}` : ""}</p>
                        </div>
                        {subAdmin.id !== admin.id && <button type="button" onClick={() => deleteSubAdmin(subAdmin.id)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-500">Supprimer</button>}
                      </div>
                      {subAdmin.id !== admin.id && (
                        <>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {PERMISSIONS.map((permission) => (
                              <label key={permission.key} className="flex items-center gap-2 rounded-xl border p-3 text-sm">
                                <input type="checkbox" checked={Boolean(subAdmin[permission.key])} onChange={(e) => updateAdminPermission(subAdmin.id, permission.key, e.target.checked)} />
                                <span>{permission.label}</span>
                              </label>
                            ))}
                          </div>
                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <select value={subAdmin.role} onChange={(e) => updateAdminScope(subAdmin.id, { role: e.target.value })} className="rounded-xl border px-4 py-3">
                              <option value="admin">Administrateur classique</option>
                              <option value="country_admin">Administrateur pays</option>
                              <option value="country_regional_admin">Administrateur pays régional</option>
                              <option value="regional_admin">Ancien rôle régional</option>
                            </select>
                            <select value={subAdmin.country || ""} onChange={(e) => updateAdminScope(subAdmin.id, { country: e.target.value || null })} className="rounded-xl border px-4 py-3">
                              <option value="">Tous les pays</option>
                              {COUNTRIES.map((country) => <option key={country} value={country}>{country}</option>)}
                            </select>
                            <select value={subAdmin.region_id || ""} onChange={(e) => updateAdminScope(subAdmin.id, { region_id: e.target.value || null })} className="rounded-xl border px-4 py-3 md:col-span-2">
                              <option value="">Aucune région</option>
                              {regions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeSection === "settings" && isSuperAdmin && (
              <section className="space-y-5">
                <div><h2 className="text-xl font-black">Réglages</h2><p className="text-sm text-slate-500">Configuration réelle enregistrée dans Supabase.</p></div>
                <div className="rounded-2xl border bg-white p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div><h3 className="font-bold">Afficher les produits vendus</h3><p className="text-xs text-slate-500">Valeur de app_settings.show_sold_products.</p></div>
                    <button type="button" onClick={() => saveAppSettings(!showSold)} className={`rounded-full px-4 py-2 text-sm font-bold ${showSold ? "bg-red-500 text-white" : "border"}`}>{showSold ? "Activé" : "Désactivé"}</button>
                  </div>
                </div>
                <div className="rounded-2xl border bg-white p-5">
                  <h3 className="font-bold">Publicité</h3>
                  <p className="mt-1 text-xs text-slate-500">Aucune statistique d'impression n'est affichée sans table de données réelle. Seuls les réglages existants sont affichés.</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                      ["Monetag", "monetag_enabled"],
                      ["Adsterra", "adsterra_enabled"],
                      ["Popup", "show_popup"],
                      ["Banner", "show_banner"],
                      ["Push", "show_push"],
                    ].map(([label, key]) => (
                      <button key={key} type="button" onClick={() => saveAdSetting(key, !Boolean(adSettings[key]))} className="flex items-center justify-between rounded-xl border p-4 text-left">
                        <span className="font-semibold">{label}</span>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${adSettings[key] ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-500"}`}>{adSettings[key] ? "Activé" : "Désactivé"}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {[
                      ["Code Monetag", "monetag_code"],
                      ["Code Adsterra", "adsterra_code"],
                    ].map(([label, key]) => (
                      <label key={key} className="block">
                        <span className="mb-1 block text-sm font-semibold">{label}</span>
                        <input defaultValue={String(adSettings[key] || "")} onBlur={(e) => saveAdSetting(key, e.target.value)} className="w-full rounded-xl border px-4 py-3" />
                      </label>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => setSelectedUser(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-4">
              <div><p className="text-xs font-black uppercase tracking-wider text-red-500">Utilisateur</p><h3 className="text-xl font-black">{[selectedUser.first_name, selectedUser.last_name].filter(Boolean).join(" ") || "Utilisateur"}</h3></div>
              <button type="button" onClick={() => setSelectedUser(null)} className="grid h-9 w-9 place-items-center rounded-full border"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <p><span className="text-slate-400">Email :</span> {selectedUser.email || "—"}</p>
              <p><span className="text-slate-400">Stuff ID :</span> {selectedUser.stuff_id || "—"}</p>
              <p><span className="text-slate-400">WhatsApp :</span> {selectedUser.whatsapp_phone || "—"}</p>
              <p><span className="text-slate-400">Pays :</span> {selectedUser.country || "—"}</p>
              <p><span className="text-slate-400">Localité :</span> {selectedUser.locality || selectedUser.city || "—"}</p>
              <p><span className="text-slate-400">Créé le :</span> {formatDate(selectedUser.created_at)}</p>
            </div>
            {can("edit_users") && (
              <div className="mt-5 space-y-3">
                <input
                  value={selectedUser.first_name || ""}
                  onChange={(e) => setSelectedUser((prev: any) => ({ ...prev, first_name: e.target.value }))}
                  placeholder="Prénom"
                  className="w-full rounded-xl border px-4 py-3"
                />
                <input
                  value={selectedUser.last_name || ""}
                  onChange={(e) => setSelectedUser((prev: any) => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Nom"
                  className="w-full rounded-xl border px-4 py-3"
                />
                <input
                  value={selectedUser.locality || ""}
                  onChange={(e) => setSelectedUser((prev: any) => ({ ...prev, locality: e.target.value }))}
                  placeholder="Localité"
                  className="w-full rounded-xl border px-4 py-3"
                />
                <button
                  type="button"
                  onClick={async () => {
                    await updateUser(selectedUser.id, {
                      first_name: selectedUser.first_name || null,
                      last_name: selectedUser.last_name || null,
                      locality: selectedUser.locality || null,
                    });
                    setSelectedUser(null);
                  }}
                  className="rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white"
                >
                  Enregistrer les modifications
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedBoost && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-4" onClick={() => setSelectedBoost(null)}>
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div><p className="text-xs font-black uppercase tracking-wider text-red-500">Boost</p><h3 className="text-xl font-black">{selectedBoost.ad?.title || "Annonce"}</h3></div>
              <button type="button" onClick={() => setSelectedBoost(null)} className="grid h-9 w-9 place-items-center rounded-full border"><X className="h-4 w-4" /></button>
            </div>
            <p className="mt-4 text-sm text-slate-500">Fin : {formatDate(selectedBoost.ends_at)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
