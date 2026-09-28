'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { precioLinea, type MealItem } from '@/lib/carrito-meals';
import { formatCLP } from '@/lib/productos';

/* Aviso al agregar un menú: la pregunta de la primera versión —¿ir al carro
   o seguir comprando?— con la estética actual.

   Es un <dialog> nativo abierto con showModal(): el navegador ya se encarga de
   atrapar el foco adentro, de cerrarlo con Escape y de dejarlo por encima de
   todo (el rail incluido), sin pelear con z-index. */

const mono = { fontFamily: "'Courier New', Courier, monospace" };

export default function AgregadoAlCarrito({
  titulo, detalle, precio, imagen, items, onCerrar,
}: {
  /** Lo agregado, en las palabras de cada página: un menú o un plato del lab. */
  titulo: string;
  detalle: string;
  precio: number;
  imagen: string;
  items: MealItem[];
  onCerrar: () => void;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const primario = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    d.showModal();
    // showModal enfoca lo primero que encuentra, que es la ✕. Lo que se
    // quiere a un Enter de distancia es ir al carrito.
    primario.current?.focus();

    // Con el aviso abierto la página de atrás no se mueve. Al esconder la
    // barra de scroll la página saltaría ese ancho: se compensa con padding.
    const html = document.documentElement;
    const barra = window.innerWidth - html.clientWidth;
    const antes = { overflow: html.style.overflow, padding: html.style.paddingRight };
    html.style.overflow = 'hidden';
    if (barra > 0) html.style.paddingRight = `${barra}px`;
    return () => {
      html.style.overflow = antes.overflow;
      html.style.paddingRight = antes.padding;
    };
  }, []);

  const lineasEnCarrito = items.length;
  const subtotal = items.reduce((s, i) => s + precioLinea(i), 0);

  return (
    <dialog
      ref={dialogo}
      onClose={onCerrar}
      // Un clic fuera de la tarjeta cae en el propio <dialog> (su ::backdrop);
      // uno adentro cae en el contenido.
      onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}
      // El navegador ya cierra con Escape, pero mirando el código de tecla (27);
      // algunos teclados virtuales y automatizaciones mandan solo el nombre.
      onKeyDown={(e) => { if (e.key === 'Escape') e.currentTarget.close(); }}
      aria-labelledby="agregado-titulo"
      className="agregado-dialogo m-auto w-[min(420px,calc(100%-32px))] rounded-2xl border border-white/15 bg-[#0b0b0b] p-0 text-preps-white backdrop:bg-black/75"
    >
      <div className="p-6 max-[520px]:p-5">
        <div className="flex items-center justify-between gap-4">
          <p id="agregado-titulo" className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[2px] text-preps-white">
            <span aria-hidden className="h-px w-5 bg-preps-white" />
            Agregado a tu pedido
          </p>
          <button
            type="button"
            onClick={() => dialogo.current?.close()}
            aria-label="Cerrar"
            className="-mr-2 grid h-9 w-9 place-items-center rounded-full text-white/55 transition-colors hover:text-preps-white"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <div className="relative aspect-[3/2] w-[120px] shrink-0 overflow-hidden rounded-lg bg-white/[.04]">
            <Image src={imagen} alt="" fill sizes="120px" className="object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-extrabold uppercase leading-tight tracking-[-.02em]">{titulo}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[1px] text-white/55">{detalle}</p>
            <p className="mt-2 text-lg font-semibold tracking-[-.5px]" style={mono}>{formatCLP(precio)}</p>
          </div>
        </div>

        <div className="mt-6 flex items-baseline justify-between gap-4 border-t border-white/15 pt-4">
          <span className="text-[10px] font-semibold uppercase tracking-[2px] text-white/55">
            En tu carrito · {lineasEnCarrito} {lineasEnCarrito === 1 ? 'línea' : 'líneas'}
          </span>
          <strong className="text-xl font-semibold tracking-[-.5px]" style={mono}>{formatCLP(subtotal)}</strong>
        </div>

        <Link
          ref={primario}
          href="/carrito"
          className="mt-6 flex w-full items-center justify-between rounded-full bg-preps-white px-6 py-[18px] text-[11px] font-bold uppercase tracking-[2px] text-preps-bg transition-opacity duration-200 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          Ir al carrito <span aria-hidden>→</span>
        </Link>
        <Link
          href="/personalizar"
          className="mt-2.5 flex w-full items-center justify-center rounded-full border border-white/25 px-6 py-[17px] text-[11px] font-semibold uppercase tracking-[2px] transition-colors duration-200 hover:border-white"
        >
          Seguir en el catálogo
        </Link>
      </div>
    </dialog>
  );
}
