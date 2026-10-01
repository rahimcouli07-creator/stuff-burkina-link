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
        content: "Découvrez les services proposés sur STUFF MARKET.",
      },
    ],
  }),
  component: ServicesPage,
});

const ADMIN_CONTACTS = ["22664601944", "22650627002"];

function ServicesPage() {
  const services = useQuery({
    queryKey: ["services"],
    queryFn: fetchServices,
  });

  const liste = (services.data ?? []).filter(
    (service) => service.status !== "inactive" && service.status !== "unavailable",
  );

  const contactMessage = encodeURIComponent(
    "Bonjour Stuff Market, je souhaite demander la mise en ligne d'un service.",
  );

  return (
    <AppLayout>
      <div className="space-y-5">
        <section className="rounded-[2rem] bg-primary p-5 text-primary-foreground shadow-lg sm:p-7">
          <div className="mb-2 text-xs font-black tracking-[0.18em] text-white/75">
            STUFF MARKET • SERVICES
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            Trouvez un professionnel pour vos besoins
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/80">
            Cette rubrique permet de découvrir des services proposés par des professionnels :
            plomberie, maçonnerie, soudure, coiffure, couture, menuiserie, électricité,
            réparation, entretien et bien d'autres métiers.
          </p>
          <p className="mt-3 text-sm font-semibold leading-6 text-white">
            Vous souhaitez mettre votre propre service en ligne ? Contactez les administrateurs
            de Stuff Market afin de demander sa publication.
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {ADMIN_CONTACTS.map((number) => (
              <a
                key={number}
                href={`https://wa.me/${number}?text=${contactMessage}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-bold text-primary transition hover:-translate-y-0.5"
              >
                Contacter l'administrateur sur WhatsApp
                <span className="mt-1 block text-xs font-medium opacity-80">
                  +{number.slice(0, 3)} {number.slice(3)}
                </span>
              </a>
            ))}
          </div>
        </section>

        <h2 className="text-lg font-extrabold text-foreground">Services disponibles</h2>

        {services.isLoading && (
          <p className="text-sm text-muted-foreground">Chargement...</p>
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
              <article key={service.id} className="overflow-hidden rounded-[1.35rem] border border-border bg-card shadow-sm">
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base font-bold text-foreground">{service.title}</h2>
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
                    <p className="whitespace-pre-line text-sm text-muted-foreground">
                      📍 {service.location}
                    </p>
                  )}

                  {service.allow_negotiation && (
                    <p className="text-xs font-semibold text-muted-foreground">
                      Prix négociable
                    </p>
                  )}

                  <a
                    href={`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${message}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
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
