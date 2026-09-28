'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import PaginaConRail from '@/components/PaginaConRail';
import TicketPedido, { type DatosTicket } from '@/components/TicketPedido';
import { useCarrito, type ItemCarrito } from '@/lib/carrito';
import { formatCLP } from '@/lib/productos-dropi';
import { WHATSAPP_NUMERO } from '@/lib/productos';
import {
  COMUNAS, TARIFAS_COMUNA, UNIDADES_ENVIO_GRATIS,
  descuentoDe, costoEnvio, calcularTotales,
  type MetodoEntrega, type Totales,
} from '@/lib/envio';

/**
 * El pedido se cierra por WhatsApp: los productos se despachan cargándolos a
 * mano en Dropi, así que todavía no hay pasarela de pago. El SKU va en el
 * mensaje para no tener que buscarlo después.
 */
function linkPedido(
  items: ItemCarrito[],
  t: Totales,
  datos: { nombre: string; email: string; metodo: MetodoEntrega; comuna: string }
): string {
  const lineas = [
    'Hola PREPS, quiero pedir:',
    '',
    ...items.map((i) => `· ${i.cantidad} × ${i.nombre} (${i.sku})`),
    '',
    datos.nombre ? `Nombre: ${datos.nombre}` : null,
    datos.email ? `Correo: ${datos.email}` : null,
    datos.metodo === 'RETIRO' ? 'Entrega: retiro local' : `Entrega: delivery a ${datos.comuna}`,
    '',
    `Subtotal: ${formatCLP(t.subtotal)}`,
    t.descuento > 0 ? `Descuento: −${formatCLP(t.descuento)}` : null,
    `Envío: ${t.envio === 0 ? 'gratis' : formatCLP(t.envio)}`,
    `Total: ${formatCLP(t.total)}`,
  ].filter((l) => l !== null);

  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(lineas.join('\n'))}`;
}

export default function CarritoSuplementos() {
  const { items, total: subtotal, unidades, cambiarCantidad, quitar, vaciar } = useCarrito();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [metodo, setMetodo] = useState<MetodoEntrega>('RETIRO');
  const [comuna, setComuna] = useState('');
  const [codigo, setCodigo] = useState('');
  const [descuentoPct, setDescuentoPct] = useState(0);
  const [avisoPromo, setAvisoPromo] = useState<string | null>(null);

  const envio = costoEnvio(metodo, comuna, unidades);
  const totales = calcularTotales(subtotal, descuentoPct, envio);

  // Con delivery hay que saber a dónde antes de poder cerrar el pedido.
  const faltaComuna = metodo === 'DELIVERY' && !comuna;

  // Número y fecha del ticket: se arman en el cliente para que el HTML del
  // servidor no difiera del primer render.
  const [ticket, setTicket] = useState<{ numero: string; fecha: string } | null>(null);
  useEffect(() => {
    const ahora = new Date();
    setTicket({
      numero: `PRP-${ahora.getTime().toString(36).toUpperCase().slice(-8)}`,
      fecha: ahora.toLocaleDateString('es-CL', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      }),
    });
  }, []);

  const ticketRef = useRef<HTMLDivElement>(null);
  const [descargando, setDescargando] = useState(false);

  async function descargarTicket() {
    if (!ticketRef.current) return;
    setDescargando(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const lienzo = await html2canvas(ticketRef.current, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const enlace = document.createElement('a');
      enlace.download = `preps-${ticket?.numero ?? 'ticket'}.png`;
      enlace.href = lienzo.toDataURL('image/png');
      enlace.click();
    } catch (e) {
      console.error('[ticket] no se pudo exportar', e);
    } finally {
      setDescargando(false);
    }
  }

  const datosTicket: DatosTicket = {
    numero: ticket?.numero ?? '—',
    fecha: ticket?.fecha ?? '—',
    nombre, email, metodo, comuna,
  };

  function aplicarPromo() {
    const pct = descuentoDe(codigo);
    if (pct === null) {
      setDescuentoPct(0);
      setAvisoPromo('Código inválido');
    } else {
      setDescuentoPct(pct);
      setAvisoPromo(`Código aplicado: −${Math.round(pct * 100)}%`);
    }
  }

  if (items.length === 0) {
    return (
      <PaginaConRail>
        <div className="rounded-xl border border-white/15 px-5 py-12 text-center">
          <p className="text-sm text-white/45">Tu carrito está vacío.</p>
          <Link
            href="/personalizar"
            className="mt-5 inline-block rounded-full border border-white/25 px-6 py-3 text-[10px] font-bold uppercase tracking-[.2em] transition-colors hover:border-white/60"
          >
            Ver meal preps
          </Link>
          <p className="mt-6 text-[11px] text-white/35">
            ¿Buscabas suplementos? Revisa{' '}
            <Link href="/catalogo" className="underline underline-offset-4 hover:text-preps-white">
              Suplementos
            </Link>
            .
          </p>
        </div>
      </PaginaConRail>
    );
  }

  return (
    <PaginaConRail>
      <header className="mb-12">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.4em] text-white/40">
          Carrito
        </p>
        <h1 className="text-[clamp(32px,4.5vw,54px)] font-extrabold uppercase leading-[.92] tracking-[-.05em]">
          Tu pedido
        </h1>
      </header>

      {/* ── Items ───────────────────────────────────────────── */}
      <div className="space-y-3">
        {items.map((i) => (
          <div
            key={i.slug}
            className="flex items-center gap-4 rounded-xl border border-white/15 p-4 max-[520px]:gap-3"
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white/5">
              <Image src={i.imagen} alt={i.nombre} fill sizes="64px" className="object-contain p-2" />
            </div>

            <div className="min-w-0 flex-1">
              <Link
                href={`/producto/${i.slug}`}
                className="text-sm font-bold uppercase leading-tight hover:underline"
              >
                {i.nombre}
              </Link>
              <p className="mt-1 text-[11px] text-white/45">
                {formatCLP(i.precio)} c/u · {formatCLP(i.precio * i.cantidad)}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => cambiarCantidad(i.slug, i.cantidad - 1)}
                aria-label={`Quitar un ${i.nombre}`}
                className="grid h-8 w-8 place-items-center rounded-full border border-white/25 leading-none transition-colors hover:border-white/60"
              >
                −
              </button>
              <span className="w-6 text-center font-bold tabular-nums">{i.cantidad}</span>
              <button
                type="button"
                onClick={() => cambiarCantidad(i.slug, i.cantidad + 1)}
                aria-label={`Agregar un ${i.nombre}`}
                className="grid h-8 w-8 place-items-center rounded-full border border-white/25 leading-none transition-colors hover:border-white/60"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => quitar(i.slug)}
                aria-label={`Sacar ${i.nombre} del carrito`}
                className="ml-1 text-[10px] uppercase tracking-[.15em] text-white/35 transition-colors hover:text-preps-white"
              >
                Sacar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Datos ───────────────────────────────────────────── */}
      <section className="mt-10 space-y-4 rounded-xl border border-white/15 p-5">
        <h2 className="text-[10px] font-semibold uppercase tracking-[.3em] text-white/40">
          Tus datos
        </h2>

        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre completo"
          autoComplete="name"
          className="w-full rounded-lg border border-white/20 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-white/60"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo electrónico"
          autoComplete="email"
          className="w-full rounded-lg border border-white/20 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-white/60"
        />

        <label className="block">
          <span className="text-[10px] uppercase tracking-[.2em] text-white/40">Entrega</span>
          <select
            value={metodo}
            onChange={(e) => setMetodo(e.target.value as MetodoEntrega)}
            className="mt-2 w-full rounded-lg border border-white/20 bg-preps-bg px-4 py-3 text-sm outline-none focus:border-white/60"
          >
            <option value="RETIRO">Retiro local</option>
            <option value="DELIVERY">Delivery</option>
          </select>
        </label>

        {metodo === 'DELIVERY' && (
          <label className="block">
            <span className="text-[10px] uppercase tracking-[.2em] text-white/40">Comuna</span>
            <select
              value={comuna}
              onChange={(e) => setComuna(e.target.value)}
              className="mt-2 w-full rounded-lg border border-white/20 bg-preps-bg px-4 py-3 text-sm outline-none focus:border-white/60"
            >
              <option value="">Seleccionar comuna</option>
              {COMUNAS.map((c) => (
                <option key={c} value={c}>
                  {c} (+{formatCLP(TARIFAS_COMUNA[c])})
                </option>
              ))}
            </select>
          </label>
        )}

        <div>
          <span className="text-[10px] uppercase tracking-[.2em] text-white/40">
            Código de descuento
          </span>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Código"
              className="min-w-0 flex-1 rounded-lg border border-white/20 bg-transparent px-4 py-3 text-sm uppercase outline-none placeholder:text-white/30 focus:border-white/60"
            />
            <button
              type="button"
              onClick={aplicarPromo}
              disabled={!codigo.trim()}
              className="shrink-0 rounded-lg border border-white/25 px-5 text-[10px] font-bold uppercase tracking-[.2em] transition-colors hover:border-white/60 disabled:opacity-30"
            >
              Aplicar
            </button>
          </div>
          {avisoPromo && (
            <p
              className={`mt-2 text-[11px] ${descuentoPct > 0 ? 'text-preps-white' : 'text-red-400'}`}
              role="status"
            >
              {avisoPromo}
            </p>
          )}
        </div>
      </section>

      {/* ── Totales ─────────────────────────────────────────── */}
      <section className="mt-10 border-t border-white/15 pt-8">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-white/45">Subtotal</dt>
            <dd>{formatCLP(totales.subtotal)}</dd>
          </div>
          {totales.descuento > 0 && (
            <div className="flex justify-between text-preps-white">
              <dt>Descuento</dt>
              <dd>−{formatCLP(totales.descuento)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-white/45">Envío</dt>
            <dd>{totales.envio === 0 ? 'Gratis' : formatCLP(totales.envio)}</dd>
          </div>
        </dl>

        {metodo === 'DELIVERY' && unidades < UNIDADES_ENVIO_GRATIS && (
          <p className="mt-3 text-[11px] text-white/40">
            Sumá {UNIDADES_ENVIO_GRATIS - unidades}{' '}
            {UNIDADES_ENVIO_GRATIS - unidades === 1 ? 'producto' : 'productos'} más y el envío
            es gratis.
          </p>
        )}

        <div className="mt-5 flex items-end justify-between gap-4 border-t border-white/15 pt-5">
          <div>
            <div className="text-[10px] uppercase tracking-[.3em] text-white/40">Total</div>
            <div className="mt-1 text-3xl font-extrabold tracking-[-.04em]">
              {formatCLP(totales.total)}
            </div>
          </div>
          <div className="text-right text-[11px] text-white/45">
            {unidades} {unidades === 1 ? 'producto' : 'productos'}
          </div>
        </div>

        {faltaComuna ? (
          <>
            <button
              type="button"
              disabled
              className="mt-6 w-full cursor-not-allowed rounded-full border border-white/15 px-6 py-4 text-[11px] font-bold uppercase tracking-[.2em] text-white/30"
            >
              Pedir por WhatsApp
            </button>
            <p className="mt-3 text-center text-[11px] text-red-400" role="status">
              Elegí la comuna para calcular el envío
            </p>
          </>
        ) : (
          <a
            href={linkPedido(items, totales, { nombre, email, metodo, comuna })}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-preps-white px-6 py-4 text-[11px] font-bold uppercase tracking-[.2em] text-black transition-transform duration-200 hover:scale-[1.01] active:scale-[.99]"
          >
            Pedir por WhatsApp
            <span aria-hidden>→</span>
          </a>
        )}

        <div className="mt-4 flex items-center justify-between">
          <p className="text-[11px] text-white/35">Coordinás pago y envío por WhatsApp.</p>
          <button
            type="button"
            onClick={vaciar}
            className="text-[10px] uppercase tracking-[.15em] text-white/35 transition-colors hover:text-preps-white"
          >
            Vaciar carrito
          </button>
        </div>
      </section>

      {/* ── Comprobante ─────────────────────────────────────── */}
      <section className="mt-14 border-t border-white/15 pt-8">
        <h2 className="text-[10px] font-semibold uppercase tracking-[.3em] text-white/40">
          Comprobante
        </h2>
        <p className="mt-2 text-[11px] text-white/40">
          Podés descargarlo como imagen y adjuntarlo al WhatsApp.
        </p>

        <div className="mt-6 flex flex-col items-center gap-6">
          <div className="overflow-hidden rounded-xl">
            <TicketPedido
              ref={ticketRef}
              items={items}
              totales={totales}
              datos={datosTicket}
            />
          </div>

          <button
            type="button"
            onClick={descargarTicket}
            disabled={descargando || !ticket}
            className="rounded-full border border-white/25 px-7 py-3.5 text-[10px] font-bold uppercase tracking-[.2em] transition-colors hover:border-white/60 disabled:opacity-30"
          >
            {descargando ? 'Generando…' : 'Descargar comprobante'}
          </button>
        </div>
      </section>
    </PaginaConRail>
  );
}
