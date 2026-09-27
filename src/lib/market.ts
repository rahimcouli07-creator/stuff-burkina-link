import { supabase } from "@/integrations/supabase/client";

export const ADMIN_WHATSAPP = "22664601944";
export const PAYMENT_NUMBER = "64601944";

export type Annonce = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  price: number | null;
  location: string | null;
  whatsapp_phone: string | null;
  created_at: string;
  updated_at: string;
  photo_urls: string[] | null;
  business_id: string | null;
  auction_enabled: boolean;
  auction_start_price: number | null;
  auction_end_at: string | null;
  reference: string | null;
  allow_negotiation: boolean;
  status: string | null;
  trade_enabled: boolean;
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

export async function fetchAnnonces() {
  const { data, error } = await supabase
    .from("ads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as Annonce[];
}

export async function fetchAnnonce(id: string) {
  const { data, error } = await supabase
    .from("ads")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;

  return data as Annonce | null;
}

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

/**
 * Upload d'une photo de produit.
 *
 * Le chemin commence obligatoirement par l'UUID de l'utilisateur
 * afin de respecter les politiques RLS du bucket product-images.
 */
export async function uploadImage(file: File, userId: string) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";

  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "image/jpeg",
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from("product-images")
    .getPublicUrl(path);

  return data.publicUrl;
}