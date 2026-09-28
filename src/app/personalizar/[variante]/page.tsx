import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PaginaConRail from '@/components/PaginaConRail';
import ConfiguradorMenu from '@/components/ConfiguradorMenu';
import { VARIANTES, getVariante } from '@/lib/productos';

export function generateStaticParams() {
  return VARIANTES.map((v) => ({ variante: v.slug }));
}

export function generateMetadata({ params }: { params: { variante: string } }) {
  const v = getVariante(params.variante);
  if (!v) return { title: 'Menú no encontrado — PREPS' };
  return { title: `${v.titulo} — PREPS`, description: v.descripcion };
}

export default function MenuPage({ params }: { params: { variante: string } }) {
  const variante = getVariante(params.variante);
  if (!variante) notFound();

  return (
    <PaginaConRail tema="oscuro" ancho={1000}>
      <Link
        href="/personalizar"
        className="mb-10 inline-block text-[10px] font-semibold uppercase tracking-[2px] text-white/55 transition-colors hover:text-preps-white"
      >
        ← Menús
      </Link>

      <div className="grid grid-cols-2 gap-12 max-[860px]:grid-cols-1 max-[860px]:gap-8">
        <div className="relative aspect-[3/2] w-full">
          <Image
            src={variante.imagen}
            alt={variante.titulo}
            fill
            priority
            sizes="(max-width: 520px) 100vw, 480px"
            className="object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.18)]"
          />
        </div>

        <div>
          <h1 className="text-[28px] font-semibold uppercase leading-[0.95] tracking-[-1px]">
            {variante.titulo}
          </h1>

          <ConfiguradorMenu variante={variante} />
        </div>
      </div>
    </PaginaConRail>
  );
}
