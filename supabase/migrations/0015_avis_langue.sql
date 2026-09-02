-- La page de notation dans la langue de l'atelier.
--
-- Le client ouvre cette page depuis un lien recu par WhatsApp. Ce message
-- suit desormais la langue de l'atelier ; la page qu'il ouvre restait en
-- francais, ce qui donnait un message anglais menant a un ecran francais -
-- l'incoherence meme que la traduction des documents visait a supprimer.
--
-- La page n'a pas de session : elle ne connait de l'atelier que ce que
-- cette fonction lui en dit. Il faut donc que la langue en sorte.
--
-- Le type de retour change, d'ou le drop prealable : Postgres refuse de
-- remplacer une fonction dont la signature de sortie differe. Les droits
-- sont reposes ensuite, un drop les emportant avec la fonction.

drop function if exists commande_a_noter(uuid);

create function commande_a_noter(jeton uuid)
returns table (atelier text, modele text, deja_note boolean, langue text)
language sql
security definer
set search_path = public
stable
as $$
  select a.nom,
         c.nom_modele,
         exists (select 1 from avis where avis.commande_id = c.id),
         a.langue
    from commandes c
    join ateliers a on a.id = c.atelier_id
   where c.jeton_avis = jeton
     and c.statut = 'livre';
$$;

/*
 * Les memes droits qu'avant : anon en a besoin, c'est tout l'objet de cette
 * page - un client qui note son tailleur n'a pas de compte.
 *
 * Le revoke nomme reste indispensable. Supabase accorde EXECUTE d'office a
 * anon et authenticated sur toute nouvelle fonction, et un revoke sur le
 * seul PUBLIC ne l'en priverait pas.
 */
revoke all on function commande_a_noter(uuid) from public, anon, authenticated;
grant execute on function commande_a_noter(uuid) to anon, authenticated;
