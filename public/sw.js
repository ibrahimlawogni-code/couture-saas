// Service worker : garde l'application utilisable quand le reseau tombe.
// Strategie reseau d'abord, avec repli sur le cache, pour ne jamais
// afficher une page perimee tant que la connexion repond.

// A changer a chaque refonte de l'interface. activate supprime tout cache
// dont le nom differe de celui-ci : garder le meme nom laisserait les
// anciennes pages en place, et un telephone hors ligne continuerait
// d'afficher l'interface precedente apres le deploiement.
const CACHE = "couture-v6";
const PAGE_HORS_LIGNE = "/hors-ligne";

const PRECACHE = [PAGE_HORS_LIGNE, "/icon-192.png", "/icon-512.png"];

const IDENTIFIANT = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/*
 * Next.js ne recharge pas la page quand on navigue dans l'application : il ne
 * demande que les donnees. Le HTML des ecrans non ouverts directement n'est
 * donc jamais telecharge. Le client demande explicitement leur mise en cache
 * au demarrage (message "rechauffer"), sinon ces ecrans seraient introuvables
 * hors connexion.
 */
const OPTIONS_MATCH = { ignoreVary: true };

/**
 * Les pages de detail affichent des donnees lues en local : leur contenu ne
 * depend plus de l'identifiant present dans l'adresse. On les met donc en
 * cache par modele d'adresse, ce qui rend consultable hors reseau une fiche
 * jamais ouverte auparavant.
 */
function cleModele(url) {
  const adresse = new URL(url);
  const chemin = adresse.pathname.replace(IDENTIFIANT, ":id");

  // Next demande aussi les donnees de navigation de chaque adresse, sous un
  // parametre technique qui change a chaque version. Sans les ranger a part,
  // il boucle indefiniment hors connexion : requete refusee, rechargement de
  // la page, nouvelle requete.
  return adresse.searchParams.has("_rsc") ? `${chemin}?modele-rsc` : chemin;
}

self.addEventListener("install", (evenement) => {
  evenement.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (evenement) => {
  evenement.waitUntil(
    caches
      .keys()
      .then((cles) =>
        Promise.all(cles.filter((cle) => cle !== CACHE).map((cle) => caches.delete(cle)))
      )
      .then(() => self.clients.claim())
  );
});

function estCachable(requete) {
  const url = new URL(requete.url);

  if (requete.method !== "GET") return false;
  if (url.origin !== self.location.origin) return false;
  // Rechargement a chaud et flux de developpement
  if (url.pathname.includes("hmr") || url.pathname.startsWith("/__next")) return false;

  return true;
}

async function mettreEnCache(requete, reponse) {
  const cache = await caches.open(CACHE);
  await cache.put(requete, reponse.clone());

  // Pages et donnees de navigation sont aussi rangees sous leur modele
  // d'adresse : une seule fiche mise en cache rend consultables toutes
  // les autres du meme type.
  const type = reponse.headers.get("content-type") ?? "";
  if (type.includes("text/html") || type.includes("text/x-component")) {
    await cache.put(cleModele(requete.url), reponse.clone());
  }
}

/*
 * Les fichiers batis portent un hash de contenu dans leur nom : sous une
 * meme adresse, leurs octets ne changent jamais. Les demander au reseau
 * d'abord n'apprend donc rien, et coute cher la ou ca fait le plus mal :
 * sur un lien instable, chaque script attend l'expiration du reseau avant
 * que le repli ne serve le cache, alors que les octets sont deja sur
 * l'appareil.
 */
function estImmuable(url) {
  return new URL(url).pathname.startsWith("/_next/static/");
}

self.addEventListener("fetch", (evenement) => {
  const { request } = evenement;

  if (!estCachable(request)) return;

  if (estImmuable(request.url)) {
    evenement.respondWith(
      caches.match(request, OPTIONS_MATCH).then(
        (cache) =>
          cache ??
          fetch(request).then((reponse) => {
            if (reponse.ok) evenement.waitUntil(mettreEnCache(request, reponse.clone()));
            return reponse;
          })
      )
    );
    return;
  }

  const navigation = request.mode === "navigate";

  evenement.respondWith(
    fetch(request)
      .then((reponse) => {
        if (reponse.ok) {
          evenement.waitUntil(mettreEnCache(request, reponse.clone()));
        }
        return reponse;
      })
      .catch(async () => {
        const cache = await caches.open(CACHE);

        const exact = await cache.match(request, OPTIONS_MATCH);
        if (exact) return exact;

        // Vaut pour les pages comme pour les donnees de navigation.
        const modele = await cache.match(cleModele(request.url), OPTIONS_MATCH);
        if (modele) return modele;

        if (navigation) {
          const chemin = new URL(request.url).pathname;

          // Meme page, sans les parametres d'adresse.
          const sansParametres = await cache.match(chemin, OPTIONS_MATCH);
          if (sansParametres) return sansParametres;

          const repli = await cache.match(PAGE_HORS_LIGNE, OPTIONS_MATCH);
          if (repli) return repli;
        }

        return Response.error();
      })
  );
});
