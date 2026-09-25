import { supabase } from "@/integrations/supabase/client";

export const ADMIN_WHATSAPP = "22664601944";
export const PAYMENT_NUMBER = "64601944";

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

export type Service = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  price: number | null;
  whatsapp_phone: string | null;
  created_at: string;
  updated_at: string;
  reference: string | null;
  allow_negotiation: boolean;
  location: string | null;
  status: string | null;
};

export async function fetchServices() {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as Service[];
}

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
  const { data, error } = await supabase
    .from("annonces")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;

  return data as Annonce | null;
}

export async function fetchRegions() {
  const { data, error } = await supabase
    .from("regions")
    .select("*")
    .order("nom");

  if (error) throw error;

  return (data ?? []) as { id: string; nom: string }[];
}

export async function fetchVilles() {
  const { data, error } = await supabase
    .from("villes")
    .select("*")
    .order("nom_ville");

  if (error) throw error;

  return (data ?? []) as {
    id: string;
    nom_ville: string;
    region: string;
  }[];
}

export async function fetchCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("nom");

  if (error) throw error;

  return (data ?? []) as { id: string; nom: string }[];
}

export async function uploadImage(file: File) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("images")
    .upload(path, file, {
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