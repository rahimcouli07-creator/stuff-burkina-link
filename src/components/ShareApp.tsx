import { useState } from "react";
import { Share2, X } from "lucide-react";
import { toast } from "sonner";

export const SHARE_TITLE = "Stuff Market Tenkodogo";

export function buildShareText(domaine: string) {
  return `🔥 STUFF MARKET TENKODOGO
Le meilleur coin pour acheter et vendre à Tenkodogo, Garango, Koupéla !

📱 Téléphones, 🏍️ Motos, 👕 Vêtements, 👟 Chaussures, tout y est.
Publie en 30 secondes, vends sur WhatsApp en 2 minutes.

👉 Clique ici pour voir : ${domaine}
📲 Partage à tes amis qui veulent vendre vite !`;
}

type Props = {
  variant?: "icon" | "button";
  label?: string;
  className?: string;
};

export function ShareApp({ variant = "icon", label, className = "" }: Props) {
  const [modale, setModale] = useState(false);
  const [lien, setLien] = useState("");

  async function partager() {
    const domaine = typeof window !== "undefined" ? window.location.origin : "";
    setLien(domaine);
    const texte = buildShareText(domaine);

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: SHARE_TITLE, text: texte, url: domaine });
        return;
      } catch {
        // partage annulé : on retombe sur la modale
      }
    }

    try {
      await navigator.clipboard.writeText(domaine);
      toast.success("Lien copié !");
    } catch {
      toast.message(domaine);
    }
    setModale(true);
  }

  const texte = buildShareText(lien);

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={partager}
          aria-label="Partager l'appli"
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground ${className}`}
        >
          <Share2 className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={partager}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-4 text-sm font-extrabold text-accent-foreground ${className}`}
        >
          <Share2 className="h-5 w-5" />
          {label ?? "📤 PARTAGER L'APPLI À UN AMI"}
        </button>
      )}

      {modale ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">Partager l'appli</h2>
              <button
                type="button"
                onClick={() => setModale(false)}
                aria-label="Fermer"
                className="rounded-full p-1 text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 whitespace-pre-line rounded-xl bg-muted p-3 text-xs text-muted-foreground">
              {texte}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(texte)}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-accent px-3 py-2 text-center text-sm font-bold text-accent-foreground"
              >
                WhatsApp
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(lien)}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-border px-3 py-2 text-center text-sm font-bold text-foreground"
              >
                Facebook
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
