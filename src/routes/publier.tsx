import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/publier")({
  component: PublierPage,
});

type Mode = "choice" | "product" | "business";

const PRODUCT_CATEGORIES = ["Téléphones", "Informatique", "Électronique", "Maison", "Mode", "Véhicules", "Immobilier", "Services", "Autre"];
const BUSINESS_CATEGORIES = ["Commerce", "Restaurant", "Mode", "Technologie", "Beauté", "Transport", "Immobilier", "Services", "Autre"];

async function uploadPublicImage(bucket: string, file: File, userId: string) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
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
          <p style={styles.muted}>Tu dois être connecté pour publier un produit ou une boutique.</p>
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
      <p style={styles.muted}>Choisis le type de publication. Tu pourras ensuite remplir le formulaire correspondant.</p>
      <div style={styles.choiceGrid}>
        <button type="button" onClick={onProduct} style={styles.choiceButton}>
          <span style={styles.choiceIcon}>📦</span>
          <strong>Produit simple</strong>
          <small>Publier un produit, avec jusqu'à 3 photos.</small>
        </button>
        <button type="button" onClick={onBusiness} style={styles.choiceButton}>
          <span style={styles.choiceIcon}>🏪</span>
          <strong>Boutique / Entreprise</strong>
          <small>Créer la fiche de ta boutique ou entreprise, avec jusqu'à 40 photos.</small>
        </button>
      </div>
    </section>
  );
}

function ProductForm({ userId, onBack, onDone }: { userId: string; onBack: () => void; onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(PRODUCT_CATEGORIES[0]);
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [allowNegotiation, setAllowNegotiation] = useState(true);
  const [tradeEnabled, setTradeEnabled] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !price || !location.trim() || !whatsapp.trim()) {
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
      for (const file of files) photoUrls.push(await uploadPublicImage("product-images", file, userId));

      const reference = `SM-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const { error } = await supabase.from("ads").insert({
        user_id: userId,
        title: title.trim(),
        description: description.trim(),
        category,
        price: Number(price),
        location: location.trim(),
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
      <p style={styles.muted}>Maximum 3 photos. Le numéro WhatsApp doit être au format international.</p>
      <form onSubmit={submit} style={styles.form}>
        <Field label="Nom du produit *" value={title} onChange={setTitle} />
        <Field label="Description *" value={description} onChange={setDescription} multiline />
        <SelectField label="Catégorie" value={category} onChange={setCategory} options={PRODUCT_CATEGORIES} />
        <Field label="Prix (FCFA) *" value={price} onChange={setPrice} type="number" />
        <Field label="Localisation *" value={location} onChange={setLocation} placeholder="Ville, quartier, secteur..." />
        <Field label="WhatsApp *" value={whatsapp} onChange={setWhatsapp} placeholder="+226..." />
        <label style={styles.check}><input type="checkbox" checked={allowNegotiation} onChange={(e) => setAllowNegotiation(e.target.checked)} /> Autoriser le marchandage</label>
        <label style={styles.check}><input type="checkbox" checked={tradeEnabled} onChange={(e) => setTradeEnabled(e.target.checked)} /> Accepter les propositions de troc</label>
        <label style={styles.label}>Photos (maximum 3)<input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 3))} style={styles.file} /></label>
        <button disabled={saving} type="submit" style={styles.primary}>{saving ? "Publication..." : "Publier le produit"}</button>
      </form>
    </section>
  );
}

function BusinessForm({ userId, onBack, onDone }: { userId: string; onBack: () => void; onDone: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(BUSINESS_CATEGORIES[0]);
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !city.trim() || !whatsapp.trim()) {
      toast.error("Remplis les champs obligatoires.");
      return;
    }
    if (files.length > 40) {
      toast.error("Maximum 40 photos pour une boutique.");
      return;
    }
    setSaving(true);
    try {
      const photoUrls: string[] = [];
      for (const file of files) photoUrls.push(await uploadPublicImage("business-images", file, userId));
      const { error } = await supabase.from("businesses").insert({
        user_id: userId,
        name: name.trim(),
        description: description.trim(),
        category,
        city: city.trim(),
        address: address.trim() || null,
        whatsapp_phone: whatsapp.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        website: website.trim() || null,
        photo_urls: photoUrls,
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
      <p style={styles.muted}>Tu pourras ensuite associer plusieurs produits à cette boutique.</p>
      <form onSubmit={submit} style={styles.form}>
        <Field label="Nom de la boutique / entreprise *" value={name} onChange={setName} />
        <Field label="Description *" value={description} onChange={setDescription} multiline />
        <SelectField label="Catégorie" value={category} onChange={setCategory} options={BUSINESS_CATEGORIES} />
        <Field label="Ville *" value={city} onChange={setCity} />
        <Field label="Adresse / localisation" value={address} onChange={setAddress} />
        <Field label="WhatsApp *" value={whatsapp} onChange={setWhatsapp} placeholder="+226..." />
        <Field label="Téléphone" value={phone} onChange={setPhone} />
        <Field label="Email" value={email} onChange={setEmail} type="email" />
        <Field label="Site web" value={website} onChange={setWebsite} placeholder="https://..." />
        <label style={styles.label}>Photos (maximum 40)<input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 40))} style={styles.file} /></label>
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

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return <label style={styles.label}>{label}<select value={value} onChange={(e) => onChange(e.target.value)} style={styles.input}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "linear-gradient(145deg,#06111f,#0f172a 55%,#07111f)", padding: "26px 15px", color: "#f8fafc" },
  container: { maxWidth: 900, margin: "0 auto" },
  center: { minHeight: "70vh", display: "grid", placeItems: "center", color: "#cbd5e1" },
  card: { background: "rgba(15,23,42,.9)", border: "1px solid rgba(148,163,184,.2)", borderRadius: 24, padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,.2)" },
  logo: { letterSpacing: 2, fontWeight: 900, fontSize: 12, color: "#7dd3fc", marginBottom: 8 },
  title: { fontSize: 30, margin: "8px 0" },
  muted: { color: "#94a3b8", lineHeight: 1.55 },
  back: { display: "inline-block", color: "#cbd5e1", textDecoration: "none", marginBottom: 18 },
  backButton: { border: 0, background: "transparent", color: "#7dd3fc", padding: 0, cursor: "pointer", fontWeight: 800 },
  choiceGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16, marginTop: 25 },
  choiceButton: { textAlign: "left", border: "1px solid #334155", background: "linear-gradient(145deg,#172338,#0f172a)", color: "white", borderRadius: 20, padding: 22, cursor: "pointer", display: "grid", gap: 9, minHeight: 190 },
  choiceIcon: { fontSize: 35 },
  actions: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 },
  primary: { border: 0, background: "#2563eb", color: "white", padding: "13px 17px", borderRadius: 12, fontWeight: 900, cursor: "pointer", textDecoration: "none" },
  secondary: { border: "1px solid #475569", background: "#1e293b", color: "white", padding: "13px 17px", borderRadius: 12, fontWeight: 800, textDecoration: "none" },
  form: { display: "grid", gap: 15, marginTop: 22 },
  label: { display: "grid", gap: 7, color: "#e2e8f0", fontWeight: 700 },
  input: { width: "100%", boxSizing: "border-box", background: "#0a1220", color: "white", border: "1px solid #334155", borderRadius: 12, padding: "12px 13px" },
  file: { color: "#cbd5e1", marginTop: 4 },
  check: { display: "flex", gap: 9, alignItems: "center", color: "#cbd5e1" },
};
