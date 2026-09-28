import { WHATSAPP_NUMERO, formatCLP } from './productos';
import type { DatosPago } from './pago';

/* ────────────────────────────────────────────────────────────────
   Correo de "recibimos tu pedido", por Resend.

   Se manda desde el servidor, después de que el panel confirma el
   pedido: así nadie recibe un correo de algo que no quedó anotado.

   Si falla, el pedido igual vale. Un correo que no salió no puede
   borrar una venta, así que acá nada tira error: se anota en el
   registro del servidor y sigue.

   Lo que la persona recibe es el respaldo escrito de lo que pidió.
   El cupo y el pago se cierran por WhatsApp, y el correo lo dice para
   que nadie quede esperando que esto sea la confirmación final.
   ──────────────────────────────────────────────────────────────── */

const API = 'https://api.resend.com/emails';
const REMITENTE_POR_DEFECTO = 'PREPS <pedidos@preps.cl>';

export interface LineaPedido { nombre: string; cantidad: number; precio: number }

export interface PedidoParaCorreo {
  numero: string;
  nombre: string;
  correo: string;
  lineas: LineaPedido[];
  subtotal: number;
  despacho: number;
  total: number;
  despachoACoordinar: boolean;
  comuna: string;
  direccion: string;
  /** Solo cuando el total está cerrado; si no, se paga después de coordinar. */
  pago: DatosPago | null;
}

/** Para no cerrar etiquetas ajenas con el nombre o la dirección de alguien. */
function escapar(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
}

function textoPlano(p: PedidoParaCorreo): string {
  const lineas = p.lineas.map((l) => `- ${l.cantidad} × ${l.nombre}: ${formatCLP(l.precio * l.cantidad)}`);
  return [
    p.despachoACoordinar
      ? `Hola ${p.nombre}, anotamos tu pedido ${p.numero}. Todavía no repartimos en ${p.comuna}, así que el despacho lo coordinamos por WhatsApp.`
      : `Hola ${p.nombre}, recibimos tu pedido ${p.numero}.`,
    '',
    ...lineas,
    '',
    `Comidas: ${formatCLP(p.subtotal)}`,
    `Despacho: ${p.despachoACoordinar ? 'a coordinar' : formatCLP(p.despacho)}`,
    `Total: ${formatCLP(p.total)}${p.despachoACoordinar ? ' + despacho' : ''}`,
    '',
    `Entrega: ${p.direccion}, ${p.comuna}. Los lunes por la mañana.`,
    '',
    ...(p.pago ? [
      'Para pagar, transfiere el total a:',
      `${p.pago.titular} · ${p.pago.rut}`,
      `${p.pago.banco} · ${p.pago.tipo} · ${p.pago.numero}`,
      p.pago.correo,
      `Pon ${p.numero} en el mensaje de la transferencia y mándanos el comprobante por WhatsApp.`,
      '',
    ] : []),
    'Te escribimos por WhatsApp para confirmar tu cupo de la semana y coordinar el pago.',
    `Si prefieres escribir tú: https://wa.me/${WHATSAPP_NUMERO}`,
    '',
    'PREPS · Diseñado para tu rendimiento',
  ].join('\n');
}

/* Fondo claro y tablas: el correo se lee en Gmail, Outlook y el mail del
   teléfono, donde el modo oscuro y las columnas modernas se deforman. La
   marca queda en el encabezado negro, las mayúsculas y la tipografía
   monoespaciada de las cifras, que es como se ven los precios en el sitio. */
