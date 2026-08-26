# Couture SaaS (nom a definir)

SaaS B2B pour tailleurs, couturiers et ateliers de confection artisanale. Gestion des clients et de leurs mesures, suivi des commandes en Kanban (Recu -> Coupe -> Couture -> Essayage -> Finitions -> Pret -> Livre), suivi financier des acomptes/soldes, notifications WhatsApp.

## Stack

- Next.js (App Router, TypeScript, Tailwind)
- Supabase (Postgres, Auth, Storage) pour le backend
- PWA offline-first (a venir) pour l'usage terrain avec connexion instable

## Demarrer

1. Creer un projet sur [supabase.com](https://supabase.com)
2. Copier `.env.local.example` vers `.env.local` et renseigner l'URL et la cle anonyme du projet Supabase
3. Dans le SQL editor de Supabase, executer `supabase/migrations/0001_init.sql`
4. Installer les dependances et lancer le serveur de dev :

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Structure

```
src/
  app/            routes (App Router)
  lib/supabase.ts client Supabase partage
supabase/
  migrations/     schema SQL (a appliquer manuellement dans le SQL editor Supabase, ou via la CLI Supabase plus tard)
```

## Tester les migrations

```bash
npm run test:migrations
```

Applique les migrations dans l'ordre a un Postgres neuf, puis exerce les
parcours d'inscription : creation d'atelier, rattachement sur code
d'invitation, codes invalides, atelier plein, inscription par fournisseur
externe, idempotence de `terminer_inscription`, droits sur les fonctions.

Pas de Docker ni de projet Supabase de test : `supabase/test-migrations.mjs`
demarre
un vrai Postgres compile en WebAssembly, en memoire, et rend la main en
quelques secondes. Le prelude du fichier fournit ce que Supabase apporte et
qu'un Postgres nu n'a pas : le schema `auth`, `auth.uid()`, les roles et un
`storage` minimal.

A lancer avant de coller une migration dans le SQL editor. Les regles
d'argent et d'acces du produit vivent dans ces fichiers, et une erreur ne
s'y voit qu'en production.

## Tester les regles de commande

```bash
npm run test:commandes
```

Verifie les deux calculs de `src/lib/commandes.ts` qui manipulent des
dates, parce qu'une erreur de date ne se voit pas en relisant du code :

- **la ponctualite**, seul chiffre du produit qui juge le travail plutot
  que l'argent, et seul qu'un tailleur puisse montrer a un client ;
- **les groupes d'echeance**, qui commandent la mise en page entiere de
  l'ecran des commandes. Un decalage d'un jour range une piece a livrer
  aujourd'hui sous « Cette semaine ».

Aucune bibliotheque : dix-huit comparaisons ne valent pas une dependance
de plus. Le banc importe directement le module TypeScript, d'ou le
`--experimental-strip-types` de la commande.

## Suppression de compte et purge

Supprimer le dernier compte d'un atelier ne suffit pas a effacer ses
donnees : l'atelier devient seulement inatteignable. Un declencheur pose
donc `ateliers.orphelin_depuis`, et l'atelier est efface trente jours plus
tard. Le delai laisse le temps de revenir sur une suppression faite par
erreur ; un compte qui rejoint l'atelier remet le compteur a zero.

L'effacement passe par `/api/purge-ateliers`, appelee chaque nuit par la
planification declaree dans `vercel.json`. Il ne se fait pas en SQL parce
que Postgres refuse toute suppression directe dans `storage.objects` : les
photos ne partent que par l'API Storage. La route vide les fichiers avant
d'effacer les lignes, pour qu'une interruption ne laisse jamais de fichier
que plus aucune ligne ne designe.

Deux variables sont necessaires au deploiement, en plus de celles du
client :

| Variable | Role |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Acces au bucket et aux fonctions de purge, hors RLS |
| `CRON_SECRET` | Presente en en-tete par la planification ; sans lui la route repond 401 |

Purge manuelle en developpement :

```bash
curl http://localhost:3000/api/purge-ateliers -H "Authorization: Bearer $CRON_SECRET"
```

## Connexion avec Google

Le gain n'est pas d'epargner un mot de passe, c'est de supprimer l'email de
confirmation : Google a deja verifie l'adresse, la personne revient avec une
session ouverte. C'est l'etape ou une inscription se perd le plus souvent,
au point que `messages-auth.ts` proposait deux fois d'activer un atelier a la
main faute de mieux.

Le bouton part **eteint**. Il ne s'affiche que si `NEXT_PUBLIC_AUTH_GOOGLE`
vaut `1`, pour qu'un deploiement fait avant la configuration n'affiche pas
une porte qui refuse de s'ouvrir.

Mise en service, dans cet ordre :

1. Appliquer `supabase/migrations/0010_inscription_par_fournisseur.sql`
2. Dans Google Cloud, creer des identifiants OAuth et autoriser l'URL de
   rappel que Supabase indique
3. Dans Supabase, onglet Authentication puis Providers, activer Google avec
   ces identifiants
4. Toujours dans Supabase, ajouter `https://votre-domaine/auth/callback` aux
   URL de redirection autorisees
5. **Verifier la liaison des identites sur un compte jetable** : inscrivez-vous
   par email avec une adresse Gmail, deconnectez-vous, puis revenez par
   Google avec la meme adresse. Vous devez retrouver votre atelier. Si un
   atelier vide apparait, les deux identites ne sont pas liees et il ne faut
   pas ouvrir la porte en l'etat
6. Poser `NEXT_PUBLIC_AUTH_GOOGLE=1`

Pour refermer, retirer la variable. Aucun deploiement de code n'est
necessaire dans un sens comme dans l'autre.

### Pourquoi un ecran de bienvenue

Le declencheur `handle_new_user()` cree l'atelier a partir des metadonnees
que le formulaire depose. Une inscription Google n'en depose aucune : le nom
de l'atelier et le code d'invitation n'existent pas encore quand le compte
est cree. Le declencheur laisse donc passer ces comptes sans rien creer, et
`/bienvenue` acheve l'inscription en appelant `terminer_inscription()`.

Sans cela, tout compte Google aurait ouvert un atelier nomme « Mon atelier »,
et surtout un apprenti invite serait devenu proprietaire d'un atelier vide au
lieu de rejoindre celui de son patron - en silence.

## Modele de donnees

Voir `supabase/migrations/0001_init.sql`. Entites principales : `ateliers` (tenant), `utilisateurs`, `clients`, `gabarits_mesure`, `mesures`, `commandes`, `historique_statuts`, `paiements`, `notifications`. Isolation multi-tenant geree par Row Level Security sur `atelier_id`.

## Roadmap MVP

1. **Coeur metier offline-first mono-atelier** : fiche client + mesures, creation de commande, PWA installable avec queue offline basique.
2. **Workflow visuel + finance** : Kanban avec priorites, generation de recus, tableau de bord financier, multi-utilisateur par atelier.
3. **Automatisation WhatsApp + pilote client** : confirmation de commande, rappel d'essayage, notification "pret", test avec des ateliers pilotes a Porto-Novo.
