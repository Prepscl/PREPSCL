import Link from 'next/link';
import PaginaConRail from '@/components/PaginaConRail';

export const metadata = {
  title: 'Nosotros — PREPS',
  description: 'Diseñamos el combustible que tu cuerpo necesita para rendir al máximo.',
};

const ESTANDARES = [
  {
    titulo: 'Pesaje en cocido',
    texto:
      'Garantizamos que tus macros sean reales. Pesamos cada proteína una vez cocinada para que lo que comes sea exactamente lo que tu cuerpo requiere.',
  },
  {
    titulo: 'Higiene total',
    texto:
      'Operamos bajo estrictos protocolos de grado alimentario. La seguridad de tu comida es nuestra prioridad absoluta.',
  },
  {
    titulo: 'Precisión de macros',
    texto:
      'Cada ingrediente es seleccionado y pesado al gramo para garantizar que tu plan nutricional se cumpla al 100%.',
  },
  {
    titulo: 'Precio inteligente',
    texto:
      'Eliminamos procesados y el tiempo de cocina. Comer en PREPS cuesta lo mismo que comida rápida, pero con resultados de élite.',
  },
];

export default function NosotrosPage() {
  return (
    <PaginaConRail tema="oscuro" ancho={850}>
      <div className="nosotros-editorial">
      <div className="text-center">
        <p className="text-[16px] leading-[1.7] max-[520px]:text-[15px]">
          En{' '}
          <Link href="/" className="font-semibold no-underline hover:no-underline">
            PREPS
          </Link>
          , diseñamos el combustible que tu cuerpo necesita para rendir al máximo.
          Creemos que comer sano no debe ser una tarea difícil, sino una ventaja
          competitiva.
        </p>
      </div>

      <div className="mt-16 border border-white p-10 text-left max-[520px]:p-6">
        <h2 className="text-base font-semibold uppercase tracking-[-0.5px]">
          Estándar de calidad
        </h2>

        <ul className="mt-6 space-y-5">
          {ESTANDARES.map(({ titulo, texto }) => (
            <li key={titulo} className="text-[13px] uppercase leading-[1.7] tracking-[.5px]">
              <strong className="font-semibold">[✓] {titulo}:</strong> {texto}
            </li>
          ))}
        </ul>
      </div>

      <h3 className="mt-20 text-center text-[28px] font-semibold uppercase leading-[0.9] tracking-[-1.5px]">
        Diseñado para tu rendimiento.
      </h3>

      <footer className="mt-24 -mx-8 bg-white/10 px-8 py-14 text-center text-white max-[520px]:-mx-5 max-[520px]:px-5">
        <a
          href="https://www.instagram.com/prepscl/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] uppercase tracking-[2px] text-white/60 transition-opacity hover:opacity-100"
        >
          Instagram · @prepscl
        </a>

        <div className="mt-5">
          <Link
            href="/protocolo"
            className="border border-white/25 px-3 py-1.5 text-[10px] uppercase tracking-[2px] text-white/60 transition-colors hover:border-white/60 hover:text-white"
          >
            [ Ver protocolo de operación ]
          </Link>
        </div>

        <p className="mt-5 text-[10px] uppercase tracking-[2px] text-white/60">
          © 2026 PREPS Chile — Diseñado para tu rendimiento
        </p>
      </footer>
      </div>
    </PaginaConRail>
  );
}
