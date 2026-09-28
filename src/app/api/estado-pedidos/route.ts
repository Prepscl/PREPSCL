import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/* ────────────────────────────────────────────────────────────────
   ¿Hay pedidos abiertos esta semana?

   Lo decide el panel, con un interruptor. El navegador pregunta acá y
   esta ruta le pregunta al panel con el secreto, igual que /api/pedido:
   el secreto no puede viajar al navegador.

   Esto es solo para mostrar el cartel a tiempo. Quien de verdad rechaza
   un pedido cerrado es el panel, cuando el pedido llega.
   ──────────────────────────────────────────────────────────────── */

export async function GET() {
  const panel = process.env.PANEL_URL;
  const secreto = process.env.WEBHOOK_SECRET;
  // Sin configuración no se afirma que esté cerrado: el carrito sigue su
  // camino y, si algo falla, el pedido se rechaza al llegar al panel.
  if (!panel || !secreto) return NextResponse.json({ abierto: true, mensaje: '' });

  try {
    const r = await fetch(`${panel.replace(/\/$/, '')}/api/pedidos/estado`, {
      headers: { 'x-webhook-secret': secreto },
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    });
    if (!r.ok) return NextResponse.json({ abierto: true, mensaje: '' });
    const estado = (await r.json()) as { abierto?: unknown; mensaje?: unknown };
    return NextResponse.json({
      abierto: estado.abierto !== false,
      mensaje: typeof estado.mensaje === 'string' ? estado.mensaje.slice(0, 200) : '',
    });
  } catch {
    return NextResponse.json({ abierto: true, mensaje: '' });
  }
}