export function plantilla(p: PedidoParaCorreo): string {
  const fila = (izq: string, der: string, destacado = false) => `
    <tr>
      <td style="padding:${destacado ? '14px 0 0' : '6px 0'};font-size:${destacado ? '13px' : '13px'};color:${destacado ? '#111' : '#555'};${destacado ? 'font-weight:700;text-transform:uppercase;letter-spacing:1.5px;border-top:1px solid #e5e5e5;' : ''}">${izq}</td>
      <td align="right" style="padding:${destacado ? '14px 0 0' : '6px 0'};font-family:'Courier New',Courier,monospace;font-size:${destacado ? '20px' : '13px'};color:#111;${destacado ? 'border-top:1px solid #e5e5e5;' : ''}">${der}</td>
    </tr>`;

  const productos = p.lineas.map((l) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:13px;color:#111;">
        <strong style="text-transform:uppercase;letter-spacing:.5px;">${escapar(l.nombre)}</strong>
        <span style="display:block;color:#777;font-size:12px;margin-top:2px;">${l.cantidad} ${l.cantidad === 1 ? 'pack' : 'packs'}</span>
      </td>
      <td align="right" style="padding:10px 0;border-bottom:1px solid #eee;font-family:'Courier New',Courier,monospace;font-size:13px;color:#111;">${formatCLP(l.precio * l.cantidad)}</td>
    </tr>`).join('');

  return `<!doctype html>
<html lang="es"><body style="margin:0;padding:24px 12px;background:#f2f2f2;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;">
    <tr><td style="background:#030303;padding:22px 28px;">
      <span style="color:#f6f6f2;font-size:22px;font-weight:bold;letter-spacing:-1px;">PREPS</span>
    </td></tr>
    <tr><td style="padding:28px;">
      <p style="margin:0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#777;">${p.despachoACoordinar ? 'Pedido por coordinar' : 'Pedido recibido'}</p>
      <p style="margin:10px 0 0;font-size:26px;font-weight:bold;color:#111;letter-spacing:-.5px;">${escapar(p.numero)}</p>
      <p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:#444;">
        Hola ${escapar(p.nombre)}: ${p.despachoACoordinar
          ? `anotamos tu pedido, pero todavía no repartimos en ${escapar(p.comuna)}. Escríbenos por WhatsApp y vemos cómo hacértelo llegar y cuánto sale el despacho.`
          : 'anotamos tu pedido. Te escribimos por WhatsApp para confirmar tu cupo de la semana y coordinar el pago.'}
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:26px;">${productos}</table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
        ${fila('Comidas', formatCLP(p.subtotal))}
        ${fila('Despacho', p.despachoACoordinar ? 'A coordinar' : formatCLP(p.despacho))}
        ${fila('Total', formatCLP(p.total), true)}
      </table>
      ${p.despachoACoordinar ? `<p style="margin:10px 0 0;font-size:12px;color:#777;">Tu comuna está fuera de la zona de reparto: el despacho lo acordamos por WhatsApp y se suma a ese total.</p>` : ''}

      ${p.pago ? `
      <p style="margin:26px 0 0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#777;">Cómo pagar</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;border:1px solid #e5e5e5;">
        <tr><td style="padding:16px 18px;font-size:13px;line-height:1.8;color:#111;">
          <strong>${escapar(p.pago.titular)}</strong><br>
          ${escapar(p.pago.rut)}<br>
          ${escapar(p.pago.banco)} · ${escapar(p.pago.tipo)}<br>
          <span style="font-family:'Courier New',Courier,monospace;font-size:15px;">${escapar(p.pago.numero)}</span><br>
          ${escapar(p.pago.correo)}
        </td></tr>
      </table>
      <p style="margin:10px 0 0;font-size:12px;line-height:1.6;color:#777;">
        Transfiere ${formatCLP(p.total)} y escribe <strong style="color:#111;">${escapar(p.numero)}</strong> en el mensaje de la transferencia.
        Después mándanos el comprobante por WhatsApp y te confirmamos el cupo.
      </p>` : ''}

      <p style="margin:26px 0 0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#777;">Entrega</p>
      <p style="margin:8px 0 0;font-size:13px;line-height:1.6;color:#444;">
        ${escapar(p.direccion)}, ${escapar(p.comuna)}<br>Los lunes por la mañana.
      </p>

      <a href="https://wa.me/${WHATSAPP_NUMERO}" style="display:inline-block;margin-top:26px;background:#030303;color:#f6f6f2;text-decoration:none;padding:15px 26px;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">Escribir por WhatsApp</a>
    </td></tr>
    <tr><td style="padding:0 28px 28px;">
      <p style="margin:0;border-top:1px solid #eee;padding-top:16px;font-size:11px;line-height:1.6;color:#999;">
        Este correo es el respaldo de tu pedido, no la confirmación del cupo: esa te la damos por WhatsApp.<br>PREPS · preps.cl
      </p>
    </td></tr>
  </table>
</body></html>`;
}

/**
 * Manda el correo. Devuelve si salió, para poder decirlo en pantalla sin
 * prometerlo cuando no salió. Nunca tira error.
 */
export async function enviarConfirmacion(p: PedidoParaCorreo): Promise<boolean> {
  const clave = process.env.RESEND_API_KEY;
  if (!clave) return false;

  try {
    const r = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clave}` },
      body: JSON.stringify({
        from: process.env.CORREO_DESDE || REMITENTE_POR_DEFECTO,
        to: [p.correo],
        // Copia oculta al negocio, si está configurada: deja el mismo
        // respaldo del lado de acá sin mostrar una dirección interna.
        ...(process.env.CORREO_COPIA ? { bcc: [process.env.CORREO_COPIA] } : {}),
        ...(process.env.CORREO_RESPUESTA ? { reply_to: process.env.CORREO_RESPUESTA } : {}),
        subject: `Pedido ${p.numero} recibido · PREPS`,
        html: plantilla(p),
        text: textoPlano(p),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) {
      console.error('[correo] Resend respondió', r.status, (await r.text()).slice(0, 300));
      return false;
    }
    return true;
  } catch (e) {
    console.error('[correo] no se pudo enviar:', e);
    return false;
  }
}
