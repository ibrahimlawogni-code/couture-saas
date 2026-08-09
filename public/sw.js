// Service worker : garde l'application utilisable quand le reseau tombe.
// Strategie reseau d'abord, avec repli sur le cache, pour ne jamais
// afficher une page perimee tant que la connexion repond.

const CACHE = "couture-v2";
const PAGE_HORS_LIGNE = "/hors-ligne";

const PRECACHE = [PAGE_HORS_LIGNE, "/icon-192.png", "/icon-512.png"];

const IDENTIFIANT = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/**
 * Les pages de detail affichent des donnees lues en local : leur contenu ne
 * depend plus de l'identifiant present dans l'adresse. On les met donc en
 * cache par modele d'adresse, ce qui rend consultable hors reseau une fiche
 * jamais ouverte auparavant.
 */
function cleModele(url) {
  return new URL(url).pathname.replace(IDENTIFIANT, ":id");
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

self.addEventListener("fetch", (evenement) => {
  const { request } = evenement;

  if (!estCachable(request)) return;

  const navigation = request.mode === "navigate";

  evenement.respondWith(
    fetch(request)
      .then((reponse) => {
        if (reponse.ok) {
          const copie = reponse.clone();
          caches.open(CACHE).then((cache) => {
            cache.put(request, copie.clone());
            if (navigation) cache.put(cleModele(request.url), copie);
          });
        }
        return reponse;
      })
      .catch(async () => {
        const cache = await caches.open(CACHE);

        const exact = await cache.match(request);
        if (exact) return exact;

        if (navigation) {
          const modele = await cache.match(cleModele(request.url));
          if (modele) return modele;

          const repli = await cache.match(PAGE_HORS_LIGNE);
          if (repli) return repli;
        }

        return Response.error();
      })
  );
});
