/**
 * Envío y promociones, con los mismos valores del carrito original.
 */

export type MetodoEntrega = 'RETIRO' | 'DELIVERY';

/** Tarifa por comuna, tal cual el `shippingRates` del HTML viejo. */
export const TARIFAS_COMUNA: Record<string, number> = {
  PROVIDENCIA: 2500,
  'ÑUÑOA': 3000,
  'LA REINA': 3500,
  'LAS CONDES': 4000,
  VITACURA: 4000,
  'LO BARNECHEA': 5000,
};

export const COMUNAS = Object.keys(TARIFAS_COMUNA);

/** Códigos de descuento del sitio original. */
const PROMOS: Record<string, number> = {
  MILA10: 0.1,
  BASSS10: 0.1,
};

/** Descuento del código, o null si no existe. */
export function descuentoDe(codigo: string): number | null {
  return PROMOS[codigo.trim().toUpperCase()] ?? null;
}

/**
 * El sitio original daba envío gratis desde 5 menús. Como los menús ya no pasan
 * por este carrito, el umbral se cuenta ahora sobre las unidades del pedido.
 */
export const UNIDADES_ENVIO_GRATIS = 5;

export function costoEnvio(
  metodo: MetodoEntrega,
  comuna: string,
  unidades = 0
): number {
  if (metodo === 'RETIRO') return 0;
  if (unidades >= UNIDADES_ENVIO_GRATIS) return 0;
  return TARIFAS_COMUNA[comuna] ?? 0;
}

export interface Totales {
  subtotal: number;
  descuento: number;
  envio: number;
  total: number;
}

export function calcularTotales(
  subtotal: number,
  descuentoPct: number,
  envio: number
): Totales {
  const descuento = Math.round(subtotal * descuentoPct);
  return {
    subtotal,
    descuento,
    envio,
    total: subtotal - descuento + envio,
  };
}
