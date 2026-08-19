/**
 * Vrai quand le fournisseur externe est reellement configure cote Supabase.
 *
 * Le bouton part eteint. Livrer le code avant d'avoir cree les identifiants
 * Google afficherait une porte qui refuse de s'ouvrir, et un tailleur qui
 * bute dessus n'y revient pas. L'allumer est une variable a poser, pas un
 * deploiement - et l'eteindre aussi, le jour ou quelque chose cloche.
 *
 * Ce drapeau vit dans un module ordinaire, et non aupres du bouton qui est
 * marque « use client ». Un composant serveur qui importe une valeur depuis
 * un module client n'en recoit pas la valeur mais une reference, toujours
 * vraie : l'ecran de connexion, rendu sur le serveur, affichait donc le
 * bouton que l'ecran d'inscription masquait correctement.
 */
export const GOOGLE_ACTIF = process.env.NEXT_PUBLIC_AUTH_GOOGLE === "1";
