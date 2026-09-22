import { supabase } from "@/integrations/supabase/client";

export const ADMIN_PASSWORD = "Stuff2025";
export const ADMIN_WHATSAPP = "22664601944";
export const PAYMENT_NUMBER = "07XXXXXXX";

export type Annonce = {
  id: string;
  titre: string;
  description: string | null;
  categorie: string | null;
  etat: string | null;
  prix: number;
  region: string | null;
  ville: string | null;
  whatsapp: string;
  image_url: string | null;
  is_boosted: boolean;
  created_at: string;
};

export function formatPrix(prix: number) {
  return new Intl.NumberFormat("fr-FR").format(prix) + " FCFA";
}

export function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

export async function fetchAnnonces() {
  const { data, error } = await supabase
    .from("annonces")
    .select("*")
    .order("is_boosted", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Annonce[];
}

export async function fetchAnnonce(id: string) {
  const { data, error } = await supabase.from("annonces").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Annonce | null;
}

export async function fetchRegions() {
  const { data, error } = await supabase.from("regions").select("*").order("nom");
  if (error) throw error;
  return (data ?? []) as { id: string; nom: string }[];
}

export async function fetchVilles() {
  const { data, error } = await supabase.from("villes").select("*").order("nom_ville");
  if (error) throw error;
  return (data ?? []) as { id: string; nom_ville: string; region: string }[];
}

export async function fetchCategories() {
  const { data, error } = await supabase.from("categories").select("*").order("nom");
  if (error) throw error;
  return (data ?? []) as { id: string; nom: string }[];
}

export async function uploadImage(file: File) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data, error: signError } = await supabase.storage
    .from("images")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (signError) throw signError;
  return data.signedUrl;
}
