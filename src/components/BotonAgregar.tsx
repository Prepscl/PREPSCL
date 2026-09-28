'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCarrito } from '@/lib/carrito';
import type { ProductoDropi } from '@/lib/productos-dropi';

export default function BotonAgregar({ producto }: { producto: ProductoDropi }) {
  const { agregar } = useCarrito();
  const [cantidad, setCantidad] = useState(1);
  const [agregado, setAgregado] = useState(false);

  const sinStock = producto.stock === 0;
  const tope = producto.stock ?? 99;

  function onAgregar() {
    agregar(producto, cantidad);
    setAgregado(true);
  }

  if (sinStock) {
    return (
      <p className="rounded-full border border-white/15 px-6 py-4 text-center text-[11px] font-bold uppercase tracking-[.2em] text-white/30">
        Sin stock
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <span className="text-[10px] uppercase tracking-[.2em] text-white/40">Cantidad</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCantidad((c) => Math.max(1, c - 1))}
            disabled={cantidad === 1}
            aria-label="Quitar uno"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/25 text-lg leading-none transition-colors hover:border-white/60 disabled:opacity-25"
          >
            −
          </button>
          <span className="w-7 text-center text-lg font-bold tabular-nums">{cantidad}</span>
          <button
            type="button"
            onClick={() => setCantidad((c) => Math.min(tope, c + 1))}
            disabled={cantidad >= tope}
            aria-label="Agregar uno"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/25 text-lg leading-none transition-colors hover:border-white/60 disabled:opacity-25"
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onAgregar}
        className="w-full rounded-full bg-preps-white px-6 py-4 text-[11px] font-bold uppercase tracking-[.2em] text-black transition-transform duration-200 hover:scale-[1.01] active:scale-[.99]"
      >
        Agregar al carrito
      </button>

      {agregado && (
        <p className="mt-4 text-center text-[11px] text-white/55" role="status">
          Agregado.{' '}
          <Link href="/carrito" className="underline underline-offset-4 hover:text-preps-white">
            Ir al carrito
          </Link>
        </p>
      )}
    </div>
  );
}
