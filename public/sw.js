// Service worker : garde l'application utilisable quand le reseau tombe.
// Strategie reseau d'abord, avec repli sur le cache, pour ne jamais
// afficher une page perimee tant que la connexion repond.

const CACHE = "couture-v1";
const PAGE_HORS_LIGNE = "/hors-ligne";

const PRECACHE = [PAGE_HORS_LIGNE, "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (evenement) => {
  evenement.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
  );
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

  evenement.respondWith(
    fetch(request)
      .then((reponse) => {
        if (reponse.ok) {
          const copie = reponse.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copie));
        }
        return reponse;
      })
      .catch(async () => {
        const enCache = await caches.match(request);
        if (enCache) return enCache;

        if (request.mode === "navigate") {
          const repli = await caches.match(PAGE_HORS_LIGNE);
          if (repli) return repli;
        }

        return Response.error();
      })
  );
});
