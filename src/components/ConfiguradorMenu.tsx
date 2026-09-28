'use client';

import { useState } from 'react';
import { useMealCart } from '@/lib/carrito-meals';
import clsx from 'clsx';
import AgregadoAlCarrito from './AgregadoAlCarrito';
import CompraInfo from './CompraInfo';
import {
  PACKS, formatCLP, precioPorUnidad,
  type Pack, type Variante,
} from '@/lib/productos';

/** Selección de paquete y sazón. El precio lo fija el paquete elegido. */
export default function ConfiguradorMenu({ variante }: { variante: Variante }) {
  const [pack, setPack] = useState<Pack>(PACKS[0]);
  const [conPimienta, setConPimienta] = useState(true);
  const carrito = useMealCart();
  // Lo que se acaba de agregar, para el aviso. Va aparte de la selección
  // porque la persona puede cambiarla después de cerrarlo.
  const [agregado, setAgregado] = useState<{ pack: Pack; pimienta: boolean } | null>(null);

  return (
    <>
      <div style={{ fontFamily: "'Courier New', Courier, monospace" }} className="mt-8 text-3xl font-semibold tracking-[-1px]" aria-live="polite">
        {formatCLP(pack.precio)}
      </div>
      <p className="mt-1 text-xs text-white/45">
        {formatCLP(precioPorUnidad(pack))} por comida · despacho no incluido
      </p>

      {/* ── Paquete ─────────────────────────────────────────── */}
      <div className="mt-7">
        <span className="block text-[10px] font-semibold uppercase tracking-[2px] text-white/55">
          Comidas por pack
        </span>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {PACKS.map((p) => {
            const activo = p.unidades === pack.unidades;
            return (
              <button
                key={p.unidades}
                type="button"
                onClick={() => setPack(p)}
                aria-pressed={activo}
                className={clsx(
                  'rounded-lg border p-4 text-center transition-colors duration-200',
                  activo
                    ? 'border-white bg-white/10 text-white'
                    : 'border-white/20 hover:border-white'
                )}
              >
                <span style={{ fontFamily: "'Courier New', Courier, monospace" }} className="text-2xl font-semibold leading-none">{p.unidades}</span>
              </button>
            );
          })}
        </div>

        <span className="mt-6 block text-[10px] font-semibold uppercase tracking-[2px] text-white/55">
          Pimienta negra
        </span>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {[
            { label: 'Con', valor: true },
            { label: 'Sin', valor: false },
          ].map(({ label, valor }) => (
            <button
              key={label}
              type="button"
              onClick={() => setConPimienta(valor)}
              aria-pressed={conPimienta === valor}
              className={clsx(
                'rounded-lg border px-4 py-3 text-[10px] font-semibold uppercase tracking-[1px] transition-colors duration-200',
                conPimienta === valor
                  ? 'border-white bg-white/10 text-white'
                  : 'border-white/20 hover:border-white'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={!carrito.ready}
        onClick={() => {
          if (carrito.agregar(variante.slug, pack.unidades, conPimienta)) setAgregado({ pack, pimienta: conPimienta });
        }}
        className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-white/10 px-6 py-5 text-[11px] font-semibold uppercase tracking-[2px] text-white transition-transform duration-200 hover:scale-[1.01] active:scale-[.99]"
      >
        Agregar al carrito
        <span aria-hidden>→</span>
      </button>
      {carrito.error && <p role="alert" className="mt-4 text-sm text-red-300">{carrito.error}</p>}
      {agregado && (
        <AgregadoAlCarrito
          titulo={variante.nombre}
          detalle={`${agregado.pack.unidades} comidas · ${agregado.pimienta ? 'con' : 'sin'} pimienta`}
          precio={agregado.pack.precio}
          imagen={variante.imagen}
          items={carrito.items}
          onCerrar={() => setAgregado(null)}
        />
      )}

      {/* Dice lo mismo que antes —que el carrito no cierra nada— pero contando
          lo que sigue en vez de lo que falta. El aviso de que no reserva cupo
          ya está en la pregunta de cupos, que es donde alguien lo busca. */}
      <p className="mt-4 text-center text-xs leading-relaxed text-white/65">
        El despacho se suma según tu comuna en el siguiente paso. El pago es por transferencia.
      </p>
      {/* Abierto: en un meal prep los macros son el argumento de compra, no
          letra chica. Esconderlos detrás de un clic y debajo del botón deja la
          decisión sin el dato que la sostiene. */}
      <details open className="mt-7 border-t border-white/15 text-xs leading-relaxed text-white/55">
        <summary className="cursor-pointer py-4">Ingredientes y nutrición</summary>
        <p>{variante.gramos}</p>
        <p className="mt-3">{variante.macros.prot} g proteína · {variante.macros.carb} g carbohidratos · {variante.macros.fat} g grasas · {variante.macros.kcal} kcal por comida</p>
        <p className="my-3">{variante.descripcion}</p>
      </details>
      <CompraInfo compacto />
    </>
  );
}
