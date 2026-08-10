# Identité visuelle TailorHub

Document de travail pour faire produire le logo par un générateur d'images
(ChatGPT, Gemini, Ideogram) ou par un graphiste.

---

## Stratégie

| | |
|---|---|
| **Catégorie** | Logiciel métier pour ateliers de couture |
| **Public** | Tailleurs et couturiers francophones d'Afrique de l'Ouest. Secondairement partenaires et investisseurs |
| **Personnalité** | Précis, calme, fiable, discrètement haut de gamme |
| **Métaphore centrale** | Le point de couture. Deux fils qui se croisent et se bloquent |
| **Pourquoi elle tient** | C'est l'unité atomique du métier, et c'est exactement ce que fait le produit : tenir ensemble ce qui était épars |
| **À éviter** | Aiguille, bobine, ciseaux, mètre ruban, machine à coudre. Trop littéral, déjà vu, et cela positionne le produit comme une mercerie plutôt que comme un logiciel |

## Contraintes techniques

- Monochrome strict, une seule couleur, aucun dégradé
- Lisible à 20 px dans un onglet de navigateur
- Lisible en icône d'application sur écran d'accueil
- Fonctionne en vert émeraude sur blanc, et en blanc sur noir encre
- Format vectoriel final (SVG)

## Palette

| Usage | Valeur |
|---|---|
| Accent | `#059669` émeraude |
| Encre | `#18181b` |
| Papier | `#ffffff` |

---

## Prompt 1 : exploration de marques

À coller dans un générateur d'images. Demander plusieurs passages.

```
Logo concept sheet for "TailorHub", a workshop management software for
tailoring businesses.

Core metaphor: the stitch. Two threads that cross and lock together.
Abstract, never literal. No needle, no spool, no scissors, no measuring
tape, no sewing machine.

Present 6 distinct abstract mark concepts on a single clean sheet,
arranged on a 3x2 grid with generous gutters, each mark centred in its
own panel, each panel labelled with a single short word.

Concept directions to explore:
- two arcs interlocking into a locked knot
- a running stitch reduced to four aligned strokes forming a rising path
- a square knot reduced to rotational symmetry, four strokes only
- negative space forming an implicit H inside a crossing of two threads
- a single continuous line that crosses itself exactly once
- a geometric weave of two ribbons, over and under, reduced to minimum

Style: premium software identity, in the register of Stripe, Linear and
Vercel. Geometric construction, mathematically balanced, confident
weight, generous negative space.

Strictly monochrome: deep emerald green #059669 on pure white. No
gradient, no shadow, no 3D, no texture, no glow.

Each mark must stay readable at 20 pixels. Thick enough strokes, no thin
hairlines, no fine detail.

Layout: white presentation sheet, thin grid guides, small labels in a
neutral sans-serif, wide margins, nothing decorative.
```

## Prompt 2 : planche d'identité complète

À utiliser une fois la marque choisie, en décrivant précisément la marque retenue.

```
Premium brand identity board for "TailorHub", workshop management
software for tailoring businesses.

Brand strategy:
- category: vertical software for craft businesses
- audience: francophone West African tailors, and their partners
- personality: precise, calm, dependable, quietly premium
- core metaphor: the stitch, two threads crossing and locking
- logo: [DECRIRE ICI LA MARQUE RETENUE]

Layout: 3x3 presentation grid on a white canvas, strong gutters, clean
alignment, refined negative space, small page labels.

Panels:
1. Logo lockup, mark plus wordmark, large negative space
2. Logo construction, geometric grid, circles and guides showing how the
   mark is built
3. Mobile app icon on a dark rounded square, and browser tab favicon at
   real size
4. Tagline panel, single line: "Votre atelier, enfin sous controle."
5. Colour system, three swatches only: emerald #059669, ink #18181b,
   paper #ffffff
6. Typography specimen, one geometric sans-serif, alphabet row and one
   large word
7. Physical application, a simple business card and a paper receipt
8. Pattern derived from the mark, used as a subtle repeating texture
9. UI detail strip, a few interface chips and a button in brand colours

Style: minimal, cinematic, intentional, brand guidelines deck, no
clutter, no stock imagery, no fake dense interface.

Strictly monochrome emerald and ink on white. No gradient, no glow.

Typography: readable and sparse, no tiny illegible text.
```

---

## Comment exploiter le résultat

Un générateur produit une image, pas un fichier vectoriel utilisable.

1. Garder la ou les marques qui fonctionnent, ignorer le reste
2. Les faire redessiner proprement en SVG, soit à la main, soit par
   vectorisation puis nettoyage
3. Vérifier la lisibilité à 20 px avant toute décision
4. Décliner ensuite en favicon, icônes d'application 192 et 512 px, et
   icône masquable pour Android

## Critère de décision

Une seule question, posée devant la marque réduite à 20 pixels : est-ce
qu'on la distingue encore d'un rond quelconque ? Si non, elle est
disqualifiée, quelle que soit sa beauté en grand.
