export default function HorsLignePage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-papier px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-encre">Pas de connexion</h1>
        <p className="mt-3 text-sm text-gris">
          Cette page n&apos;a pas encore ete consultee, elle n&apos;est donc pas
          disponible hors ligne. Reconnecte-toi pour la charger.
        </p>
      </div>
    </div>
  );
}
