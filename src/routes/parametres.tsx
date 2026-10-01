import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Copy, Gift, LogOut, ShieldCheck, Settings2, Share2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AppLayout } from "@/components/AppLayout";
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
  const [referralCount, setReferralCount] = useState(0);
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

      const [{ data: profileData }, { data: admin }, referralResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("first_name,last_name,stuff_id,whatsapp_phone,email,city,locality,whatsapp_country_code,region_id,province_id")
          .eq("id", user.id)
          .maybeSingle(),
        supabase.from("admin_users").select("id").eq("id", user.id).maybeSingle(),
        supabase.from("referrals").select("id", { count: "exact", head: true }).eq("referrer_id", user.id),
      ]);

      if (!mounted) return;

      const currentProfile = profileData as Profile | null;
      setProfile(currentProfile);
      setIsAdmin(Boolean(admin));
      setReferralCount(referralResult.count ?? 0);

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

  const referralCode = profile?.stuff_id ?? "";
  const referralLink = useMemo(() => {
    if (typeof window === "undefined" || !referralCode) return "";
    return `${window.location.origin}/auth?ref=${encodeURIComponent(referralCode)}`;
  }, [referralCode]);

  async function copy(value: string, message: string) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
    } catch {
      toast.error("Impossible de copier automatiquement.");
    }
  }

  async function shareReferral() {
    if (!referralLink) return;
    const text = `Rejoins STUFF MARKET avec mon code ${referralCode} : ${referralLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }

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
      const { error: verifyError } = await supabase.auth.signInWithPassword({ email: userEmail, password: oldPassword });
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

  async function logout() {
    await supabase.auth.signOut();
    toast.success("Déconnexion réussie.");
    navigate({ to: "/" });
  }

  if (loading) {
    return <AppLayout><div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground">Chargement des réglages...</div></AppLayout>;
  }

  if (!userEmail) {
    return (
      <AppLayout>
        <section className="rounded-[2rem] border border-red-100 bg-white p-6 shadow-sm">
          <div className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-primary">STUFF MARKET</div>
          <h1 className="text-2xl font-black">Réglages du compte</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Connecte-toi pour accéder aux informations et réglages de ton compte.</p>
          <Link to="/auth" className="mt-5 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-black text-primary-foreground">Se connecter</Link>
        </section>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        <section className="rounded-[2rem] bg-primary p-5 text-primary-foreground shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/75">STUFF MARKET</div>
              <h1 className="mt-1 text-2xl font-black">Réglages</h1>
              <p className="mt-1 text-sm text-white/80">Compte, sécurité et parrainage.</p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15"><Settings2 className="h-6 w-6" /></div>
          </div>
        </section>

        <section className="rounded-[1.6rem] border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">Mon compte</h2>
              <p className="mt-1 text-sm text-muted-foreground">Ton identifiant public est ton Stuff ID.</p>
            </div>
            {profile?.stuff_id && <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-black text-primary">{profile.stuff_id}</span>}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Info label="E-mail" value={profile?.email || userEmail} />
            <Info label="WhatsApp" value={profile?.whatsapp_phone} />
            <Info label="Pays" value={profile?.whatsapp_country_code ? `+${profile.whatsapp_country_code}` : "Burkina Faso par défaut"} />
            <Info label="Région" value={regionName || "Non renseignée"} />
            <Info label="Province" value={provinceName || "Non renseignée"} />
            <Info label="Localisation" value={profile?.locality || profile?.city} />
          </div>
        </section>

        <section className="rounded-[1.6rem] border border-red-100 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Gift className="h-5 w-5" /></div>
            <div className="min-w-0">
              <h2 className="text-lg font-black">Mon parrainage</h2>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">Partage ton code et gagne des boosts quand des personnes rejoignent STUFF MARKET avec ton parrainage.</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-[#fff5f5] p-4">
            <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Code de parrainage</div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="text-xl font-black tracking-widest text-primary">{referralCode || "—"}</span>
              <button type="button" onClick={() => copy(referralCode, "Code copié.")} className="rounded-full bg-primary p-2.5 text-primary-foreground" aria-label="Copier le code"><Copy className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-border p-3">
            <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Lien de parrainage</div>
            <div className="mt-2 flex gap-2">
              <input readOnly value={referralLink} className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-2 text-xs" />
              <button type="button" onClick={() => copy(referralLink, "Lien copié.")} className="rounded-xl border border-border px-3 text-primary"><Copy className="h-4 w-4" /></button>
            </div>
          </div>

          <button type="button" onClick={shareReferral} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground">
            <Share2 className="h-4 w-4" /> Partager sur WhatsApp
          </button>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-muted p-3"><div className="text-xl font-black">{referralCount}</div><div className="text-[10px] font-bold text-muted-foreground">Parrainés</div></div>
            <div className="rounded-2xl bg-muted p-3"><div className="text-xl font-black">{referralCount >= 1 ? "24 h" : "—"}</div><div className="text-[10px] font-bold text-muted-foreground">1er palier</div></div>
            <div className="rounded-2xl bg-muted p-3"><div className="text-xl font-black">{referralCount >= 5 ? "7 j" : "—"}</div><div className="text-[10px] font-bold text-muted-foreground">5 parrainés</div></div>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">1 parrainage validé = 24 h de boost. 5 parrainages validés = 7 jours de boost. Les crédits sont séparés des boosts payants.</p>
        </section>

        <section className="rounded-[1.6rem] border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div><h2 className="text-lg font-black">Sécurité</h2><p className="mt-1 text-sm text-muted-foreground">Modifie ton mot de passe.</p></div>
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <button type="button" onClick={() => setShowPasswordForm((v) => !v)} className="mt-4 rounded-full border border-border px-4 py-2 text-sm font-bold">{showPasswordForm ? "Fermer" : "Changer le mot de passe"}</button>
          {showPasswordForm && (
            <div className="mt-4 space-y-3">
              <input type="password" placeholder="Ancien mot de passe" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm" />
              <input type="password" placeholder="Nouveau mot de passe" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm" />
              <input type="password" placeholder="Confirmer le nouveau mot de passe" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm" />
              <button type="button" disabled={savingPassword} onClick={changePassword} className="rounded-full bg-primary px-5 py-3 text-sm font-black text-primary-foreground">{savingPassword ? "Vérification..." : "Modifier le mot de passe"}</button>
            </div>
          )}
        </section>

        {isAdmin && (
          <section className="rounded-[1.6rem] border border-red-100 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-black">Espace administrateur</h2>
            <p className="mt-1 text-sm text-muted-foreground">Gestion des annonces, services, utilisateurs, boosts et réglages.</p>
            <Link to="/admin" className="mt-4 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-black text-primary-foreground">Ouvrir l'administration →</Link>
          </section>
        )}

        <section className="rounded-[1.6rem] border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Connecté avec {userEmail}</p>
          <button type="button" onClick={logout} className="mt-4 inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2.5 text-sm font-black text-primary"><LogOut className="h-4 w-4" /> Se déconnecter</button>
        </section>
      </div>
    </AppLayout>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return <div className="rounded-2xl border border-border bg-background p-3"><div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{label}</div><div className="mt-1 break-words text-sm font-bold">{value?.trim() || "Non renseigné"}</div></div>;
}
