'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import PaginaConRail from '@/components/PaginaConRail';
import CompraInfo from '@/components/CompraInfo';
import AgregadoAlCarrito from '@/components/AgregadoAlCarrito';
import { limpiarEtiqueta, useMealCart, type ItemLab } from '@/lib/carrito-meals';
import {
  GRAMOS_MAX, GRAMOS_PASO, SAL_MAX, CANTIDAD_MINIMA, CANTIDAD_MAXIMA,
  precioUnitario, motivoBloqueo, calcularMacros, nombreProtocolo,
  idCombinacion, fotoReceta, formatCLP,
  type Preparacion, type Receta,
} from '@/lib/lab';

const INGREDIENTES = [
  { id: 'pollo' as const, label: 'Pollo' },
  { id: 'arroz' as const, label: 'Arroz' },
  { id: 'brocoli' as const, label: 'Brócoli' },
];

export default function LabPage() {
  const [receta, setReceta] = useState<Receta>({
    pollo: 100, arroz: 100, brocoli: 100, prep: 'PLANCHA',
  });
  const [sal, setSal] = useState(0);
  const [conPimienta, setConPimienta] = useState(true);
  const [etiqueta, setEtiqueta] = useState('');
  const [color, setColor] = useState('#ffffff');
  const [cantidad, setCantidad] = useState(CANTIDAD_MINIMA);
  const carrito = useMealCart();
  const [agregado, setAgregado] = useState<Omit<ItemLab, 'id' | 'clase'> | null>(null);

  const unitario = precioUnitario(receta);
  const macros = calcularMacros(receta);
  const bloqueo = motivoBloqueo(receta, cantidad);

  function setGramos(id: 'pollo' | 'arroz' | 'brocoli', valor: number) {
    setReceta((r) => ({ ...r, [id]: valor }));
  }

  return (
    <PaginaConRail tema="oscuro" ancho={1100}>
      <Link
        href="/personalizar"
        className="mb-10 inline-block text-[10px] font-semibold uppercase tracking-[2px] text-white/55 transition-colors hover:text-preps-white"
      >
        ← Menús
      </Link>

      <h1 className="text-center text-[32px] font-semibold uppercase leading-[0.9] tracking-[-1.5px] max-[520px]:text-2xl">
        Custom Lab Performance V1.0
      </h1>
      <p className="mt-4 text-center text-[10px] uppercase tracking-[2px] text-white/55">
        Diseñado con precisión by PREPS · más de 1.600 combinaciones posibles
      </p>

      <div className="mt-14 grid grid-cols-2 gap-14 max-[860px]:grid-cols-1 max-[860px]:gap-10">
        {/* ── Preview ─────────────────────────────────────────── */}
        <div className="max-[520px]:order-1">
          <div className="sticky top-16">
            <div className="text-[10px] font-semibold uppercase tracking-[2px]">
              Unidad: {nombreProtocolo(receta)}
            </div>
            <div className="mt-1 text-[10px] tracking-[2px] text-white/55">
              ID: #{String(idCombinacion(receta)).padStart(4, '0')}
            </div>

            <div className="relative mt-6 aspect-[3/2] w-full">
              <Image
                key={fotoReceta(receta)}
                src={fotoReceta(receta)}
                alt={`Plato con ${receta.pollo}g de pollo, ${receta.arroz}g de arroz y ${receta.brocoli}g de brócoli`}
                fill
                priority
                sizes="(max-width: 520px) 100vw, 500px"
                className="object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.18)]"
              />
            </div>

            <div className="mt-6 border-t border-white/15 pt-5">
              {[
                ['Proteína', `${macros.prot}g`],
                ['Carbos', `${macros.carb}g`],
                ['Grasas', `${macros.fat}g`],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between py-1 text-[11px] font-semibold uppercase tracking-[1px]"
                >
                  <span className="text-white/55">{k}</span>
                  <span>{v}</span>
                </div>
              ))}
              <div className="mt-2 flex justify-between border-t border-white/15 pt-3 text-[11px] font-semibold uppercase tracking-[1px]">
                <span className="text-white/55">Energía total</span>
                <span>{macros.kcal} kcal</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Configurador ────────────────────────────────────── */}
        <div className="max-[520px]:order-2">
          <div className="border-b border-white/20 pb-2 text-[10px] font-semibold uppercase tracking-[2px] text-white/55">
            Personalizá a tu conveniencia · máx {GRAMOS_MAX}g
          </div>

          {INGREDIENTES.map(({ id, label }) => (
            <div key={id} className="mt-8">
              <div className="flex justify-between text-[11px] font-semibold uppercase tracking-[1px]">
                <span>{label}</span>
                <span>{receta[id]}g</span>
              </div>
              <input
                type="range"
                min={0}
                max={GRAMOS_MAX}
                step={GRAMOS_PASO}
                value={receta[id]}
                onChange={(e) => setGramos(id, Number(e.target.value))}
                aria-label={`Gramos de ${label}`}
                className="mt-3 w-full accent-black"
              />

              {id === 'pollo' && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {(['COCIDO', 'PLANCHA'] as Preparacion[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setReceta((r) => ({ ...r, prep: p }))}
                      aria-pressed={receta.prep === p}
                      className={clsx(
                        'border px-4 py-3 text-[10px] font-semibold uppercase tracking-[1px] transition-colors',
                        receta.prep === p
                          ? 'border-white bg-white/10 text-white'
                          : 'border-white/20 hover:border-white'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Sazón */}
          <div className="mt-8">
            <div className="text-[11px] font-semibold uppercase tracking-[1px]">
              Sazón: pimienta negra
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {[
                { label: 'Con pimienta', valor: true },
                { label: 'Sin pimienta', valor: false },
              ].map(({ label, valor }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setConPimienta(valor)}
                  aria-pressed={conPimienta === valor}
                  className={clsx(
                    'border px-4 py-3 text-[10px] font-semibold uppercase tracking-[1px] transition-colors',
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

          {/* Sal */}
          <div className="mt-8">
            <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[1px]">
              Sal rosada del Himalaya
              <span className="bg-white/10 px-1.5 py-0.5 text-[9px] text-white">Opcional</span>
            </div>
            <div className="mt-3 flex items-center gap-4">
              <button
                type="button"
                onClick={() => setSal((s) => Math.max(0, s - 1))}
                disabled={sal === 0}
                aria-label="Menos sal"
                className="grid h-11 w-11 place-items-center border border-white text-xl leading-none transition-colors hover:bg-white/10 hover:text-white disabled:border-white/20 disabled:text-white/55 disabled:hover:bg-transparent"
              >
                −
              </button>
              <span className="w-12 text-center text-lg font-semibold tabular-nums">{sal}g</span>
              <button
                type="button"
                onClick={() => setSal((s) => Math.min(SAL_MAX, s + 1))}
                disabled={sal === SAL_MAX}
                aria-label="Más sal"
                className="grid h-11 w-11 place-items-center border border-white text-xl leading-none transition-colors hover:bg-white/10 hover:text-white disabled:border-white/20 disabled:text-white/55 disabled:hover:bg-transparent"
              >
                +
              </button>
            </div>
          </div>

          {/* Etiqueta */}
          <div className="mt-10 border-t border-white/20 pt-6">
            <div className="text-[10px] font-semibold uppercase tracking-[2px] text-white/55">
              Datos de etiqueta
            </div>

            <label className="mt-4 block text-[11px] font-semibold uppercase tracking-[1px]">
              Nombre en etiqueta
              <input
                type="text"
                maxLength={15}
                value={etiqueta}
                onChange={(e) => setEtiqueta(e.target.value)}
                placeholder="Ej: tu nombre o meta"
                className="mt-2 w-full border border-white/25 px-4 py-3 text-[11px] font-semibold uppercase tracking-[1px] outline-none placeholder:text-white/45 focus:border-white"
              />
            </label>

            <label className="mt-5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[1px]">
              Color de referencia
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-16 cursor-pointer border border-white/25 bg-[#111111]"
              />
            </label>
          </div>

          {/* Cierre */}
          <div className="mt-10 border-t border-white/20 pt-6">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setCantidad((c) => Math.max(CANTIDAD_MINIMA, c - 1))}
                disabled={cantidad === CANTIDAD_MINIMA}
                aria-label="Menos unidades"
                className="grid h-11 w-11 place-items-center border border-white text-xl leading-none transition-colors hover:bg-white/10 hover:text-white disabled:border-white/20 disabled:text-white/55 disabled:hover:bg-transparent"
              >
                −
              </button>
              <span className="w-8 text-center text-lg font-semibold tabular-nums">{cantidad}</span>
              <button
                type="button"
                onClick={() => setCantidad((c) => Math.min(CANTIDAD_MAXIMA, c + 1))}
                disabled={cantidad === CANTIDAD_MAXIMA}
                aria-label="Más unidades"
                className="grid h-11 w-11 place-items-center border border-white text-xl leading-none transition-colors hover:bg-white/10 hover:text-white disabled:border-white/20 disabled:text-white/55 disabled:hover:bg-transparent"
              >
                +
              </button>

              <div className="ml-auto text-right">
                <div className="text-2xl font-semibold tracking-[-1px]">
                  {formatCLP(unitario * cantidad)}
                </div>
                <div className="text-[10px] uppercase tracking-[1px] text-white/55">
                  {cantidad} × {formatCLP(unitario)}
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-white/70">
              Subtotal de comidas; el despacho se suma según tu comuna en el carrito. Entregamos los lunes por la mañana.
            </p>
            {bloqueo === null ? (
              <button
                type="button"
                disabled={!carrito.ready}
                onClick={() => {
                  const datos = {
                    pollo: receta.pollo, arroz: receta.arroz, brocoli: receta.brocoli, prep: receta.prep,
                    sal, pimienta: conPimienta,
                    etiqueta: limpiarEtiqueta(etiqueta), color,
                    cantidad,
                  };
                  if (carrito.agregarLab(datos)) setAgregado(datos);
                }}
                className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-white/10 px-6 py-5 text-[11px] font-semibold uppercase tracking-[2px] text-white transition-transform duration-200 hover:scale-[1.01] active:scale-[.99]"
              >
                Agregar al carrito
                <span aria-hidden>→</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled
                  className="mt-6 w-full cursor-not-allowed rounded-full border border-white/20 px-6 py-5 text-[11px] font-semibold uppercase tracking-[2px] text-white/55"
                >
                  Agregar al carrito
                </button>
                <p
                  className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[1px] text-[#ff3333]"
                  role="status"
                >
                  {bloqueo}
                </p>
              </>
            )}
            {carrito.error && <p role="alert" className="mt-3 text-sm text-red-300">{carrito.error}</p>}
            {agregado && (
              <AgregadoAlCarrito
                titulo={`Custom Lab · ${nombreProtocolo(receta)}`}
                detalle={`${agregado.cantidad} comidas · ${agregado.pollo}g pollo · ${agregado.arroz}g arroz · ${agregado.brocoli}g brócoli`}
                precio={unitario * agregado.cantidad}
                imagen={fotoReceta(receta)}
                items={carrito.items}
                onCerrar={() => setAgregado(null)}
              />
            )}
          </div>
        </div>
      </div>
      <CompraInfo />
    </PaginaConRail>
  );
}
