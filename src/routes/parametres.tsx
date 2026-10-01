import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/parametres")({
  component: ParametresPage,
});

type Profile = {
  first_name: string | null;
  last_name: string | null;
  stuff_id: string | null;
  whatsapp_phone: string | null;
  email: string | null;
  city: string | null;
  locality: string | null;
  whatsapp_country_code: string | null;
  region_id: string | null;
  province_id: string | null;
};

type Named = { id: string; name: string };

function ParametresPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [regionName, setRegionName] = useState("");
  const [provinceName, setProvinceName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!mounted) return;

      if (!user) {
        setLoading(false);
        return;
      }

      setUserEmail(user.email ?? "");

      const [{ data: profileData }, { data: admin }] = await Promise.all([
        supabase
          .from("profiles")
          .select("first_name,last_name,stuff_id,whatsapp_phone,email,city,locality,whatsapp_country_code,region_id,province_id")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("admin_users")
          .select("id")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

      if (!mounted) return;

      const currentProfile = profileData as Profile | null;
      setProfile(currentProfile);
      setIsAdmin(Boolean(admin));

      if (currentProfile?.region_id) {
        const { data: region } = await supabase
          .from("regions")
          .select("id,name")
          .eq("id", currentProfile.region_id)
          .maybeSingle();
        if (region) setRegionName((region as Named).name);
      }

      if (currentProfile?.province_id) {
        const { data: province } = await supabase
          .from("provinces")
          .select("id,name")
          .eq("id", currentProfile.province_id)
          .maybeSingle();
        if (province) setProvinceName((province as Named).name);
      }

      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function changePassword() {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Remplis les trois champs.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("La confirmation ne correspond pas au nouveau mot de passe.");
      return;
    }

    if (!userEmail) {
      toast.error("Impossible de retrouver le compte connecté.");
      return;
    }

    setSavingPassword(true);

    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: oldPassword,
      });

      if (verifyError) {
        toast.error("Ancien mot de passe incorrect.");
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
      toast.success("Mot de passe modifié avec succès.");
    } finally {
      setSavingPassword(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    toast.success("Déconnexion réussie.");
    navigate({ to: "/" });
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>Chargement des réglages...</div>
      </main>
    );
  }

  if (!userEmail) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <Link to="/" style={styles.back}>← Retour à l'accueil</Link>
          <section style={styles.card}>
            <h1 style={styles.title}>Réglages du compte</h1>
            <p style={styles.muted}>Connecte-toi pour accéder aux informations et réglages de ton compte.</p>
            <Link to="/auth" style={styles.primaryButton}>Se connecter</Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <Link to="/" style={styles.back}>← Retour à l'accueil</Link>

        <section style={styles.hero}>
          <div>
            <div style={styles.eyebrow}>STUFF MARKET</div>
            <h1 style={styles.title}>Réglages du compte</h1>
            <p style={styles.subtitle}>Gère tes informations, ta sécurité et tes accès.</p>
          </div>
          <div style={styles.icon}>⚙</div>
        </section>

        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Informations du compte</h2>
              <p style={styles.muted}>Voici les informations enregistrées sur ton profil.</p>
            </div>
            {profile?.stuff_id && <div style={styles.stuffBadge}>{profile.stuff_id}</div>}
          </div>

          <div style={styles.infoGrid}>
            <Info label="Prénom" value={profile?.first_name} />
            <Info label="Nom" value={profile?.last_name} />
            <Info label="Identifiant Stuff Market" value={profile?.stuff_id} />
            <Info label="WhatsApp" value={profile?.whatsapp_phone} />
            <Info label="E-mail" value={profile?.email || userEmail} />
            <Info label="Région" value={regionName || "Non renseignée"} />
            <Info label="Province" value={provinceName || "Non renseignée"} />
            <Info label="Ville" value={profile?.city} />
            <Info label="Localisation" value={profile?.locality} />
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.row}>
            <div>
              <h2 style={styles.sectionTitle}>Sécurité</h2>
              <p style={styles.muted}>L'ancien mot de passe doit être vérifié avant toute modification.</p>
            </div>
            <button type="button" onClick={() => setShowPasswordForm((v) => !v)} style={styles.secondaryButton}>
              {showPasswordForm ? "Fermer" : "Changer le mot de passe"}
            </button>
          </div>

          {showPasswordForm && (
            <div style={styles.form}>
              <label style={styles.label}>
                Ancien mot de passe
                <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} autoComplete="current-password" style={styles.input} />
              </label>
              <label style={styles.label}>
                Nouveau mot de passe
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" style={styles.input} />
              </label>
              <label style={styles.label}>
                Confirmer le nouveau mot de passe
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" style={styles.input} />
              </label>
              <button type="button" disabled={savingPassword} onClick={changePassword} style={styles.primaryButton}>
                {savingPassword ? "Vérification..." : "Modifier le mot de passe"}
              </button>
            </div>
          )}
        </section>

        {isAdmin && (
          <section style={styles.adminCard}>
            <div>
              <div style={styles.adminBadge}>ADMINISTRATEUR</div>
              <h2 style={styles.sectionTitle}>Espace administrateur</h2>
              <p style={styles.muted}>Gère les annonces, trocs, services, boosts, groupes et réglages de la plateforme.</p>
            </div>
            <Link to="/admin" style={styles.adminButton}>Ouvrir l'administration →</Link>
          </section>
        )}

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Session</h2>
          <p style={styles.muted}>Connecté avec {userEmail}</p>
          <button type="button" onClick={logout} style={styles.dangerButton}>
            Se déconnecter
          </button>
        </section>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div style={styles.infoItem}>
      <span style={styles.infoLabel}>{label}</span>
      <span style={styles.infoValue}>{value?.trim() || "Non renseigné"}</span>
    </div>
  );
}

