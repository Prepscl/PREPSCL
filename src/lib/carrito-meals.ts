'use client';
import { useEffect, useState } from 'react';
import { PACKS, VARIANTES } from './productos';
import {
  CANTIDAD_MAXIMA, CANTIDAD_MINIMA, GRAMOS_MAX, GRAMOS_PASO, SAL_MAX,
  alcanzaMinimoPlato, limpiarEtiqueta, precioUnitario, type Preparacion, type Receta,
} from './lab';

const KEY = 'preps_meals_v1';
const EVENT = 'preps:meals';

/* En el carrito conviven dos cosas distintas: los packs de los menús, que se
   cuentan por packs y tienen tope de 5, y los platos del configurador, que se
   cuentan por unidades y tienen su propio mínimo. Por eso cada ítem dice de
   qué clase es. Lo guardado antes de que existiera el configurador no lleva
   esa marca: se asume pack, que es lo que era. */

export interface ItemPack {
  clase: 'pack';
  id: string;
  variante: string;
  unidades: number;
  pimienta: boolean;
  cantidad: number;
}

export interface ItemLab {
  clase: 'lab';
  id: string;
  pollo: number;
  arroz: number;
  brocoli: number;
  prep: Preparacion;
  sal: number;
  pimienta: boolean;
  /** Texto y color de la etiqueta impresa; vacío si no puso ninguna. */
  etiqueta: string;
  color: string;
  cantidad: number;
}

export type MealItem = ItemPack | ItemLab;

export const MAX_PACKS = 5;

export { limpiarEtiqueta };

export function esLab(item: MealItem): item is ItemLab {
  return item.clase === 'lab';
}

/** Lo que vale una línea. El servidor lo vuelve a calcular igual. */
export function precioLinea(item: MealItem): number {
  if (esLab(item)) return precioUnitario(recetaDe(item)) * item.cantidad;
  return (PACKS.find(p => p.unidades === item.unidades)?.precio ?? 0) * item.cantidad;
}

export function recetaDe(item: ItemLab): Receta {
  return { pollo: item.pollo, arroz: item.arroz, brocoli: item.brocoli, prep: item.prep };
}

/** Comidas de una línea: un pack trae varias; un plato del lab es una. */
export function comidasLinea(item: MealItem): number {
  return esLab(item) ? item.cantidad : item.cantidad * item.unidades;
}

function gramosValidos(g: unknown): g is number {
  return Number.isSafeInteger(g) && (g as number) >= 0 && (g as number) <= GRAMOS_MAX
    && (g as number) % GRAMOS_PASO === 0;
}

function idLab(i: Omit<ItemLab, 'id' | 'clase' | 'cantidad'>): string {
  return `lab-${i.pollo}-${i.arroz}-${i.brocoli}-${i.prep}-${i.sal}-${i.pimienta}-${i.etiqueta}-${i.color}`;
}


function colorValido(c: unknown): string {
  return typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c) ? c : '#ffffff';
}

