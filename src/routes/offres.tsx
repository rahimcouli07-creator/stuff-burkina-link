import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { ADMIN_WHATSAPP, fetchServices, formatPrix } from "@/lib/market";

export const Route = createFileRoute("/offres")({
  head: () => ({
    meta: [
      { title: "Services | Stuff Market" },
      {
        name: "description",
        content: "Découvrez les services proposés sur Stuff Market au Burkina Faso.",
      },
      { property: "og:title", content: "Services | Stuff Market" },
      {
        property: "og:description",
        content: "Découvrez les services proposés sur Stuff Market.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const services = useQuery({
    queryKey: ["services"],
    queryFn: fetchServices,
  });

  const liste = (services.data ?? []).filter(
    (service) => service.status !== "inactive",
  );

  return (
    <AppLayout>
      <div className="space-y-4">
        <h1 className="text-xl font-extrabold text-foreground">
          Services
        </h1>

        {services.isLoading && (
          <p className="text-sm text-muted-foreground">
            Chargement...
          </p>
        )}

        {services.isError && (
          <p className="rounded-2xl border border-destructive/20 bg-card p-4 text-sm text-destructive">
            Impossible de charger les services pour le moment.
          </p>
        )}

        {!services.isLoading && !services.isError && liste.length === 0 && (
          <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Aucun service disponible pour le moment. Revenez bientôt !
          </p>
        )}

        <div className="space-y-3">
          {liste.map((service) => {
            const whatsapp = service.whatsapp_phone || ADMIN_WHATSAPP;

            const message = encodeURIComponent(
              `Bonjour, je suis intéressé par le service : ${service.title}`,
            );

            return (
              <article
                key={service.id}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base font-bold text-foreground">
                      {service.title}
                    </h2>

                    {service.category && (
                      <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                        {service.category}
                      </span>
                    )}
                  </div>

                  {service.price != null && (
                    <p className="text-sm font-black text-primary">
                      {formatPrix(Number(service.price))}
                    </p>
                  )}

                  {service.description && (
                    <p className="whitespace-pre-line text-sm text-muted-foreground">
                      {service.description}
                    </p>
                  )}

                  {service.location && (
                    <p className="text-sm text-muted-foreground">
                      📍 {service.location}
                    </p>
                  )}

                  {service.allow_negotiation && (
                    <p className="text-xs font-semibold text-muted-foreground">
                      Prix négociable
                    </p>
                  )}

                  <a
                    href={`https://wa.me/${whatsapp.replace(
                      /\D/g,
                      "",
                    )}?text=${message}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-xl bg-accent px-4 py-2 text-sm font-bold text-accent-foreground"
                  >
                    Contacter sur WhatsApp
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}