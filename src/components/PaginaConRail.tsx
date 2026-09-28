import clsx from 'clsx';
import Rail from './Rail';
import SocialFooter from './SocialFooter';

type Tema = 'oscuro' | 'claro';

/**
 * Layout de las páginas de contenido: el rail fijo a la izquierda en desktop,
 * como barra superior en mobile, y el contenido corrido para no quedar debajo.
 * El home no lo usa porque ahí el rail va sobre la foto a pantalla completa.
 *
 * `tema="claro"` reproduce el fondo #f2f2f2 del catálogo original; el rail pasa
 * a fondo sólido para no perderse sobre el claro.
 *
 * `ancho` es el ancho máximo del contenido en píxeles. El centrado vive en el
 * CSS (`.pagina-main` / `.pagina-contenido`): con pantalla ancha el bloque se
 * centra en la ventana completa y no en el hueco a la derecha del rail.
 */
export default function PaginaConRail({
  children,
  tema = 'oscuro',
  ancho = 768,
  centrarConRail = false,
}: {
  children: React.ReactNode;
  tema?: Tema;
  ancho?: number;
  centrarConRail?: boolean;
}) {
  const claro = tema === 'claro';

  return (
    <div
      className={clsx(
        'preps-page relative min-h-screen w-full bg-preps-bg text-preps-white'
      )}
    >
      <Rail solido={claro} />
      <main
        className={clsx('pagina-main py-16 max-[520px]:pb-16 max-[520px]:pt-[110px]', centrarConRail && 'pagina-main--rail-centered')}
        style={{ ['--ancho' as string]: `${ancho}px` }}
      >
        <div className="pagina-contenido mx-auto">{children}<SocialFooter /></div>
      </main>
    </div>
  );
}
