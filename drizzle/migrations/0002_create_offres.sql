CREATE TABLE public.offres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  description text,
  image_url text,
  prix integer,
  whatsapp text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.offres TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offres TO authenticated;
GRANT ALL ON public.offres TO service_role;

ALTER TABLE public.offres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public all offres" ON public.offres FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX offres_created_at_idx ON public.offres (created_at DESC);