import { Link } from "@tanstack/react-router";

export function LoginRequired({ message }: { message: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-5 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Link to="/auth" className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
        Se connecter
      </Link>
    </div>
  );
}
