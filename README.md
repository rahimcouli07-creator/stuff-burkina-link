# Stuff Market

Marketplace de seconde main au Burkina Faso (ville par défaut : Tenkodogo). Application web mobile-first installable (PWA via `public/manifest.json`).

## Fonctionnalités actuelles

- **Accueil (`/`)** : filtres Région / Ville / Catégorie / Recherche, annonces boostées en premier (badge « À LA UNE »), mise à jour en temps réel.
- **Publier (`/publier`)** : réservé aux utilisateurs connectés. Photo, titre, description, catégorie, état, prix, région, ville, WhatsApp.
- **Détail (`/annonce/:id`)** : grande image et bouton « Contacter sur WhatsApp ».
- **Mes annonces (`/mes-annonces`)** : annonces du compte connecté, suppression.
- **Boost (`/boost/:id`)** : formules de mise en avant, paiement Orange Money / Moov puis confirmation WhatsApp.
- **Aide (`/aide`)**, **Paramètres (`/parametres`)**, **Connexion (`/auth`)**.
- **Admin (`/admin`)** : accès réservé aux comptes ayant le rôle `admin` dans la table `user_roles` (aucun mot de passe dans le code). Gestion des annonces, boost, régions, villes, catégories.
- **Partager l'appli** : partage natif ou copie du lien + WhatsApp/Facebook.
- **Offres (`/offres`)** : fonctionnalité en cours de retrait (voir ci-dessous).

## Sécurité (Supabase)

- `annonces` : lecture publique ; création par un utilisateur connecté ; modification/suppression par le propriétaire ou un admin.
- `villes`, `regions`, `categories` : lecture publique, écriture admin uniquement.
- Bucket Storage `images` (privé, liens signés) : envoi par utilisateur connecté, suppression par le propriétaire du fichier ou un admin.
- Donner le rôle admin : insérer une ligne `(user_id, 'admin')` dans `public.user_roles` depuis l'éditeur SQL.

## Stack

TanStack Start (React 19, Vite 7), Tailwind CSS v4, Supabase (auth, base, storage, realtime). Migrations SQL dans `drizzle/migrations/`.

## Variables d'environnement

`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` (côté navigateur), `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (côté serveur). Ne jamais exposer de clé `service_role` dans le frontend.

## Développement

```sh
npm i
npm run dev
npm run build
npm run lint
```