export function normalizarMeals(raw: unknown): MealItem[] {
  if (!Array.isArray(raw)) return [];
  const result: MealItem[] = [];
  let packsDisponibles = MAX_PACKS;

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const clase = (item as { clase?: unknown }).clase === 'lab' ? 'lab' : 'pack';

    if (clase === 'lab') {
      const l = item as Partial<ItemLab>;
      if (!gramosValidos(l.pollo) || !gramosValidos(l.arroz) || !gramosValidos(l.brocoli)) continue;
      if (l.prep !== 'PLANCHA' && l.prep !== 'COCIDO') continue;
      if (!Number.isSafeInteger(l.sal) || l.sal! < 0 || l.sal! > SAL_MAX) continue;
      if (typeof l.pimienta !== 'boolean') continue;
      if (!Number.isSafeInteger(l.cantidad) || l.cantidad! < CANTIDAD_MINIMA) continue;
      const receta: Receta = { pollo: l.pollo!, arroz: l.arroz!, brocoli: l.brocoli!, prep: l.prep };
      // El plato tiene que valer lo mínimo para prepararlo, igual que en el
      // configurador: si no, no habría podido agregarse.
      if (!alcanzaMinimoPlato(receta)) continue;

      const base = {
        pollo: l.pollo!, arroz: l.arroz!, brocoli: l.brocoli!, prep: l.prep,
        sal: l.sal!, pimienta: l.pimienta,
        etiqueta: limpiarEtiqueta(l.etiqueta), color: colorValido(l.color),
      };
      const id = idLab(base);
      const existente = result.find(i => i.id === id) as ItemLab | undefined;
      const cantidad = Math.min(l.cantidad!, CANTIDAD_MAXIMA);
      if (existente) existente.cantidad = Math.min(existente.cantidad + cantidad, CANTIDAD_MAXIMA);
      else result.push({ clase: 'lab', id, ...base, cantidad });
      continue;
    }

    const p = item as Partial<ItemPack>;
    if (!VARIANTES.some(v => v.slug === p.variante) || !PACKS.some(x => x.unidades === p.unidades)
      || typeof p.pimienta !== 'boolean' || !Number.isSafeInteger(p.cantidad) || p.cantidad! < 1) continue;
    const cantidad = Math.min(p.cantidad!, packsDisponibles);
    if (!cantidad) continue;
    const id = `${p.variante}-${p.unidades}-${p.pimienta}`;
    const existente = result.find(i => i.id === id) as ItemPack | undefined;
    if (existente) existente.cantidad += cantidad;
    else result.push({ clase: 'pack', id, variante: p.variante!, unidades: p.unidades!, pimienta: p.pimienta, cantidad });
    packsDisponibles -= cantidad;
  }
  return result;
}

function leer(): MealItem[] {
  try { return normalizarMeals(JSON.parse(localStorage.getItem(KEY) || '[]')); }
  catch { return []; }
}

export function useMealCart() {
  const [items, setItems] = useState<MealItem[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const sync = () => { setItems(leer()); setReady(true); };
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener(EVENT, sync);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener(EVENT, sync); };
  }, []);

  function guardar(next: MealItem[]) {
    try {
      localStorage.setItem(KEY, JSON.stringify(normalizarMeals(next)));
      window.dispatchEvent(new Event(EVENT)); setError(''); return true;
    } catch { setError('No pudimos guardar tu selección. Permite el almacenamiento del navegador e inténtalo de nuevo.'); return false; }
  }

  function agregar(variante: string, unidades: number, pimienta: boolean) {
    const actual = leer();
    const packs = actual.filter(i => !esLab(i)).reduce((s, i) => s + i.cantidad, 0);
    if (packs >= MAX_PACKS) {
      setError(`Puedes seleccionar hasta ${MAX_PACKS} packs. La disponibilidad semanal se confirma por separado.`); return false;
    }
    return guardar([...actual, { clase: 'pack', id: '', variante, unidades, pimienta, cantidad: 1 }]);
  }

  /** Un plato del configurador. Ya viene validado por la página del lab. */
  function agregarLab(datos: Omit<ItemLab, 'id' | 'clase'>) {
    const actual = leer();
    const id = idLab(datos);
    const existente = actual.find(i => i.id === id) as ItemLab | undefined;
    if (existente && existente.cantidad >= CANTIDAD_MAXIMA) {
      setError(`Puedes llevar hasta ${CANTIDAD_MAXIMA} unidades del mismo plato.`); return false;
    }
    return guardar([...actual, { clase: 'lab', id, ...datos }]);
  }

  function cantidad(id: string, valor: number) {
    if (!Number.isSafeInteger(valor) || valor < 0) return;
    const actual = leer();
    const item = actual.find(i => i.id === id);
    if (!item) return;

    if (esLab(item)) {
      // Bajar del mínimo es quitar la línea: media línea no se puede pedir.
      if (valor > CANTIDAD_MAXIMA) return;
      if (valor > 0 && valor < CANTIDAD_MINIMA) {
        guardar(actual.filter(i => i.id !== id));
        return;
      }
    } else if (actual.filter(i => i.id !== id && !esLab(i)).reduce((s, i) => s + i.cantidad, 0) + valor > MAX_PACKS) {
      return;
    }

    guardar(actual.map(i => i.id === id ? { ...i, cantidad: valor } : i).filter(i => i.cantidad > 0));
  }

  return {
    items, ready, error, agregar, agregarLab, cantidad,
    quitar: (id: string) => guardar(leer().filter(i => i.id !== id)),
    /** Después de confirmar el pedido: lo que se pidió ya no es un carrito. */
    vaciar: () => guardar([]),
  };
}
