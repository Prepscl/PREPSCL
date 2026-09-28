'use client';

import { forwardRef } from 'react';
import type { ItemCarrito } from '@/lib/carrito';
import { formatCLP } from '@/lib/productos-dropi';
import type { Totales, MetodoEntrega } from '@/lib/envio';

export interface DatosTicket {
  numero: string;
  fecha: string;
  nombre: string;
  email: string;
  metodo: MetodoEntrega;
  comuna: string;
}

/**
 * Comprobante del pedido, pensado para exportarse como imagen.
 *
 * Va con colores y tamaños fijos en vez de tokens del tema: html2canvas
 * rasteriza lo que ve, así que el ticket tiene que verse igual sin importar
 * dónde esté montado.
 */
const TicketPedido = forwardRef<
  HTMLDivElement,
  { items: ItemCarrito[]; totales: Totales; datos: DatosTicket }
>(function TicketPedido({ items, totales, datos }, ref) {
  return (
    <div
      ref={ref}
      style={{
        width: 380,
        background: '#ffffff',
        color: '#000000',
        padding: 28,
        fontFamily: 'Inter, Arial, sans-serif',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 14 }}>
        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -1 }}>PREPS</div>
        <div style={{ fontSize: 9, letterSpacing: 2, marginTop: 4, opacity: 0.6 }}>
          COMPROBANTE DE PEDIDO
        </div>
      </div>

      <div style={{ fontSize: 10, lineHeight: 1.9, marginTop: 14 }}>
        <Fila k="TICKET" v={datos.numero} />
        <Fila k="FECHA" v={datos.fecha} />
        {datos.nombre && <Fila k="NOMBRE" v={datos.nombre} />}
        {datos.email && <Fila k="CORREO" v={datos.email} />}
        <Fila
          k="ENTREGA"
          v={datos.metodo === 'RETIRO' ? 'RETIRO LOCAL' : `DELIVERY · ${datos.comuna}`}
        />
      </div>

      <div style={{ borderTop: '1px dashed #999', margin: '14px 0' }} />

      <div style={{ fontSize: 10, lineHeight: 1.9 }}>
        {items.map((i) => (
          <div
            key={i.slug}
            style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}
          >
            <span style={{ flex: 1 }}>
              {i.cantidad} × {i.nombre.toUpperCase()}
            </span>
            <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
              {formatCLP(i.precio * i.cantidad)}
            </span>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px dashed #999', margin: '14px 0' }} />

      <div style={{ fontSize: 10, lineHeight: 2 }}>
        <Fila k="SUBTOTAL" v={formatCLP(totales.subtotal)} />
        {totales.descuento > 0 && (
          <Fila k="DESCUENTO" v={`−${formatCLP(totales.descuento)}`} color="#0a7d3f" />
        )}
        <Fila k="ENVÍO" v={totales.envio === 0 ? 'GRATIS' : formatCLP(totales.envio)} />
      </div>

      <div
        style={{
          borderTop: '2px solid #000',
          marginTop: 12,
          paddingTop: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1 }}>TOTAL</span>
        <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: -1 }}>
          {formatCLP(totales.total)}
        </span>
      </div>

      <div
        style={{
          fontSize: 8,
          letterSpacing: 1.5,
          textAlign: 'center',
          marginTop: 18,
          opacity: 0.55,
          lineHeight: 1.8,
        }}
      >
        PREPS.CL · SANTIAGO, CHILE
        <br />
        DISEÑADO PARA TU RENDIMIENTO
      </div>
    </div>
  );
});

function Fila({ k, v, color }: { k: string; v: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, color }}>
      <span style={{ opacity: 0.55, letterSpacing: 1 }}>{k}</span>
      <span style={{ fontWeight: 700, textAlign: 'right' }}>{v}</span>
    </div>
  );
}

export default TicketPedido;
