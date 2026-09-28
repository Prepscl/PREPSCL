'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ProductoDropi } from './productos-dropi';

/**
 * Carrito de los productos de dropshipping.
 *
 * Clave nueva a propósito: el sitio estático guardaba en `preps_cart` una
 * lista con un elemento por unidad. Cambiar de forma sobre esa misma clave
 * rompería el carrito de cualquiera que tenga datos viejos, así que se usa
 * otra y la anterior simplemente se ignora.
 *
 * Los meal preps NO pasan por acá: se piden por pack desde el Custom Lab.
 */
export const CARRITO_KEY = 'preps_carrito_v2';

/** `storage` solo se dispara en otras pestañas; esto cubre la actual. */
const EVENTO_CAMBIO = 'preps:carrito';

export interface ItemCarrito {
  slug: string;
  nombre: string;
  precio: number;
  imagen: string;
  sku: string;
  cantidad: number;
}

export function leerCarrito(): ItemCarrito[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem(CARRITO_KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (i): i is ItemCarrito =>
        i && typeof i.slug === 'string' && typeof i.precio === 'number' && i.cantidad > 0
    );
  } catch {
    return [];
  }
}

function guardar(items: ItemCarrito[]) {
  try {
    localStorage.setItem(CARRITO_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(EVENTO_CAMBIO));
  } catch {
    // Modo privado o storage lleno: el carrito no persiste, pero la página sigue viva.
  }
}

export function totalCarrito(items: ItemCarrito[]): number {
  return items.reduce((s, i) => s + i.precio * i.cantidad, 0);
}

export function unidadesCarrito(items: ItemCarrito[]): number {
  return items.reduce((s, i) => s + i.cantidad, 0);
}

/** Se suscribe a los cambios del carrito, propios y de otras pestañas. */
function useSuscripcion(onChange: () => void) {
  useEffect(() => {
    onChange();
    window.addEventListener('storage', onChange);
    window.addEventListener(EVENTO_CAMBIO, onChange);
    return () => {
      window.removeEventListener('storage', onChange);
      window.removeEventListener(EVENTO_CAMBIO, onChange);
    };
  }, [onChange]);
}

export function useCarrito() {
  // Arranca vacío para que el HTML del servidor y el del cliente coincidan.
  const [items, setItems] = useState<ItemCarrito[]>([]);

  const sync = useCallback(() => setItems(leerCarrito()), []);
  useSuscripcion(sync);

  const agregar = useCallback((producto: ProductoDropi, cantidad = 1) => {
    const actuales = leerCarrito();
    const existente = actuales.find((i) => i.slug === producto.slug);

    let siguientes: ItemCarrito[];
    if (existente) {
      siguientes = actuales.map((i) =>
        i.slug === producto.slug ? { ...i, cantidad: i.cantidad + cantidad } : i
      );
    } else {
      siguientes = [
        ...actuales,
        {
          slug: producto.slug,
          nombre: producto.nombre,
          precio: producto.precio,
          imagen: producto.imagen,
          sku: producto.sku,
          cantidad,
        },
      ];
    }
    guardar(siguientes);
    setItems(siguientes);
  }, []);

  const cambiarCantidad = useCallback((slug: string, cantidad: number) => {
    const siguientes = leerCarrito()
      .map((i) => (i.slug === slug ? { ...i, cantidad } : i))
      .filter((i) => i.cantidad > 0);
    guardar(siguientes);
    setItems(siguientes);
  }, []);

  const quitar = useCallback((slug: string) => {
    const siguientes = leerCarrito().filter((i) => i.slug !== slug);
    guardar(siguientes);
    setItems(siguientes);
  }, []);

  const vaciar = useCallback(() => {
    guardar([]);
    setItems([]);
  }, []);

  return {
    items,
    total: totalCarrito(items),
    unidades: unidadesCarrito(items),
    agregar,
    cambiarCantidad,
    quitar,
    vaciar,
  };
}

/** Solo el número, para el badge del rail. */
export function useCarritoCount(): number {
  const [count, setCount] = useState(0);
  const sync = useCallback(() => setCount(unidadesCarrito(leerCarrito())), []);
  useSuscripcion(sync);
  return count;
}
