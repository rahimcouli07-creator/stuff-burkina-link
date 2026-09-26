import { supabase } from "@/integrations/supabase/client";

const VISITOR_ID_KEY = "stuff_market_visitor_id";
const LAST_VISIT_KEY = "stuff_market_last_visit";

function getVisitorId(): string {
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }

  return visitorId;
}

function getToday(): string {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function trackVisit(): Promise<void> {
  try {
    const today = getToday();
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY);

    if (lastVisit === today) {
      return;
    }

    const visitorId = getVisitorId();

    const { error } = await supabase.rpc("record_app_visit", {
      p_visitor_id: visitorId,
    });

    if (error) {
      console.error("Erreur lors de l'enregistrement de la visite :", error);
      return;
    }

    localStorage.setItem(LAST_VISIT_KEY, today);
  } catch (error) {
    console.error("Erreur du suivi des visites :", error);
  }
}