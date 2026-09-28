import Link from 'next/link';
import PaginaConRail from '@/components/PaginaConRail';

export const metadata = {
  title: 'Protocolo de activación — PREPS',
  description: 'Cómo calentar tu PREPS para conservar textura y macros.',
};

const FASES = [
  {
    fase: 'Fase 01',
    titulo: 'Apertura de cámara',
    texto:
      'Primero deslizá la etiqueta y retirá la tapa del envase parcialmente, o hacé pequeñas perforaciones para permitir la salida controlada de presión.',
  },
  {
    fase: 'Fase 02',
    titulo: 'Hidratación',
    texto:
      'Introducí una cucharada de agua sobre el arroz y el pollo, y volvé a cerrar el envase. Esto genera una cámara de vapor que mantiene la textura original de los macronutrientes.',
  },
  {
    fase: 'Fase 03',
    titulo: 'Activación térmica',
    texto:
      'Calentá en microondas a potencia media durante 3 minutos, o 7 si está congelado. Al sacarlo, volvé a poner la etiqueta y dejá reposar 1 minuto. Pasado ese tiempo, abrí el envase con precaución para dejar escapar el vapor.',
  },
];

export default function CalentarPage() {
  return (
    <PaginaConRail tema="oscuro" ancho={750}>
      <div className="text-center">
        <h1 className="text-[32px] font-semibold uppercase leading-[0.9] tracking-[-1.5px] max-[520px]:text-2xl">
          Muchas gracias por comprar
        </h1>
        <p className="mt-3 text-[10px] uppercase tracking-[2px] text-white/55">
          Protocolo de activación
        </p>
      </div>

      <ol className="mt-14 space-y-6">
        {FASES.map(({ fase, titulo, texto }) => (
          <li key={fase} className="border border-white p-8 max-[520px]:p-6">
            <div className="text-[10px] font-semibold uppercase tracking-[2px] text-white/55">
              {fase}
            </div>
            <h2 className="mt-2 text-base font-semibold uppercase tracking-[-0.5px]">{titulo}</h2>
            <p className="mt-3 text-[13px] uppercase leading-[1.7] tracking-[.5px]">{texto}</p>
          </li>
        ))}
      </ol>

      <p className="mt-12 text-center text-xs font-semibold uppercase tracking-[1px]">
        Protocolo completado. Disfrutá tu PREPS.
      </p>

      <div className="mt-10 text-center">
        <Link
          href="/personalizar"
          className="inline-block bg-white/10 px-7 py-4 text-[10px] font-semibold uppercase tracking-[2px] text-white transition-transform duration-200 hover:scale-[1.02]"
        >
          Volver a pedir
        </Link>
      </div>
    </PaginaConRail>
  );
}