const styles: Record<string, any> = {
  page: { minHeight: "100vh", background: "linear-gradient(145deg,#07111f,#101827 55%,#07111f)", padding: "28px 16px", color: "#f8fafc" },
  container: { width: "100%", maxWidth: 920, margin: "0 auto" },
  back: { color: "#cbd5e1", textDecoration: "none", display: "inline-block", marginBottom: 18 },
  hero: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: 24, borderRadius: 24, background: "rgba(30,41,59,.72)", border: "1px solid rgba(148,163,184,.18)", marginBottom: 18 },
  eyebrow: { fontSize: 12, letterSpacing: 2, fontWeight: 800, color: "#94a3b8" },
  title: { fontSize: 32, margin: "6px 0 8px" },
  subtitle: { margin: 0, color: "#cbd5e1" },
  icon: { width: 58, height: 58, borderRadius: 18, display: "grid", placeItems: "center", background: "rgba(255,255,255,.08)", fontSize: 27 },
  card: { background: "rgba(15,23,42,.82)", border: "1px solid rgba(148,163,184,.18)", borderRadius: 22, padding: 22, marginBottom: 16, boxShadow: "0 18px 50px rgba(0,0,0,.16)" },
  adminCard: { background: "linear-gradient(135deg,rgba(30,64,175,.45),rgba(15,23,42,.92))", border: "1px solid rgba(96,165,250,.3)", borderRadius: 22, padding: 22, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 18 },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" },
  sectionTitle: { margin: "0 0 7px", fontSize: 20 },
  muted: { margin: 0, color: "#94a3b8", lineHeight: 1.55 },
  stuffBadge: { padding: "9px 12px", borderRadius: 999, background: "rgba(14,165,233,.14)", color: "#7dd3fc", fontWeight: 900, letterSpacing: 1 },
  infoGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 10 },
  infoItem: { padding: 14, borderRadius: 14, background: "rgba(2,6,23,.35)", border: "1px solid rgba(148,163,184,.12)", display: "grid", gap: 5 },
  infoLabel: { fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .7, color: "#94a3b8" },
  infoValue: { fontWeight: 700, color: "#f8fafc", wordBreak: "break-word" },
  secondaryButton: { border: "1px solid #475569", background: "#1e293b", color: "#f8fafc", padding: "11px 15px", borderRadius: 12, fontWeight: 700, cursor: "pointer" },
  primaryButton: { display: "inline-block", border: 0, background: "#2563eb", color: "white", padding: "12px 16px", borderRadius: 12, fontWeight: 800, textDecoration: "none", cursor: "pointer", marginTop: 16 },
  adminButton: { display: "inline-block", border: 0, background: "#0ea5e9", color: "white", padding: "13px 17px", borderRadius: 13, fontWeight: 800, textDecoration: "none" },
  adminBadge: { display: "inline-block", padding: "5px 9px", borderRadius: 999, background: "rgba(14,165,233,.16)", color: "#7dd3fc", fontSize: 11, fontWeight: 900, letterSpacing: 1, marginBottom: 8 },
  form: { marginTop: 20, display: "grid", gap: 14, paddingTop: 18, borderTop: "1px solid rgba(148,163,184,.15)" },
  label: { display: "grid", gap: 7, color: "#e2e8f0", fontWeight: 700 },
  input: { width: "100%", boxSizing: "border-box", background: "#0b1220", color: "white", border: "1px solid #334155", borderRadius: 12, padding: "12px 13px", outline: "none" },
  dangerButton: { marginTop: 16, border: "1px solid rgba(248,113,113,.35)", background: "rgba(127,29,29,.3)", color: "#fecaca", padding: "11px 15px", borderRadius: 12, fontWeight: 800, cursor: "pointer" },
};
