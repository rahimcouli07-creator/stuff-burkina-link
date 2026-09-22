CREATE TABLE public.annonces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  description text,
  categorie text,
  etat text,
  prix int NOT NULL DEFAULT 0,
  region text,
  ville text,
  whatsapp text NOT NULL,
  image_url text,
  is_boosted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.villes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_ville text NOT NULL,
  region text NOT NULL
);

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL
);

CREATE TABLE public.regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.annonces TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.villes TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.regions TO anon, authenticated;
GRANT ALL ON public.annonces TO service_role;
GRANT ALL ON public.villes TO service_role;
GRANT ALL ON public.categories TO service_role;
GRANT ALL ON public.regions TO service_role;

ALTER TABLE public.annonces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.villes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public all annonces" ON public.annonces FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public all villes" ON public.villes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public all categories" ON public.categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public all regions" ON public.regions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.annonces;
ALTER TABLE public.annonces REPLICA IDENTITY FULL;

CREATE INDEX idx_annonces_ville ON public.annonces (ville);
CREATE INDEX idx_annonces_created ON public.annonces (created_at DESC);