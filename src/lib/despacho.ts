/* ────────────────────────────────────────────────────────────────
   Tarifas de despacho — COPIA para mostrar en el checkout.

   Quien cobra es el panel (PREPS/lib/despacho.ts): recalcula el
   despacho desde la comuna e ignora el monto que mande el sitio. Si
   cambia una tarifa hay que cambiar las dos; si solo se cambia esta,
   el cliente ve un precio y se le cobra otro.

   Son las tarifas que estaban publicadas en el carrito anterior.
   Fuera de estas comunas no se cobra despacho en línea: se coordina
   aparte y el pedido queda marcado en el panel.
   ──────────────────────────────────────────────────────────────── */

export const COMUNAS_CUBIERTAS = [
  { comuna: 'Providencia',  costo: 2500 },
  { comuna: 'Ñuñoa',        costo: 3000 },
  { comuna: 'La Reina',     costo: 3500 },
  { comuna: 'Las Condes',   costo: 4000 },
  { comuna: 'Vitacura',     costo: 4000 },
  { comuna: 'Lo Barnechea', costo: 5000 },
] as const;

/** Valor que usa el formulario para "mi comuna no está en la lista". */
export const OTRA_COMUNA = '__otra__';

export interface Despacho {
  costo: number;
  cubierta: boolean;
}

/** Para comparar comunas escritas de distinta forma: "Ñuñoa", "nunoa", "ÑUÑOA". */
export function normalizarComuna(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/** La comuna cubierta con ese nombre, tal como está escrita en la tabla. */
export function comunaCubierta(nombre: string) {
  const n = normalizarComuna(nombre);
  return COMUNAS_CUBIERTAS.find((c) => normalizarComuna(c.comuna) === n);
}

export function calcularDespacho(comuna: string): Despacho {
  const hit = COMUNAS_CUBIERTAS.find((c) => c.comuna === comuna);
  return hit ? { costo: hit.costo, cubierta: true } : { costo: 0, cubierta: false };
}
