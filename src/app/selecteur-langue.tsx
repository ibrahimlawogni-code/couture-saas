import { LANGUES, traduire, type Langue } from "@/lib/i18n";
import { choisirLangue } from "./actions-langue";

/*
 * Choisir sa langue avant d'avoir un compte.
 *
 * Deux mots dans un coin, pas un menu : il n'y a que deux langues, et un
 * deroulant pour deux entrees demande un geste de plus pour rien. Chaque
 * langue est ecrite dans la sienne - « English » se reconnait meme sur une
 * page francaise, ce que « Anglais » ne ferait pas.
 *
 * Un formulaire et une action serveur plutot qu'une ecriture de cookie
 * cote client. Le choix fonctionne alors sans JavaScript, donc des le
 * premier octet affiche : sur un telephone d'entree de gamme et un reseau
 * lent, la page est lisible bien avant d'etre interactive, et c'est
 * precisement le moment ou quelqu'un qui ne comprend pas la langue s'en va.
 */
export function SelecteurLangue({
  langue,
  surFondSombre = false,
}: {
  langue: Langue;
  surFondSombre?: boolean;
}) {
  const mots = traduire(langue);

  return (
    <form
      action={choisirLangue}
      className={`flex items-center justify-center gap-1 text-xs ${
        surFondSombre ? "text-vert-pale" : "text-gris"
      }`}
    >
      {LANGUES.map((code, rang) => (
        <span key={code} className="flex items-center gap-1">
          {rang > 0 && (
            <span
              aria-hidden
              className={surFondSombre ? "text-white/30" : "text-bordure"}
            >
              ·
            </span>
          )}
          <button
            type="submit"
            name="langue"
            value={code}
            aria-current={code === langue ? "true" : undefined}
            /*
             * La cible fait 44 px comme partout ailleurs, meme si le texte
             * n'en occupe qu'une douzaine : ces deux mots sont serres l'un
             * contre l'autre, et se tromper de langue au doigt serait
             * autrement facile.
             */
            className={`min-h-11 rounded-controle px-1.5 ${
              code === langue
                ? `font-semibold ${surFondSombre ? "text-white" : "text-encre"}`
                : "underline underline-offset-2"
            }`}
          >
            {mots.langues[code]}
          </button>
        </span>
      ))}
    </form>
  );
}
