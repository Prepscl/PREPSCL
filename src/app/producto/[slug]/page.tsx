import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PaginaConRail from '@/components/PaginaConRail';
import BotonAgregar from '@/components/BotonAgregar';
import { PRODUCTOS, getProducto, formatCLP } from '@/lib/productos-dropi';

export function generateStaticParams() {
  return PRODUCTOS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const producto = getProducto(params.slug);
  if (!producto) return { title: 'Producto no encontrado — PREPS' };
  return { title: `${producto.nombre} — PREPS`, description: producto.descripcion };
}

export default function ProductoPage({ params }: { params: { slug: string } }) {
  const producto = getProducto(params.slug);
  if (!producto) notFound();

  return (
    <PaginaConRail>
      <Link
        href="/catalogo"
        className="mb-10 inline-block text-[10px] uppercase tracking-[.2em] text-white/40 transition-colors hover:text-preps-white"
      >
        ← Catálogo
      </Link>

      <div className="grid grid-cols-2 gap-10 max-[860px]:grid-cols-1 max-[860px]:gap-6">
        <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-white/5">
          <Image
            src={producto.imagen}
            alt={producto.nombre}
            fill
            priority
            sizes="(max-width: 520px) 100vw, 400px"
            className="object-contain p-10"
          />
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-[10px] uppercase tracking-[.25em] text-white/40">
            {producto.categoria}
          </p>
          <h1 className="mt-2 text-[clamp(24px,3.2vw,38px)] font-extrabold uppercase leading-[.95] tracking-[-.04em]">
            {producto.nombre}
          </h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-extrabold tracking-[-.03em]">
              {formatCLP(producto.precio)}
            </span>
            {producto.precioAntes && (
              <span className="text-sm text-white/35 line-through">
                {formatCLP(producto.precioAntes)}
              </span>
            )}
          </div>

          <p className="mt-5 text-sm leading-relaxed text-white/55">{producto.descripcion}</p>

          <div className="mt-8">
            <BotonAgregar producto={producto} />
          </div>
        </div>
      </div>
    </PaginaConRail>
  );
}
