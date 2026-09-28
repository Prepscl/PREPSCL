'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useCarritoCount } from '@/lib/carrito';
import { useMealCart } from '@/lib/carrito-meals';
import type { MouseEvent } from 'react';
import { requestHomeEntry } from '@/lib/home-entry';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/personalizar', label: 'Meal Preps' },
  { href: '/catalogo', label: 'Suplementos' },
  { href: '/nosotros', label: 'Nosotros', hideOnMobile: true },
];

/**
 * `solido` es para las páginas de fondo claro: sobre la foto del home el rail
 * va translúcido, pero sobre #f2f2f2 el texto blanco desaparece, así que ahí
 * necesita su propio fondo negro.
 */
export default function Rail({ solido = false, onHomeClick }: { solido?: boolean; onHomeClick?: (target: 'logo' | 'nav') => void }) {
  const pathname = usePathname();
  const supplementCount = useCarritoCount();
  const mealCart = useMealCart();
  // Líneas, no unidades: un pack de 28 y un plato del configurador son cada
  // uno una cosa en el carrito, y así el número no se dispara.
  const cartCount = supplementCount + mealCart.items.length;

  function enterHome(event: MouseEvent<HTMLAnchorElement>, target: 'logo' | 'nav') {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (pathname === '/' && onHomeClick) {
      event.preventDefault();
      onHomeClick(target);
    } else {
      requestHomeEntry();
    }
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header
      className={clsx(
        'site-rail absolute z-[5] animate-railIn',
        // Desktop: vertical rail pinned left
        'inset-y-0 left-0 flex w-[168px] flex-col border-r border-[var(--line)] px-[25px] pb-[30px] pt-[34px]',
        solido ? 'bg-preps-bg' : 'bg-gradient-to-r from-black/20 to-transparent',
        // Mobile: horizontal bar across the top
        'max-[520px]:inset-x-0 max-[520px]:bottom-auto max-[520px]:h-[86px] max-[520px]:w-full',
        'max-[520px]:flex-row max-[520px]:items-center max-[520px]:border-b max-[520px]:border-r-0',
        solido
          ? 'max-[520px]:bg-preps-bg max-[520px]:px-[18px] max-[520px]:py-5'
          : 'max-[520px]:bg-black/30 max-[520px]:px-[18px] max-[520px]:py-5 max-[520px]:backdrop-blur-xl'
      )}
    >
      <Link
        href="/"
        aria-label="PREPS Home"
        data-home-entry="logo"
        onClick={event => enterHome(event, 'logo')}
        className="relative block w-[92px] overflow-hidden leading-[0] max-[520px]:w-[74px]"
        style={{ aspectRatio: '708 / 174' }}
      >
        {/* Wordmark is cropped out of the full logo sheet */}
        <img
          src="/img/logo-preps.webp"
          alt="PREPS"
          className="absolute block h-auto max-w-none"
          style={{ top: '-244.25%', left: '-22.6%', width: '144.63%' }}
        />
      </Link>

      <nav
        aria-label="Navegación principal"
        className={clsx(
          'my-auto flex flex-col gap-[17px]',
          'max-[520px]:my-0 max-[520px]:ml-auto max-[520px]:flex-row max-[520px]:gap-[15px]'
        )}
      >
        {NAV.map(({ href, label, hideOnMobile }) => (
          <Link
            key={href}
            href={href}
            data-home-entry={href === '/' ? 'nav' : undefined}
            onClick={href === '/' ? event => enterHome(event, 'nav') : undefined}
            className={clsx(
              'group relative w-max text-[10px] font-semibold uppercase tracking-[.15em] no-underline',
              'transition-[color,transform] duration-[180ms] ease-expo',
              'hover:translate-x-2 hover:text-preps-white',
              'max-[520px]:text-[8px] max-[520px]:tracking-[.1em] max-[520px]:hover:translate-x-0',
              hideOnMobile && 'max-[520px]:hidden',
              isActive(href)
                ? 'translate-x-2 text-preps-white max-[520px]:translate-x-0'
                : 'text-[var(--muted)]'
            )}
          >
            {/* Leading rule that grows on hover / active */}
            <span
              aria-hidden
              className={clsx(
                'absolute left-[-25px] top-1/2 h-px bg-preps-white transition-[width] duration-[260ms] ease-expo',
                'group-hover:w-[18px] max-[520px]:hidden',
                isActive(href) ? 'w-[18px]' : 'w-0'
              )}
            />
            {label}
          </Link>
        ))}

        <Link
          href="/carrito"
          className={clsx(
            'group relative inline-flex w-max items-center gap-[7px] text-[10px] font-semibold uppercase tracking-[.15em] no-underline',
            'transition-[color,transform] duration-[180ms] ease-expo',
            'hover:translate-x-2 hover:text-preps-white',
            'max-[520px]:text-[8px] max-[520px]:tracking-[.1em] max-[520px]:hover:translate-x-0',
            isActive('/carrito')
              ? 'translate-x-2 text-preps-white max-[520px]:translate-x-0'
              : 'text-[var(--muted)]'
          )}
        >
          <span
            aria-hidden
            className={clsx(
              'absolute left-[-25px] top-1/2 h-px bg-preps-white transition-[width] duration-[260ms] ease-expo',
              'group-hover:w-[18px] max-[520px]:hidden',
              isActive('/carrito') ? 'w-[18px]' : 'w-0'
            )}
          />
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden="true"
            className="h-3.5 w-3.5"
          >
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
          </svg>
          Carrito
          {cartCount > 0 && (
            <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-[20px] bg-preps-white px-1 text-[8px] tracking-normal text-[#050505]">
              {cartCount}
            </span>
          )}
        </Link>
      </nav>

      <div className="text-[8px] font-medium uppercase leading-[1.6] tracking-[.13em] text-white/[.38] max-[520px]:hidden">
        Santiago, Chile
        <br />
        PREPS © 2026
      </div>
    </header>
  );
}
