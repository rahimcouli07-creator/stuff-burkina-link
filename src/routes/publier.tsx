import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/publier")({
  component: PublierPage,
});

type Mode = "choice" | "product" | "business";
type Region = { id: string; name: string };
type Province = { id: string; name: string; region_id: string };

const PRODUCT_CATEGORIES = ["Téléphones", "Informatique", "Électronique", "Maison", "Mode", "Véhicules", "Immobilier", "Services", "Autre"];
const BUSINESS_CATEGORIES = ["Commerce", "Restaurant", "Mode", "Technologie", "Beauté", "Transport", "Immobilier", "Services", "Autre"];

async function uploadPublicFile(bucket: string, file: File, userId: string) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

function PublierPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("choice");
  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
      setChecking(false);
    });
  }, []);

  if (checking) return <main style={styles.page}><div style={styles.center}>Chargement...</div></main>;

  if (!userId) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <div style={styles.logo}>STUFF MARKET</div>
          <h1 style={styles.title}>Publier une annonce</h1>
          <p style={styles.muted}>Connecte-toi pour publier un produit ou créer une boutique.</p>
          <div style={styles.actions}>
            <Link to="/auth" style={styles.primary}>Créer un compte / Se connecter</Link>
            <Link to="/" style={styles.secondary}>Retour à l'accueil</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <Link to="/" style={styles.back}>← Retour à l'accueil</Link>
        {mode === "choice" && <Choice onProduct={() => setMode("product")} onBusiness={() => setMode("business")} />}
        {mode === "product" && <ProductForm userId={userId} onBack={() => setMode("choice")} onDone={() => navigate({ to: "/" })} />}
        {mode === "business" && <BusinessForm userId={userId} onBack={() => setMode("choice")} onDone={() => navigate({ to: "/" })} />}
      </div>
    </main>
  );
}

function Choice({ onProduct, onBusiness }: { onProduct: () => void; onBusiness: () => void }) {
  return (
    <section style={styles.card}>
      <div style={styles.logo}>STUFF MARKET</div>
      <h1 style={styles.title}>Que veux-tu publier ?</h1>
      <p style={styles.muted}>Choisis le type de publication que tu veux mettre en ligne.</p>
      <div style={styles.choiceGrid}>
        <button type="button" onClick={onProduct} style={styles.choiceButton}>
          <span style={styles.choiceIcon}>📦</span>
          <strong>Produit simple</strong>
          <small>Publier un produit avec jusqu'à 3 photos.</small>
        </button>
        <button type="button" onClick={onBusiness} style={styles.choiceButton}>
          <span style={styles.choiceIcon}>🏪</span>
          <strong>Boutique / Entreprise</strong>
          <small>Présenter une boutique ou une entreprise avec jusqu'à 1 000 photos et 30 vidéos.</small>
        </button>
      </div>
    </section>
  );
}

function useLocations() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("regions").select("id,name").order("name"),
      supabase.from("provinces").select("id,name,region_id").order("name"),
    ]).then(([regionsResult, provincesResult]) => {
      setRegions((regionsResult.data ?? []) as Region[]);
      setProvinces((provincesResult.data ?? []) as Province[]);
    });
  }, []);

  return { regions, provinces };
}

