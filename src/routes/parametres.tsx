import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/parametres")({
  component: ParametresPage,
});

function ParametresPage() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
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
      if (!mounted) return;
      const user = data.user;
      if (!user) {
        setLoading(false);
        return;
      }

      setUserEmail(user.email ?? "");
      const { data: admin } = await supabase
        .from("admin_users")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (mounted) {
        setIsAdmin(Boolean(admin));
        setLoading(false);
      }
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
      // Supabase n'exige pas automatiquement l'ancien mot de passe lors d'un
      // changement de mot de passe. On le vérifie donc explicitement ici.
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: oldPassword,
      });

      if (verifyError) {
        toast.error("Ancien mot de passe incorrect.");
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
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

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>Chargement des réglages...</div>
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
            <p style={styles.subtitle}>Gère la sécurité de ton compte et les accès disponibles.</p>
          </div>
          <div style={styles.icon}>⚙</div>
        </section>

        <section style={styles.card}>
          <div style={styles.row}>
            <div>
              <h2 style={styles.sectionTitle}>Sécurité</h2>
              <p style={styles.muted}>Modifie ton mot de passe avec vérification de l'ancien mot de passe.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowPasswordForm((v) => !v)}
              style={styles.secondaryButton}
            >
              {showPasswordForm ? "Fermer" : "Changer le mot de passe"}
            </button>
          </div>

          {showPasswordForm && (
            <div style={styles.form}>
              <label style={styles.label}>
                Ancien mot de passe
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  autoComplete="current-password"
                  style={styles.input}
                />
              </label>
              <label style={styles.label}>
                Nouveau mot de passe
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  style={styles.input}
                />
              </label>
              <label style={styles.label}>
                Confirmer le nouveau mot de passe
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  style={styles.input}
                />
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
              <p style={styles.muted}>Accède au tableau de bord pour gérer les annonces, trocs, services, boosts, groupes et paramètres.</p>
            </div>
            <Link to="/admin" style={styles.adminButton}>Ouvrir l'administration →</Link>
          </section>
        )}

        {!userEmail && (
          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Connexion requise</h2>
            <p style={styles.muted}>Connecte-toi pour accéder aux réglages de ton compte.</p>
            <Link to="/auth" style={styles.primaryButton}>Se connecter</Link>
          </section>
        )}
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "linear-gradient(145deg,#07111f,#101827 55%,#07111f)", padding: "28px 16px", color: "#f8fafc" },
  container: { width: "100%", maxWidth: 900, margin: "0 auto" },
  back: { color: "#cbd5e1", textDecoration: "none", display: "inline-block", marginBottom: 18 },
  hero: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: 24, borderRadius: 24, background: "rgba(30,41,59,.72)", border: "1px solid rgba(148,163,184,.18)", marginBottom: 18 },
  eyebrow: { fontSize: 12, letterSpacing: 2, fontWeight: 800, color: "#94a3b8" },
  title: { fontSize: 32, margin: "6px 0 8px" },
  subtitle: { margin: 0, color: "#cbd5e1" },
  icon: { width: 58, height: 58, borderRadius: 18, display: "grid", placeItems: "center", background: "rgba(255,255,255,.08)", fontSize: 27 },
  card: { background: "rgba(15,23,42,.82)", border: "1px solid rgba(148,163,184,.18)", borderRadius: 22, padding: 22, marginBottom: 16, boxShadow: "0 18px 50px rgba(0,0,0,.16)" },
  adminCard: { background: "linear-gradient(135deg,rgba(30,64,175,.45),rgba(15,23,42,.92))", border: "1px solid rgba(96,165,250,.3)", borderRadius: 22, padding: 22, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" },
  sectionTitle: { margin: "0 0 7px", fontSize: 20 },
  muted: { margin: 0, color: "#94a3b8", lineHeight: 1.55 },
  secondaryButton: { border: "1px solid #475569", background: "#1e293b", color: "#f8fafc", padding: "11px 15px", borderRadius: 12, fontWeight: 700, cursor: "pointer" },
  primaryButton: { display: "inline-block", border: 0, background: "#2563eb", color: "white", padding: "12px 16px", borderRadius: 12, fontWeight: 800, textDecoration: "none", cursor: "pointer" },
  adminButton: { display: "inline-block", border: 0, background: "#0ea5e9", color: "white", padding: "13px 17px", borderRadius: 13, fontWeight: 800, textDecoration: "none" },
  adminBadge: { display: "inline-block", padding: "5px 9px", borderRadius: 999, background: "rgba(14,165,233,.16)", color: "#7dd3fc", fontSize: 11, fontWeight: 900, letterSpacing: 1, marginBottom: 8 },
  form: { marginTop: 20, display: "grid", gap: 14, paddingTop: 18, borderTop: "1px solid rgba(148,163,184,.15)" },
  label: { display: "grid", gap: 7, color: "#e2e8f0", fontWeight: 700 },
  input: { width: "100%", boxSizing: "border-box", background: "#0b1220", color: "white", border: "1px solid #334155", borderRadius: 12, padding: "12px 13px", outline: "none" },
};
