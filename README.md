# Stuff Market Burkina

Crée une application PWA complète nommée Stuff Market - Marketplace seconde main Burkina Faso. Mobile first, rapide, moderne, couleurs Burkina, AUCUN watermark, installable Android.



1. BASE DE DONNÉES SUPABASE (OBLIGATOIRE) :

Connecte Supabase. Crée ces tables exactement :

annonces : id uuid primary, titre text, description text, categorie text, etat text, prix int, region text, ville text, whatsapp text, image_url text, is_boosted boolean default false, created_at timestamp default now()

villes : id uuid, nom_ville text, region text

categories : id uuid, nom text



Active Realtime sur annonces et crée un bucket Storage images public.

Insère : Régions = Centre, Hauts-Bassins, Boucle du Mouhoun, Cascades, Centre-Est, Centre-Nord, Centre-Ouest, Centre-Sud, Est, Nord, Plateau-Central, Sahel, Sud-Ouest. Villes = Ouagadougou, Bobo-Dioulasso, Koudougou, Banfora, Ouahigouya, Kaya, Tenkodogo, Fada, Dédougou, Dori, Gaoua, Ziniaré, Manga. Catégories = Livres, Tenues, Chaussures, Fournitures, Téléphones, Autres.



2. LOGO :

Génère un logo circulaire : moitié haute Rouge #EF2B2D, moitié basse Verte #009E49, grosse lettre S Jaune #FCD116 au centre dont le haut forme l'anse d'un sac, petite étoile jaune en bas à droite. Utilise ce logo pour header, favicon, et manifest icons. Style flat, sans ombre.



3. PAGES :



A. ACCUEIL (page principale) : Filtres en haut : Région dropdown, Ville dropdown (filtré par région), Catégorie dropdown, Recherche. Affiche depuis Supabase les annonces. Si ville sélectionnée, affiche QUE les annonces de cette ville. Les is_boosted=true en premier avec badge jaune "À LA UNE". Grid : photo, titre, prix FCFA, ville.



B. PUBLIER (/publier) : Bouton flottant "+ Publier". Formulaire : Image upload vers Storage, Titre, Description, Catégorie, État (Neuf/Occasion), Prix, Région, Ville, WhatsApp avec +226. Insert dans Supabase.



C. DÉTAIL (/annonce/:id) : Grande image, infos, bouton vert "Contacter sur WhatsApp" qui ouvre wa.me



D. MES ANNONCES (/mes-annonces) : Input pour entrer son numéro WhatsApp, affiche ses annonces, bouton Supprimer. CODE PROPRE, attention aux virgules.



E. BOOST (/boost/:id) : Affiche 500F / 7 jours et 1000F / 1 mois. Texte : "Dépôt Orange Money / Moov au 07XXXXXXX puis envoie capture sur WhatsApp Admin". Bouton "J'ai payé".



F. AIDE (/aide) : Page simple qui explique comment publier, filtrer par ville, contacter.



G. PARAMÈTRES (/parametres) : Affiche infos + tout en bas lien discret "Admin". Au clic demande mot de passe : Stuff2025.



H. ADMIN (/admin) : Protégé par mot de passe Stuff2025. Liste toutes les annonces avec bouton supprimer et toggle boost (is_boosted). CRUD pour villes/regions et catégories. Stats.



4. PWA : manifest.json name Stuff Market display standalone icons logo, service-worker.js. Thème Burkina Rouge/Vert/Jaune.



Code propre sans erreur de syntaxe, testé.

---

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://stuff-burkina-link.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/51beff61-5343-4333-9cde-e3e00688f089).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
