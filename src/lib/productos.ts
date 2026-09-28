/**
 * Meal preps PREPS.
 *
 * Solo hay dos menús —Low Carb y High Carb— y se piden por pack. El precio lo
 * fija el TAMAÑO del pack, no el menú: un pack de 5 vale lo mismo sea Low Carb
 * o High Carb. El pedido se cierra por WhatsApp.
 *
 * Los macros y gramajes vienen del catálogo original del sitio.
 */

export const WHATSAPP_NUMERO = '56941892028';

export type VarianteId = 'low_carb' | 'high_carb';

export interface Variante {
  id: VarianteId;
  slug: string;            // URL: /personalizar/<slug>
  nombre: string;          // "Low Carb"
  titulo: string;          // "Power Breast Low Carb"
  gramos: string;
  descripcion: string;
  imagen: string;
  precioUnitario: number;  // referencia suelta, del catálogo original
  macros: { kcal: number; prot: number; carb: number; fat: number };
}

export const VARIANTES: Variante[] = [
  {
    id: 'high_carb',
    slug: 'high-carb',
    nombre: 'High Carb',
    titulo: 'Power Breast High Carb',
    gramos: '200g pollo · 300g arroz · 100g brócoli',
    descripcion:
      'Pollo a la plancha con arroz blanco y brócoli cocido al dente. Carga completa de carbohidratos para entrenar fuerte o ganar volumen.',
    imagen: '/img/menu1.webp',
    precioUnitario: 5690,
    macros: { kcal: 830, prot: 73, carb: 90, fat: 19 },
  },
  {
    id: 'low_carb',
    slug: 'low-carb',
    nombre: 'Low Carb',
    titulo: 'Power Breast Low Carb',
    gramos: '200g pollo · 150g arroz · 100g brócoli',
    descripcion:
      'Pollo a la plancha con arroz blanco y brócoli cocido al dente. Arroz reducido, para días livianos o definición.',
    imagen: '/img/menu2.webp',
    precioUnitario: 4990,
    macros: { kcal: 632, prot: 69, carb: 49, fat: 17 },
  },
];

export function getVariante(slug: string): Variante | undefined {
  return VARIANTES.find((v) => v.slug === slug);
}

export interface Pack {
  unidades: number;
  precio: number;
  etiqueta: string;
  titulo: string;   // como figuraba en el catálogo original
  imagen: string;
}

/** El mínimo para pedir es el pack más chico. */
export const PACKS: Pack[] = [
  { unidades: 5,  precio: 24900,  etiqueta: 'Pack 5',  titulo: '05 Packs Performance', imagen: '/img/pack5.webp'  },
  { unidades: 15, precio: 72900,  etiqueta: 'Pack 15', titulo: '15 Packs Performance', imagen: '/img/pack15.webp' },
  { unidades: 28, precio: 129900, etiqueta: 'Pack 28', titulo: '28 Packs Performance', imagen: '/img/pack28.webp' },
];

export const PACK_MINIMO = PACKS[0].unidades;

export function formatCLP(monto: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(monto);
}

/** Precio por menú dentro de un pack, solo como referencia. */
export function precioPorUnidad(pack: Pack): number {
  return Math.round(pack.precio / pack.unidades);
}

/**
 * Mensaje del pedido. Va como texto plano: es lo que la persona ve antes de
 * enviarlo, así que tiene que leerse solo.
 */
export function mensajePedido(
  variante: Variante,
  pack: Pack,
  conPimienta: boolean
): string {
  return [
    `Hola PREPS, quiero pedir un ${pack.etiqueta}:`,
    '',
    `· ${pack.unidades} × ${variante.titulo}`,
    `· ${conPimienta ? 'Con' : 'Sin'} pimienta`,
    '',
    `Subtotal de comidas: ${formatCLP(pack.precio)}`,
    'Despacho no incluido en este subtotal: por confirmar.',
    'Plan semanal: 5 packs de cualquier tamaño. Despacho los lunes por la mañana, sujeto a confirmación de cupo y fecha.',
    '',
    'Mi comuna de entrega es: [indicar comuna]',
    'Me gustaría recibir el pedido el lunes: [indicar fecha]',
    '¿Me confirman disponibilidad, costo de despacho y total antes de pagar?',
  ].join('\n');
}

export function linkPedido(
  variante: Variante,
  pack: Pack,
  conPimienta: boolean
): string {
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(
    mensajePedido(variante, pack, conPimienta)
  )}`;
}
