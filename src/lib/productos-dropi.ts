/**
 * Catálogo de dropshipping (Dropi).
 *
 * Separado de los meal preps a propósito: los preps se piden por pack vía
 * WhatsApp desde el Custom Lab, y estos productos van por carrito.
 *
 * Por ahora la fuente es este archivo. Cuando conectemos la API de Dropi,
 * solo cambia de dónde sale `PRODUCTOS`; el resto de las páginas no se toca.
 *
 * PARA CARGAR TUS PRODUCTOS:
 *   1. Borrá los que tienen `ejemplo: true`.
 *   2. Agregá los tuyos con la misma forma.
 *   3. Poné las imágenes en `public/img/dropi/` y referencialas.
 *   4. `sku` es el identificador del producto en Dropi, para que al recibir
 *      un pedido sepas cuál cargar allá.
 */

export interface ProductoDropi {
  slug: string;          // URL: /producto/<slug>
  nombre: string;
  descripcion: string;
  precio: number;        // CLP, lo que paga el cliente
  precioAntes?: number;  // para mostrar tachado
  imagen: string;
  categoria: string;
  sku: string;           // id del producto en Dropi
  stock: number | null;  // null = sin control de stock
  ejemplo?: boolean;     // marca de placeholder, borrar al cargar los reales
}

/**
 * Vacío a propósito: mientras no haya productos, la página muestra
 * "Próximamente". En cuanto agregues uno acá, aparece la grilla sola y las
 * fichas de producto se generan con él.
 *
 * Ejemplo de la forma que espera:
 *
 *   {
 *     slug: 'shaker-600',
 *     nombre: 'Shaker 600ml',
 *     descripcion: 'Shaker con mezclador de acero.',
 *     precio: 9990,
 *     precioAntes: 12990,       // opcional, se muestra tachado
 *     imagen: '/img/dropi/shaker.png',
 *     categoria: 'Accesorios',
 *     sku: 'DROPI-1234',        // id del producto en Dropi
 *     stock: 25,                // o null si no controlás stock
 *   }
 */
export const PRODUCTOS: ProductoDropi[] = [];

export function getProducto(slug: string): ProductoDropi | undefined {
  return PRODUCTOS.find((p) => p.slug === slug);
}

export function hayEjemplos(): boolean {
  return PRODUCTOS.some((p) => p.ejemplo);
}

export function formatCLP(monto: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(monto);
}
