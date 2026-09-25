import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LoginRequired } from "@/components/LoginRequired";

// Accès admin vérifié par la base (rôle administrateur), plus de mot de passe dans le code.
export function PasswordGate({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <p className="mt-6 text-sm text-muted-foreground">Chargement...</p>;
  if (!user) return <LoginRequired message="Connectez-vous avec le compte administrateur." />;
  if (!isAdmin)
    return (
      <p className="mt-6 text-sm text-destructive">Ce compte n'a pas les droits administrateur.</p>
    );
  return <>{children}</>;
}
