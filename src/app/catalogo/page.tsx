import Link from 'next/link';
import Image from 'next/image';
import PaginaConRail from '@/components/PaginaConRail';
import { PRODUCTOS, hayEjemplos, formatCLP } from '@/lib/productos-dropi';

export const metadata = {
  title: 'Suplementos — PREPS',
  description: 'Suplementos y equipamiento PREPS. Próximamente.',
};

export default function SuplementosPage() {
  // Sin productos cargados la página anuncia que vienen; en cuanto haya uno en
  // PRODUCTOS, la grilla aparece sola.
  if (PRODUCTOS.length === 0) {
    return (
      <PaginaConRail>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[.4em] text-white/40">
            Suplementos
          </p>
          <h1 className="coming-title headline-metal">
            Próximamente
          </h1>
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/45">
            Estamos armando la selección. Mientras tanto, los menús ya están disponibles.
          </p>
          <Link
            href="/personalizar"
            className="mt-9 rounded-full border border-white/25 px-7 py-3.5 text-[10px] font-bold uppercase tracking-[.2em] transition-colors hover:border-white/60"
          >
            Ver meal preps
          </Link>
        </div>
      </PaginaConRail>
    );
  }

  return (
    <PaginaConRail>
      <header className="mb-12">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.4em] text-white/40">
          Catálogo
        </p>
        <h1 className="text-[clamp(32px,4.5vw,54px)] font-extrabold uppercase leading-[.92] tracking-[-.05em]">
          Suplementos
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-white/55">
          Suplementos y equipamiento, con envío a domicilio. Los menús se piden aparte
          desde{' '}
          <Link href="/personalizar" className="underline underline-offset-4 hover:text-preps-white">
            Meal Preps
          </Link>
          .
        </p>
      </header>

      {hayEjemplos() && (
        <p className="mb-8 rounded-lg border border-preps-yellow/40 bg-preps-yellow/10 px-4 py-3 text-[11px] leading-relaxed text-preps-yellow">
          Hay productos de ejemplo cargados. Editá <code>src/lib/productos-dropi.ts</code>{' '}
          para poner los reales de Dropi y borrar estos.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 max-[520px]:grid-cols-1">
        {PRODUCTOS.map((p) => (
          <Link
            key={p.slug}
            href={`/producto/${p.slug}`}
            className="group rounded-xl border border-white/15 p-4 transition-colors duration-200 hover:border-white/40"
          >
            <div className="relative mb-4 h-40 w-full overflow-hidden rounded-lg bg-white/5">
              <Image
                src={p.imagen}
                alt={p.nombre}
                fill
                sizes="(max-width: 520px) 100vw, 350px"
                className="object-contain p-6 transition-transform duration-300 group-hover:scale-[1.04]"
              />
            </div>

            <p className="text-[10px] uppercase tracking-[.2em] text-white/40">{p.categoria}</p>
            <h2 className="mt-1 text-sm font-bold uppercase leading-tight">{p.nombre}</h2>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-lg font-extrabold tracking-[-.03em]">
                {formatCLP(p.precio)}
              </span>
              {p.precioAntes && (
                <span className="text-[11px] text-white/35 line-through">
                  {formatCLP(p.precioAntes)}
                </span>
              )}
            </div>

            {p.stock !== null && p.stock <= 5 && (
              <p className="mt-2 text-[10px] uppercase tracking-[.15em] text-preps-yellow">
                {p.stock === 0 ? 'Sin stock' : `Quedan ${p.stock}`}
              </p>
            )}
          </Link>
        ))}
      </div>
    </PaginaConRail>
  );
}
