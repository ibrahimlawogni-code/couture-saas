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

## Modele de donnees

Voir `supabase/migrations/0001_init.sql`. Entites principales : `ateliers` (tenant), `utilisateurs`, `clients`, `gabarits_mesure`, `mesures`, `commandes`, `historique_statuts`, `paiements`, `notifications`. Isolation multi-tenant geree par Row Level Security sur `atelier_id`.

## Roadmap MVP

1. **Coeur metier offline-first mono-atelier** : fiche client + mesures, creation de commande, PWA installable avec queue offline basique.
2. **Workflow visuel + finance** : Kanban avec priorites, generation de recus, tableau de bord financier, multi-utilisateur par atelier.
3. **Automatisation WhatsApp + pilote client** : confirmation de commande, rappel d'essayage, notification "pret", test avec des ateliers pilotes a Porto-Novo.
