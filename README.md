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

Verifie les regles de `src/lib/` qui ne se relisent pas a l'oeil :

- **la ponctualite**, seul chiffre du produit qui juge le travail plutot
  que l'argent, et seul qu'un tailleur puisse montrer a un client ;
- **les groupes d'echeance**, qui commandent la mise en page entiere de
  l'ecran des commandes. Un decalage d'un jour range une piece a livrer
  aujourd'hui sous « Cette semaine » ;
- **la repartition par moyen de paiement**, qui doit tenir debout sur les
  versements anterieurs a la saisie du moyen - ceux qui n'en portent
  aucun, et que la base compte en especes par defaut.

Aucune bibliotheque : quelques dizaines de comparaisons ne valent pas une
dependance de plus. Le banc importe directement les modules TypeScript,
d'ou le `--experimental-strip-types` de la commande.

## Administration de la plateforme

Un arriere-guichet, a `/admin`, pour agir sur TailorHub lui-meme plutot que
sur un atelier : voir les ateliers inscrits et leur activite, changer
l'offre de l'un d'eux, nommer d'autres administrateurs. Il remplace
l'ouverture de Supabase.

Il a longtemps tenu lieu d'encaissement, faute de compte marchand : un
atelier payait, on le passait a son offre a la main. Ce n'est plus le
chemin normal, l'encaissement par SASPay etant en place (voir plus bas).
Changer une offre a la main reste utile pour un geste commercial, un
depannage, ou un reglement recu hors de l'application.

Ce pouvoir traverse la cloison entre ateliers. Trois regles le tiennent :

- **Rien ne passe par le navigateur.** Les tables `administrateurs` et
  `journal_admin` ont RLS active et aucune politique ; les fonctions ne
  sont accordees ni a `anon` ni a `authenticated`. Tout se fait cote
  serveur avec `SUPABASE_SERVICE_ROLE_KEY`, dans `src/lib/admin.ts`, qui
  porte `server-only` en tete.
- **Aucune politique RLS n'est ouverte** sur `clients`, `commandes` ou
  `paiements`. Une faille de l'ecran d'administration ne peut donc pas
  devenir une fuite entre ateliers.
- **Chaque geste est journalise** dans la meme transaction que son effet,
  parce que le droit se delegue et qu'une delegation sans trace ne se
  verifie pas.

Un compte ne peut pas se revoquer lui-meme : cette seule regle garantit
qu'il reste toujours au moins un administrateur.

### Nommer le premier administrateur

La migration n'en nomme aucun, exprès : une adresse ecrite dans le depot y
resterait, et rejouer la migration ressusciterait un droit qu'on aurait
retire. Une fois `0012_administrateurs.sql` appliquee, dans le SQL editor
de Supabase :

```sql
insert into administrateurs (id)
select id from auth.users where email = 'votre@adresse'
on conflict do nothing;
```

Les suivants se nomment depuis `/admin`, par leur adresse. Le lien vers
l'arriere-guichet n'apparait dans les Reglages que pour un administrateur.

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

## Francais et anglais

L'application existe en deux langues. Tous les ecrans sont traduits, ainsi
que les documents qui sortent de l'atelier - recu, messages WhatsApp, page
de notation. **La page de vente reste en francais** : c'est de la redaction
et non de la traduction, et elle attend une decision.

### Qui decide de la langue

Deux cas, et ils ne se ressemblent pas.

**Une fois connecte**, la langue est celle de **l'atelier**, portee par
`ateliers.langue` et modifiable dans les Reglages. Elle vaut pour tout
l'atelier, apprentis compris : les documents qui partent chez le client
doivent suivre la meme langue quel que soit celui qui les produit. Un client
qui recoit un recu en francais un jour et en anglais le lendemain ne sait
plus a qui il a affaire.

**Avant toute connexion** - ecrans d'acces, page de notation - il n'y a pas
d'atelier dont lire la langue. `src/lib/langue-visiteur.ts` la cherche
alors dans un cookie, puis a defaut dans l'en-tete du navigateur. Le choix
explicite l'emporte toujours, et un selecteur discret le permet sur chaque
ecran d'acces.

L'en-tete du navigateur n'est qu'une premiere supposition. Elle se trompe
souvent ici : un Android vendu au Benin est frequemment configure en anglais
alors que son proprietaire travaille en francais.

Le cookie plutot que le stockage local, parce que le serveur le lit : la
page arrive deja traduite, au lieu de s'afficher en francais puis de changer
sous les yeux du visiteur.

### Ou vivent les mots

Tout est dans `src/lib/i18n.ts`, et **le type `Traductions` est la garantie
qui compte** : ajouter une entree en francais sans son equivalent anglais ne
compile pas. Une table de traduction se degrade autrement au fil des ajouts,
et le manque ne se decouvre qu'a l'ecran, dans la mauvaise langue.

