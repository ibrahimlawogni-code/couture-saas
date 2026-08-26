import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/auth",
  "/mot-de-passe-oublie",
  // Redemander un lien de confirmation se fait justement quand on n'a pas
  // encore pu se connecter : cette page doit rester ouverte.
  "/renvoyer-confirmation",
  // Appelee par la planification, sans session : elle verifie elle-meme un
  // secret en en-tete. Le controle de session la renverrait vers /login.
  "/api/purge-ateliers",
];

// Accessibles dans le meme etat connecte ou non : la page de presentation
// doit rester visible par un visiteur, et le repli du service worker doit
// repondre la meme chose dans les deux cas, sinon c'est une redirection qui
// finit en cache.
//
// La page de notation en fait partie : elle s'adresse a un client qui n'a
// pas de compte, mais le tailleur doit pouvoir ouvrir le lien lui-meme pour
// verifier ce qu'il envoie. Rangee dans PUBLIC_PATHS, elle renverrait un
// tailleur connecte vers son tableau de bord.
const CHEMINS_LIBRES = ["/hors-ligne", "/avis"];

function estCheminLibre(chemin: string) {
  return chemin === "/" || CHEMINS_LIBRES.some((libre) => chemin.startsWith(libre));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const chemin = request.nextUrl.pathname;

  if (estCheminLibre(chemin)) {
    return response;
  }

  const isPublicPath = PUBLIC_PATHS.some((path) => chemin.startsWith(path));

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/tableau-de-bord";
    return NextResponse.redirect(url);
  }

  return response;
}
