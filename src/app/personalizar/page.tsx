import Link from 'next/link';
import Image from 'next/image';
import PaginaConRail from '@/components/PaginaConRail';
import { VARIANTES, formatCLP, PACKS } from '@/lib/productos';
import CompraInfo from '@/components/CompraInfo';
import { MINIMO_PEDIDO, CANTIDAD_MINIMA } from '@/lib/lab';
import styles from './catalogo.module.css';
import MenuCarousel from './MenuCarousel';
import { Inter } from 'next/font/google';

const catalogFont = Inter({ subsets: ['latin'], weight: ['900'], variable: '--font-catalog-original', display: 'swap' });

export const metadata = {
  title: 'Menús y precios — PREPS',
  description: 'Los menús PREPS: Power Breast Low Carb y High Carb, por pack.',
};

export default function CustomLabPage() {
  const desde = PACKS[0];

  return (
    <PaginaConRail tema="oscuro" ancho={1200} centrarConRail>
      <h1 className="sr-only">Menús PREPS</h1>
      <MenuCarousel className={catalogFont.variable}>
        {VARIANTES.map((v) => (
          <Link
            key={v.slug}
            href={`/personalizar/${v.slug}`}
            className="flex min-w-0 flex-col text-preps-white"
          >
            <div className={styles.productPhoto}>
              <Image
                src={v.imagen}
                alt={v.titulo}
                fill
                sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 400px"
                className="object-contain"
              />
            </div>

            <div className="flex flex-1 flex-col px-5 pb-6 pt-4">
              <h2 className="mb-[15px] text-base font-semibold uppercase tracking-[-0.5px]">
                <span>Power Breast</span>{' '}<span>{v.nombre}</span>
              </h2>
              <div className="menu-price-original">Desde {formatCLP(desde.precio)}</div>
              <span className="menu-select">Elegir {v.nombre}</span>
            </div>
          </Link>
        ))}

        {/* Configurador por gramos */}
        <Link
          href="/personalizar/lab"
          className="flex min-w-0 flex-col text-preps-white"
        >
          <div className={styles.productPhoto}>
            <Image
              src="/img/26.webp"
              alt="Custom Lab: arma tu plato por gramos"
              fill
              sizes="(max-width: 520px) 100vw, 500px"
              className="object-contain drop-shadow-[0_18px_25px_rgba(0,0,0,0.18)]"
            />
          </div>

          <div className="flex flex-1 flex-col px-5 pb-6 pt-4">
            <h2 className="mb-[15px] text-base font-semibold uppercase tracking-[-0.5px]">
              <span>Custom Lab</span>{' '}<span>Performance V1.0</span>
            </h2>
            <div className="menu-price-original">Desde {formatCLP(MINIMO_PEDIDO)}</div>
            <div className="mt-2 text-[10px] uppercase tracking-[1px] text-white/55">
              Arma tu plato por gramos · mín. {CANTIDAD_MINIMA} unidades
            </div>
            <span className="menu-select">Personalizar mi pack</span>
          </div>
        </Link>
      </MenuCarousel>
      <CompraInfo />
    </PaginaConRail>
  );
}
