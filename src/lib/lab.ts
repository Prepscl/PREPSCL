/**
 * Custom Lab — configurador por gramos.
 *
 * Precios, macros y el mapa de fotos vienen tal cual del `personalizar.html`
 * original, para que el plato configurado cueste y se vea igual que antes.
 */

export type Preparacion = 'PLANCHA' | 'COCIDO';

/** Precio por gramo, más un base fijo. */
export const PRECIOS = { pollo: 22.47, arroz: 2.08, brocoli: 5.69, base: 3 } as const;

/**
 * Dos condiciones para poder pedir, y son distintas:
 *  · el plato configurado tiene que valer al menos $4.000 (si no, no da para
 *    prepararlo), y
 *  · hay que llevar al menos 5 unidades, igual que los packs de los menús.
 */
export const MINIMO_PLATO = 4000;
export const CANTIDAD_MINIMA = 5;
export const CANTIDAD_MAXIMA = 30;

/** Piso real de un pedido, para anunciar el "desde". */
export const MINIMO_PEDIDO = MINIMO_PLATO * CANTIDAD_MINIMA;

export const GRAMOS_MAX = 800;
export const GRAMOS_PASO = 50;
export const SAL_MAX = 5;

/** Macros por gramo. */
const MACROS_POLLO: Record<Preparacion, { p: number; c: number; f: number; k: number }> = {
  PLANCHA: { p: 0.315, c: 0, f: 0.075, k: 1.95 },
  COCIDO:  { p: 0.23,  c: 0, f: 0.02,  k: 1.1  },
};
const MACROS_ARROZ   = { p: 0.03, c: 0.28, f: 0.01, k: 1.32 };
const MACROS_BROCOLI = { p: 0.01, c: 0.06, f: 0.01, k: 0.44 };

export interface Receta {
  pollo: number;
  arroz: number;
  brocoli: number;
  prep: Preparacion;
}

export function precioUnitario(r: Receta): number {
  return Math.round(
    r.pollo * PRECIOS.pollo + r.arroz * PRECIOS.arroz + r.brocoli * PRECIOS.brocoli + PRECIOS.base
  );
}

export function alcanzaMinimoPlato(r: Receta): boolean {
  return precioUnitario(r) >= MINIMO_PLATO;
}

/** Motivo por el que todavía no se puede pedir, o null si ya se puede. */
export function motivoBloqueo(r: Receta, cantidad: number): string | null {
  if (!alcanzaMinimoPlato(r)) {
    return `Mínimo ${formatCLP(MINIMO_PLATO)} c/u`;
  }
  if (cantidad < CANTIDAD_MINIMA) {
    return `Mínimo ${CANTIDAD_MINIMA} unidades por pedido`;
  }
  return null;
}

/** La etiqueta la escribe la persona: se limita y se limpia. */
export function limpiarEtiqueta(texto: unknown): string {
  return typeof texto === 'string' ? texto.replace(/[^A-Za-zÀ-ÿ0-9 .,'-]/g, '').trim().slice(0, 24) : '';
}

export interface Macros { prot: number; carb: number; fat: number; kcal: number }

export function calcularMacros(r: Receta): Macros {
  const mp = MACROS_POLLO[r.prep];
  return {
    prot: Math.round(r.pollo * mp.p + r.arroz * MACROS_ARROZ.p + r.brocoli * MACROS_BROCOLI.p),
    carb: Math.round(r.pollo * mp.c + r.arroz * MACROS_ARROZ.c + r.brocoli * MACROS_BROCOLI.c),
    fat:  Math.round(r.pollo * mp.f + r.arroz * MACROS_ARROZ.f + r.brocoli * MACROS_BROCOLI.f),
    kcal: Math.round(r.pollo * mp.k + r.arroz * MACROS_ARROZ.k + r.brocoli * MACROS_BROCOLI.k),
  };
}

/** Nombre del protocolo según el perfil de la receta. */
export function nombreProtocolo(r: Receta): string {
  const total = r.pollo + r.arroz + r.brocoli;
  if (total >= 750) return 'Sobrecarga';
  if (r.pollo >= 400 && r.arroz <= 100) return 'Keto Elite';
  if (total <= 350) return 'Base ligera';
  return 'Personalizada';
}

/** Identificador de la combinación, como el "ID: #0000" del original. */
export function idCombinacion(r: Receta): number {
  return (
    (r.pollo / GRAMOS_PASO) * 100 +
    (r.arroz / GRAMOS_PASO) * 10 +
    r.brocoli / GRAMOS_PASO +
    (r.prep === 'PLANCHA' ? 500 : 0)
  );
}

/** Fotos que existen en public/img. El original podía apuntar a una que falta. */
const FOTOS_EXISTENTES = new Set([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
  26, 27, 31, 32, 33, 35, 36, 37,
]);

function tramo(g: number): 'N' | 'P' | 'M' {
  if (g === 0) return 'N';
  return g < 400 ? 'P' : 'M';
}

/** Mapa de receta → foto, copiado del original. */
function idFotoCrudo({ pollo, arroz, brocoli, prep }: Receta): number {
  const sp = tramo(pollo);
  const sa = tramo(arroz);
  const sb = tramo(brocoli);
  const combo = `${sa}${sb}`;

  if (sp === 'N') {
    const mapa: Record<string, number> = {
      NN: 1, NP: 2, NM: 3, PN: 4, PP: 5, PM: 6, MN: 7, MP: 8, MM: 9,
    };
    return mapa[combo] ?? 1;
  }

  if (prep === 'COCIDO') {
    const mapa: Record<string, number> =
      sp === 'P'
        ? { NN: 10, NP: 11, NM: 12, PN: 13, PP: 14, PM: 15, MN: 16, MP: 17 }
        : { NN: 18, NP: 19, PN: 20, PP: 21, NM: 22, MN: 23 };
    return mapa[combo] ?? 1;
  }

  const mapa: Record<string, number> =
    sp === 'P'
      ? { NN: 24, NP: 26, NM: 26, PN: 27, PP: 31, PM: 29, MN: 27, MP: 31 }
      : { NN: 32, NP: 33, PN: 37, PP: 35, NM: 36, MN: 37 };
  return mapa[combo] ?? 1;
}

export function fotoReceta(r: Receta): string {
  const id = idFotoCrudo(r);
  // El mapa original apunta a la 29, que no está entre los archivos. Antes eso
  // dejaba la imagen rota; acá cae a la más parecida de esa misma rama.
  const seguro = FOTOS_EXISTENTES.has(id) ? id : 31;
  return `/img/${seguro}.webp`;
}

export function formatCLP(monto: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(monto);
}