function ProductForm({ userId, onBack, onDone }: { userId: string; onBack: () => void; onDone: () => void }) {
  const { regions, provinces } = useLocations();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(PRODUCT_CATEGORIES[0]);
  const [price, setPrice] = useState("");
  const [regionId, setRegionId] = useState("");
  const [provinceId, setProvinceId] = useState("");
  const [location, setLocation] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [allowNegotiation, setAllowNegotiation] = useState(true);
  const [tradeEnabled, setTradeEnabled] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const filteredProvinces = useMemo(
    () => provinces.filter((province) => province.region_id === regionId),
    [provinces, regionId],
  );
  const regionName = regions.find((region) => region.id === regionId)?.name ?? "";
  const provinceName = filteredProvinces.find((province) => province.id === provinceId)?.name ?? "";

  function changeRegion(value: string) {
    setRegionId(value);
    setProvinceId("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !price || !regionId || !provinceId || !location.trim() || !whatsapp.trim()) {
      toast.error("Remplis tous les champs obligatoires.");
      return;
    }
    if (files.length > 3) {
      toast.error("Maximum 3 photos pour un produit.");
      return;
    }

    setSaving(true);
    try {
      const photoUrls: string[] = [];
      for (const file of files) photoUrls.push(await uploadPublicFile("product-images", file, userId));

      const structuredLocation = `Région: ${regionName} | Province: ${provinceName} | Localisation: ${location.trim()}`;
      const reference = `SM-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const { error } = await supabase.from("ads").insert({
        user_id: userId,
        title: title.trim(),
        description: description.trim(),
        category,
        price: Number(price),
        location: structuredLocation,
        whatsapp_phone: whatsapp.trim(),
        photo_urls: photoUrls,
        allow_negotiation: allowNegotiation,
        trade_enabled: tradeEnabled,
        status: "available",
        reference,
      });

      if (error) throw error;
      toast.success("Produit publié avec succès.");
      onDone();
    } catch (error: any) {
      toast.error(error?.message || "Impossible de publier le produit.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section style={styles.card}>
      <button type="button" onClick={onBack} style={styles.backButton}>← Changer de type</button>
      <h1 style={styles.title}>Publier un produit simple</h1>
      <p style={styles.muted}>Choisis le pays et la région, puis précise le quartier, secteur, village ou autre localisation.</p>

      <form onSubmit={submit} style={styles.form}>
        <Field label="Nom du produit *" value={title} onChange={setTitle} />
        <Field label="Description *" value={description} onChange={setDescription} multiline />
        <SelectField label="Catégorie" value={category} onChange={setCategory} options={PRODUCT_CATEGORIES} />
        <Field label="Prix (FCFA) *" value={price} onChange={setPrice} type="number" />

        <SelectField label="Région *" value={regionId} onChange={changeRegion} options={regions.map((r) => ({ value: r.id, label: r.name }))} placeholder="Choisir une région" />
        <SelectField label="Province *" value={provinceId} onChange={setProvinceId} options={filteredProvinces.map((p) => ({ value: p.id, label: p.name }))} placeholder={regionId ? "Choisir une province" : "Choisis d'abord une région"} disabled={!regionId} />

        <Field label="Localisation *" value={location} onChange={setLocation} placeholder="Quartier, secteur, village, commune..." />
        <Field label="WhatsApp *" value={whatsapp} onChange={setWhatsapp} placeholder="+226..." />

        <label style={styles.check}><input type="checkbox" checked={allowNegotiation} onChange={(e) => setAllowNegotiation(e.target.checked)} /> Autoriser le marchandage</label>
        <label style={styles.check}><input type="checkbox" checked={tradeEnabled} onChange={(e) => setTradeEnabled(e.target.checked)} /> Accepter les propositions de troc</label>

        <label style={styles.label}>
          Photos (maximum 3)
          <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 3))} style={styles.file} />
        </label>

        <button disabled={saving} type="submit" style={styles.primary}>{saving ? "Publication..." : "Publier le produit"}</button>
      </form>
    </section>
  );
}

function BusinessForm({ userId, onBack, onDone }: { userId: string; onBack: () => void; onDone: () => void }) {
  const { regions, provinces } = useLocations();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [locationDescription, setLocationDescription] = useState("");
  const [category, setCategory] = useState(BUSINESS_CATEGORIES[0]);
  const [regionId, setRegionId] = useState("");
  const [provinceId, setProvinceId] = useState("");
  const [exactLocation, setExactLocation] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const filteredProvinces = useMemo(
    () => provinces.filter((province) => province.region_id === regionId),
    [provinces, regionId],
  );
  const regionName = regions.find((region) => region.id === regionId)?.name ?? "";
  const provinceName = filteredProvinces.find((province) => province.id === provinceId)?.name ?? "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !regionId || !provinceId || !exactLocation.trim() || !locationDescription.trim() || !whatsapp.trim()) {
      toast.error("Remplis les champs obligatoires.");
      return;
    }
    if (files.length > 1000) {
      toast.error("Maximum 1 000 photos pour une boutique.");
      return;
    }
    if (videoFiles.length > 30) {
      toast.error("Maximum 30 vidéos pour une boutique.");
      return;
    }

    setSaving(true);
    try {
      const photoUrls: string[] = [];
      for (const file of files) photoUrls.push(await uploadPublicFile("business-images", file, userId));
      const videoUrls: string[] = [];
      for (const file of videoFiles) videoUrls.push(await uploadPublicFile("business-images", file, userId));

      // Les colonnes existantes de businesses sont conservées :
      // region/province sont mémorisées dans city et la localisation détaillée dans address.
      const city = `${regionName} — ${provinceName}`;
      const address = `Localisation exacte : ${exactLocation.trim()}\n\nComment trouver la boutique : ${locationDescription.trim()}`;

      const { error } = await supabase.from("businesses").insert({
        user_id: userId,
        name: name.trim(),
        description: description.trim(),
        category,
        city,
        address,
        whatsapp_phone: whatsapp.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        website: website.trim() || null,
        photo_urls: photoUrls,
        video_urls: videoUrls,
        status: "active",
      });

      if (error) throw error;
      toast.success("Boutique / entreprise créée avec succès.");
      onDone();
    } catch (error: any) {
      toast.error(error?.message || "Impossible de créer la boutique.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section style={styles.card}>
      <button type="button" onClick={onBack} style={styles.backButton}>← Changer de type</button>
      <h1 style={styles.title}>Créer une boutique / entreprise</h1>
      <p style={styles.muted}>Présente ton activité et indique précisément où les clients peuvent te trouver.</p>

      <form onSubmit={submit} style={styles.form}>
        <Field label="Nom de la boutique / entreprise *" value={name} onChange={setName} />
        <Field label="Description de l'activité / des produits *" value={description} onChange={setDescription} multiline />
        <SelectField label="Catégorie" value={category} onChange={setCategory} options={BUSINESS_CATEGORIES} />

        <SelectField label="Région *" value={regionId} onChange={(value) => { setRegionId(value); setProvinceId(""); }} options={regions.map((r) => ({ value: r.id, label: r.name }))} placeholder="Choisir une région" />
        <SelectField label="Province *" value={provinceId} onChange={setProvinceId} options={filteredProvinces.map((p) => ({ value: p.id, label: p.name }))} placeholder={regionId ? "Choisir une province" : "Choisis d'abord une région"} disabled={!regionId} />

        <Field label="Localisation exacte de la boutique / entreprise *" value={exactLocation} onChange={setExactLocation} placeholder="Quartier, secteur, rue, repère..." />
        <Field label="Description de la localisation *" value={locationDescription} onChange={setLocationDescription} multiline placeholder="Explique comment trouver facilement la boutique ou l'entreprise." />

        <div style={styles.helpBox}>
          <strong>Site web (facultatif)</strong>
          <span>Si votre entreprise possède un site Internet, indiquez son adresse ici. Sinon, vous pouvez laisser ce champ vide.</span>
        </div>

        <Field label="WhatsApp *" value={whatsapp} onChange={setWhatsapp} placeholder="+226..." />
        <Field label="Téléphone" value={phone} onChange={setPhone} />
        <Field label="Email" value={email} onChange={setEmail} type="email" />
        <Field label="Site web (facultatif)" value={website} onChange={setWebsite} placeholder="https://..." />

        <label style={styles.label}>
          Photos (maximum 1 000)
          <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 1000))} style={styles.file} />
        </label>
        <label style={styles.label}>
          Vidéos (maximum 30)
          <input type="file" accept="video/*" multiple onChange={(e) => setVideoFiles(Array.from(e.target.files ?? []).slice(0, 30))} style={styles.file} />
        </label>

        <button disabled={saving} type="submit" style={styles.primary}>{saving ? "Création..." : "Créer la boutique / entreprise"}</button>
      </form>
    </section>
  );
}

function Field({ label, value, onChange, type = "text", placeholder = "", multiline = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; multiline?: boolean }) {
  return (
    <label style={styles.label}>
      {label}
      {multiline ? <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ ...styles.input, minHeight: 120, resize: "vertical" }} /> : <input value={value} onChange={(e) => onChange(e.target.value)} type={type} placeholder={placeholder} style={styles.input} />}
    </label>
  );
}

function SelectField({ label, value, onChange, options, placeholder, disabled = false }: { label: string; value: string; onChange: (v: string) => void; options: Array<string | { value: string; label: string }>; placeholder?: string; disabled?: boolean }) {
  return (
    <label style={styles.label}>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} style={{ ...styles.input, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1 }}>
        <option value="">{placeholder ?? "Choisir..."}</option>
        {options.map((option) => typeof option === "string" ? <option key={option} value={option}>{option}</option> : <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

const styles: Record<string, any> = {
  page: { minHeight: "100vh", background: "#fffafa", padding: "22px 14px", color: "#171717" },
  container: { width: "100%", maxWidth: 900, margin: "0 auto" },
  center: { maxWidth: 900, margin: "80px auto", textAlign: "center" },
  card: { background: "#ffffff", border: "1px solid #fee2e2", borderRadius: 28, padding: 22, marginBottom: 18, boxShadow: "0 16px 45px rgba(180,20,20,.08)" },
  logo: { fontSize: 12, letterSpacing: 2.5, fontWeight: 900, color: "#dc2626", marginBottom: 10 },
  back: { color: "#6b7280", textDecoration: "none", display: "inline-block", marginBottom: 14, fontWeight: 700 },
  backButton: { border: "1px solid #fecaca", background: "#fff5f5", color: "#dc2626", padding: "9px 12px", borderRadius: 999, fontWeight: 800, cursor: "pointer" },
  title: { fontSize: 30, margin: "12px 0 8px", fontWeight: 900, letterSpacing: -0.7 },
  muted: { margin: 0, color: "#6b7280", lineHeight: 1.6 },
  choiceGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 14, marginTop: 22 },
  choiceButton: { textAlign: "left", display: "grid", gap: 8, padding: 20, borderRadius: 22, border: "1px solid #fee2e2", background: "#fffafa", color: "#171717", cursor: "pointer", boxShadow: "0 8px 24px rgba(180,20,20,.06)" },
  choiceIcon: { fontSize: 32 },
  form: { display: "grid", gap: 14, marginTop: 20 },
  label: { display: "grid", gap: 7, color: "#27272a", fontWeight: 800 },
  input: { width: "100%", boxSizing: "border-box", background: "#ffffff", color: "#171717", border: "1px solid #e5e7eb", borderRadius: 15, padding: "12px 13px", outline: "none" },
  check: { display: "flex", alignItems: "center", gap: 8, color: "#3f3f46", fontWeight: 700 },
  file: { padding: 10, border: "1px dashed #fca5a5", borderRadius: 15, background: "#fffafa" },
  actions: { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 20 },
  primary: { display: "inline-block", border: 0, background: "#dc2626", color: "white", padding: "12px 16px", borderRadius: 999, fontWeight: 900, textDecoration: "none", cursor: "pointer" },
  secondary: { display: "inline-block", border: "1px solid #fecaca", background: "#fff5f5", color: "#dc2626", padding: "12px 16px", borderRadius: 999, fontWeight: 800, textDecoration: "none" },
  helpBox: { display: "grid", gap: 4, padding: 14, borderRadius: 16, background: "#fff5f5", border: "1px solid #fee2e2", color: "#52525b" },
};
