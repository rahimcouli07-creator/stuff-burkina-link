CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

ALTER TABLE public.annonces ADD COLUMN user_id uuid DEFAULT auth.uid();
ALTER TABLE public.offres ADD COLUMN user_id uuid DEFAULT auth.uid();
CREATE INDEX annonces_user_id_idx ON public.annonces(user_id);
CREATE INDEX offres_user_id_idx ON public.offres(user_id);

DROP POLICY "public all annonces" ON public.annonces;
DROP POLICY "public all offres" ON public.offres;
DROP POLICY "public all villes" ON public.villes;
DROP POLICY "public all regions" ON public.regions;
DROP POLICY "public all categories" ON public.categories;

REVOKE ALL ON public.annonces, public.offres, public.villes, public.regions, public.categories FROM anon, authenticated;
GRANT SELECT ON public.annonces, public.offres, public.villes, public.regions, public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.annonces, public.offres, public.villes, public.regions, public.categories TO authenticated;
GRANT ALL ON public.annonces, public.offres, public.villes, public.regions, public.categories TO service_role;

CREATE POLICY "annonces read" ON public.annonces FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "annonces insert own" ON public.annonces FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "annonces update own or admin" ON public.annonces FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "annonces delete own or admin" ON public.annonces FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "offres read" ON public.offres FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "offres insert own" ON public.offres FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "offres update own or admin" ON public.offres FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "offres delete own or admin" ON public.offres FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "villes read" ON public.villes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "villes admin write" ON public.villes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "regions read" ON public.regions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "regions admin write" ON public.regions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "categories read" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "categories admin write" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));