Chaque module garde ses **codes**, le dictionnaire garde les **mots**. Un
statut reste `recu` en base, un versement reste `especes`, quelle que soit
la langue. Les libelles ont donc quitte `commandes.ts`, `paiements.ts` et
`messages-auth.ts` - ce dernier gardant les expressions regulieres qui
reconnaissent les erreurs de Supabase, puisqu'une regex ne se traduit pas.

Les phrases sont des **fonctions** et non des gabarits a trous, parce que
les accords ne suivent pas la meme regle d'une langue a l'autre : le
francais accorde a partir de deux, l'anglais des que ce n'est pas un.

### Deux pieges deja rencontres

**Le dictionnaire ne franchit pas la frontiere serveur vers client.** Il
contient des fonctions, et une fonction ne se passe pas en prop a un
composant client depuis un composant serveur. Ces composants recoivent donc
le **code de langue** - une chaine - et appellent `traduire()` eux-memes.

**Le typage ne voit pas tout.** Il garantit qu'aucune clef ne manque, jamais
que deux nombres voisins s'ecrivent pareil. Deux fois, le rendu en anglais a
montre un « 1,396,000 » a cote d'un « 166 000 » sur la meme carte, parce
qu'un appel a `formaterMontant` n'avait pas recu la locale. **Regarder
l'ecran dans les deux langues fait partie du travail**, pas seulement
compiler.

### Ajouter une chaine

1. La declarer dans le type `Traductions`
2. L'ecrire dans `FR` puis dans `EN` - l'oubli ne compile pas
3. La lire avec `useTraductions()` cote client, `traduire(langue)` cote
   serveur
4. Pour un nombre ou une date, passer `mots.locale`

Ce qui ne se traduit pas : les noms commerciaux (`Atelier Pro`,
`Decouverte`), la monnaie (`FCFA`), les services (`Mobile Money`,
`WhatsApp`), et les noms de modeles - qui sont stockes sur chaque commande,
et dont la traduction ferait cohabiter deux langues dans un meme historique.

## Encaissement des abonnements

Le tailleur paie son offre depuis **Reglages**, par Mobile Money ou carte,
via **SASPay**. Un mois a la fois. A l'echeance, l'atelier revient a
Decouverte sans rien perdre : les plafonds ne s'opposent qu'aux creations,
jamais aux lignes deja en place.

Trois chemins declenchent le meme rapprochement, et **aucun n'est
indispensable** : la notification de SASPay, le retour du navigateur apres
paiement, et l'entretien nocturne. Un tailleur dont la connexion coupe au
retour verra quand meme son atelier passer en Pro.

La notification ne porte pas les metadonnees de la session, donc rien qui
dise a qui crediter : elle ne sert que de signal. Ce qui fait foi est la
relecture des sessions reglees chez SASPay, ou les metadonnees survivent.
L'identifiant de session sert de cle d'idempotence, une session ne pouvant
etre reglee qu'une fois.

Le prix n'est jamais transmis par le navigateur : il est lu dans
`src/lib/tarifs.ts` cote serveur, le formulaire ne designant qu'une offre.

Deux variables, sans prefixe `NEXT_PUBLIC_` :

| Variable | Role |
|---|---|
| `SASPAY_SECRET_KEY` | Cle API. `sk_test_` en developpement, `sk_live_` en production |
| `SASPAY_WEBHOOK_SECRET` | Donne une seule fois a la creation du webhook. Sans lui, toute notification est refusee |

Mise en service :

1. Appliquer `supabase/migrations/0013_abonnement.sql`
2. Sur `app.saspay.me`, declarer un webhook vers
   `https://votre-domaine/api/paiements/saspay` et **copier le secret
   immediatement**, il n'est plus consultable ensuite
3. Poser les deux variables dans Vercel, environnement Production
4. Redeployer

La planification nocturne appelle `/api/abonnements/entretien` a 4 h, apres
la purge. Sa premiere moitie - la retrogradation des periodes finies - ne
depend pas de SASPay et continue de tourner si le prestataire n'est pas
configure.

## Modele de donnees

Voir `supabase/migrations/0001_init.sql`. Entites principales : `ateliers` (tenant), `utilisateurs`, `clients`, `gabarits_mesure`, `mesures`, `commandes`, `historique_statuts`, `paiements`, `notifications`. Isolation multi-tenant geree par Row Level Security sur `atelier_id`.

## Roadmap MVP

1. **Coeur metier offline-first mono-atelier** : fiche client + mesures, creation de commande, PWA installable avec queue offline basique.
2. **Workflow visuel + finance** : Kanban avec priorites, generation de recus, tableau de bord financier, multi-utilisateur par atelier.
3. **Automatisation WhatsApp + pilote client** : confirmation de commande, rappel d'essayage, notification "pret", test avec des ateliers pilotes a Porto-Novo.
