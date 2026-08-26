# Prompt pour Claude Design — refonte de l'interface

Document de travail, à coller dans Claude Design pour faire proposer une
meilleure interface. Même usage que `identite-visuelle.md`, mais pour les
écrans de l'application plutôt que pour le logo.

Le prompt décrit l'existant avant de demander mieux. C'est volontaire :
l'application a déjà une identité tenue, et un générateur à qui on ne dit
rien rend du générique — bleu, violet, dégradés, coins très arrondis.

---

## Le prompt

```
Tu redessines l'interface de TailorHub, un logiciel de gestion d'atelier
pour tailleurs et couturiers. L'application existe déjà et fonctionne. Je
ne cherche pas une refonte de l'identité, je cherche une meilleure
hiérarchie, une meilleure densité, et des réponses aux problèmes listés
plus bas.

## Qui s'en sert

Un tailleur ou une couturière à Porto-Novo, au Bénin. Entre 5 et 40
commandes en cours. Il travaille debout dans son atelier, souvent les
mains prises, sur un téléphone Android d'entrée de gamme tenu d'une seule
main. Écran de 360 à 400 px de large, en plein jour, parfois en plein
soleil. Sa connexion tombe plusieurs fois par jour.

Ce n'est pas un cadre derrière un bureau. Chaque écran doit répondre à
une question qu'il se pose entre deux clients : qu'est-ce que je dois
livrer aujourd'hui, qui m'a payé, où en est la commande de Koffi.

Le téléphone est l'écran principal. L'ordinateur vient en second.

## Ce qu'il fait avec

Il enregistre un client et ses mesures, il crée une commande avec un
acompte, il fait avancer cette commande à travers sept étapes — Reçu,
Coupe, Couture, Essayage, Finitions, Prêt, Livré — il encaisse le solde,
il imprime un reçu.

## Les écrans

Quatre onglets : Accueil, Commandes, Clients, Finances.
Plus : fiche client avec mesures, création de commande, détail de
commande, reçu imprimable.

## L'identité, à respecter sans exception

Personnalité : précis, calme, fiable, discrètement haut de gamme. Le
registre est celui de Stripe et Linear, pas celui d'une application grand
public.

Palette, en mode clair uniquement — ne propose pas de mode sombre :

  Forêt        #0c3b2e   aplats sombres, barre latérale, bandeau d'accueil
  Vert         #12684e   accent, actions principales
  Vert clair   #dcede5   fonds d'étiquette
  Vert pâle    #9bc4b3   texte secondaire posé sur un aplat sombre
  Encre        #111e1a   texte principal
  Gris         #63726c   texte secondaire
  Papier       #f7f9f8   fond de page
  Bordure      #e3e8e6   filets
  Bleu         #1b4f72   sur fond #dce7f0
  Ambre        #8a5a12   sur fond #f6e7cd
  Rouge        #a8261e   sur fond #f6dedc

Rien n'est neutre : le papier est légèrement verdi, l'encre et le gris
tirent vers le vert. L'ensemble doit donner la sensation d'une seule
matière plutôt que d'un assemblage.

Règle sémantique des couleurs, à ne pas enfreindre :
- le vert parle du métier
- le rouge parle d'un problème : retard, créance, échec
- l'ambre parle d'un avertissement
- le bleu parle du système, et de rien d'autre : synchronisation,
  information non demandée. Le bleu ne décore jamais.

Rayons, trois seulement, un par niveau de surface :
  contrôle 10 px · carte 14 px · panneau 20 px

Élévation : le filet d'abord, l'ombre ensuite. Une ombre seule flotte
sans se poser. Les ombres sont très légères.

Typographie : DM Sans. Chiffres en chasse fixe partout où ils s'empilent
verticalement — montants d'une colonne, lignes de paiement, graduations.
Chiffres proportionnels pour une grande valeur isolée.

Interdits : dégradés, relief, halo, ombres portées marquées, imagerie de
mercerie dans les icônes — pas d'aiguille, pas de ciseaux, pas de bobine,
pas de machine à coudre. C'est un outil de gestion, pas une mercerie. Une
commande est une fiche de travail.

## Contraintes non négociables

- Contraste AA, 4,5:1 minimum sur le texte
- Zones tactiles de 44 px minimum
- Monnaie en FCFA, sans décimales, séparateur de milliers par espace
  fine : 249 000 FCFA
- L'application fonctionne hors ligne. Il faut donc des états visibles
  pour « enregistré sur l'appareil, pas encore envoyé » et « envoyé ».
  C'est la situation normale, pas un cas d'erreur : ça ne doit ni
  inquiéter, ni bloquer.
- Barre d'onglets en bas sur téléphone, barre latérale sur ordinateur

## Ce qui ne va pas aujourd'hui

C'est là-dessus que j'attends des propositions.

1. **Le tableau des commandes sur téléphone est le vrai problème.** Sept
   étapes présentées en colonnes qui défilent horizontalement. On ne voit
   qu'une colonne et demie à la fois, on ne sait pas où on se situe dans
   la chaîne, et il n'existe aucune vue d'ensemble. Un atelier avec 30
   commandes ne peut pas s'en servir. Propose au moins deux directions
   différentes pour cet écran.

2. **L'accueil se vide vers le bas.** Quatre vignettes de statistique de
   poids identique — Encaissé ce mois, Créances, En cours, Clients —
   puis un graphique presque vide les premiers mois. Un atelier qui
   démarre voit surtout du blanc.

3. **Ces quatre vignettes n'ont pas la même urgence** mais elles ont le
   même poids visuel. Une créance de 221 000 FCFA et un compteur de
   clients ne devraient pas se lire pareil.

4. **Sur ordinateur, la barre latérale prend 18 % de la largeur** pour
   quatre entrées et reste vide en dessous. La page ne descend pas
   jusqu'en bas de l'écran.

5. **Rien ne signale l'état de la connexion**, alors que la perdre est
   la situation ordinaire de l'utilisateur.

## Ce que je veux recevoir

Artboards, téléphone d'abord :

- Téléphone 390 × 844 : les quatre onglets, plus le détail d'une
  commande avec le passage d'une étape à la suivante
- Ordinateur 1440 : Accueil et Commandes
- Pour Accueil et Commandes, montre **l'état chargé et l'état vide** —
  un atelier qui vient de s'inscrire, zéro client, zéro commande. L'état
  vide est le premier écran que voit un nouvel utilisateur, il compte
  autant que l'autre.

Remplis les maquettes avec des données plausibles : noms béninois,
vêtements réels — pantalon sur mesure, chemise en bazin, ensemble pagne,
tunique homme, costume deux pièces — montants entre 15 000 et 80 000
FCFA.

Dernière chose : propose, ne décore pas. Si un agencement actuel est bon,
dis-le et améliore la hiérarchie plutôt que de tout refaire. Je préfère
trois écrans repensés en profondeur à huit écrans repeints.
```

---

## Comment exploiter le résultat

1. Regarder d'abord les propositions pour l'écran Commandes. C'est le
   problème le plus coûteux, et le seul dont la solution n'est pas
   évidente.
2. Vérifier chaque écran à 360 px avant toute décision. Une maquette est
   dessinée large ; l'application est utilisée étroite.
3. Ne pas reprendre une proposition qui enfreint la règle des couleurs.
   Un générateur met volontiers du bleu pour décorer, et ce bleu-là veut
   dire quelque chose ici.
4. Les jetons du système vivent dans `src/app/globals.css`. Toute valeur
   retenue doit y entrer, pas être écrite en dur dans un composant.

## Critère de décision

Une seule question devant chaque maquette : **est-ce qu'un tailleur
debout, une main sur le téléphone, trouve en moins de trois secondes ce
qu'il doit livrer aujourd'hui ?** Si non, l'écran est plus joli mais pas
meilleur.
