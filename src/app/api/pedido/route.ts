import { NextRequest, NextResponse } from 'next/server';
import { PACKS, VARIANTES } from '@/lib/productos';
import { COMUNAS_CUBIERTAS, OTRA_COMUNA, calcularDespacho } from '@/lib/despacho';
import { enviarConfirmacion, type LineaPedido } from '@/lib/correo';
import { datosPago } from '@/lib/pago';
import {
  CANTIDAD_MAXIMA, CANTIDAD_MINIMA, GRAMOS_MAX, GRAMOS_PASO, SAL_MAX,
  alcanzaMinimoPlato, limpiarEtiqueta, nombreProtocolo, precioUnitario, type Receta,
} from '@/lib/lab';


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/* ────────────────────────────────────────────────────────────────
   CHECKOUT — crea el pedido en el panel de gestión.

   El navegador no habla con el panel: habla con esta ruta, y esta
   ruta le habla al panel desde el servidor. Tres razones:

     · El secreto del webhook queda acá. Si lo mandara el navegador
       viajaría en el HTML y dejaría de ser secreto.
     · El panel responde el pedido completo, con el costo interno de
       cada plato. Esa respuesta no tiene por qué llegarle al cliente:
       de acá solo sale el número y el total.
     · Es el lugar donde después se va a crear el pago de Mercado
       Pago, que también necesita una clave que no puede ver nadie.

   Precios y despacho los vuelve a calcular el panel. Lo que se valida
   acá es para responder rápido y con un mensaje claro, no para cobrar.
   ──────────────────────────────────────────────────────────────── */

const MAX_PACKS = 5;               // capacidad semanal: 5 packs de cualquier tamaño
const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

type ItemEntrada = {
  clase?: unknown; variante?: unknown; unidades?: unknown; pimienta?: unknown; cantidad?: unknown;
  pollo?: unknown; arroz?: unknown; brocoli?: unknown; prep?: unknown; sal?: unknown; etiqueta?: unknown;
};

/** Los gramos que acepta el configurador: de 0 a 800, de 50 en 50. */
function gramos(v: unknown): number | null {
  const n = Number(v);
  return Number.isSafeInteger(n) && n >= 0 && n <= GRAMOS_MAX && n % GRAMOS_PASO === 0 ? n : null;
}

/** La receta que llega del carrito, o null si no es una receta pedible. */
function recetaValida(raw: ItemEntrada): Receta | null {
  const pollo = gramos(raw.pollo);
  const arroz = gramos(raw.arroz);
  const brocoli = gramos(raw.brocoli);
  const sal = Number(raw.sal);
  if (pollo === null || arroz === null || brocoli === null) return null;
  if (raw.prep !== 'PLANCHA' && raw.prep !== 'COCIDO') return null;
  if (typeof raw.pimienta !== 'boolean') return null;
  if (!Number.isSafeInteger(sal) || sal < 0 || sal > SAL_MAX) return null;
  const receta: Receta = { pollo, arroz, brocoli, prep: raw.prep };
  // Mismo piso que muestra el configurador: por debajo no se prepara.
  return alcanzaMinimoPlato(receta) ? receta : null;
}

function texto(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '';
}

/**
 * Celular chileno: acepta "+56 9 1234 5678", "56912345678" o "912345678"
 * y lo deja en un solo formato para que el panel no tenga tres versiones
 * del mismo número.
 */
function telefonoChileno(v: unknown): string | null {
  const digitos = String(v ?? '').replace(/\D/g, '');
  const nueve = digitos.startsWith('56') ? digitos.slice(2) : digitos;
  if (!/^9\d{8}$/.test(nueve)) return null;
  return `+56 9 ${nueve.slice(1, 5)} ${nueve.slice(5)}`;
}

function error(mensaje: string, status = 400) {
  return NextResponse.json({ error: mensaje }, { status });
}

export async function POST(req: NextRequest) {
  const panel = process.env.PANEL_URL;
  const secreto = process.env.WEBHOOK_SECRET;
  if (!panel || !secreto) {
    console.error('[pedido] falta PANEL_URL o WEBHOOK_SECRET');
    return error('Los pedidos en línea no están disponibles por ahora.', 503);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return error('Petición inválida.');
  }

  // ── Datos de contacto ─────────────────────────────────────────
  const nombre = texto(body.nombre, 80);
  if (nombre.length < 2) return error('Escribe tu nombre.');

  const correo = texto(body.correo, 254).toLowerCase();
  if (!FORMATO_CORREO.test(correo)) return error('Revisa el correo.');

  const telefono = telefonoChileno(body.telefono);
  if (!telefono) return error('Revisa el celular: debe ser un número chileno de 9 dígitos que empiece con 9.');

  // ── Entrega ───────────────────────────────────────────────────
  const eleccion = texto(body.comuna, 60);
  const esOtra = eleccion === OTRA_COMUNA;
  if (!esOtra && !COMUNAS_CUBIERTAS.some((c) => c.comuna === eleccion)) {
    return error('Elige tu comuna.');
  }
  const comuna = esOtra ? texto(body.comunaOtra, 60) : eleccion;
  if (esOtra && comuna.length < 2) return error('Escribe tu comuna.');

  const direccion = texto(body.direccion, 160);
  if (direccion.length < 5) return error('Escribe tu dirección.');
  const detalle = texto(body.detalle, 120);
  const notas = texto(body.notas, 300);

  if (body.protocolo !== true) return error('Acepta el protocolo de operación para continuar.');

  // ── Packs ─────────────────────────────────────────────────────
  if (!Array.isArray(body.items) || body.items.length === 0) return error('Tu carrito está vacío.');
  if (body.items.length > 20) return error('Petición inválida.');

  let packs = 0;
  let subtotal = 0;
  const items: Array<{
    tipo: string; variante?: string; cantidad: number; nombre: string;
    g_pollo?: number; g_arroz?: number; g_brocoli?: number;
  }> = [];
  // Lo mismo, pero con precio y en palabras: es lo que va en el correo.
  const lineas: LineaPedido[] = [];

  for (const raw of body.items as ItemEntrada[]) {
    /* Platos del configurador: gramos en vez de pack. El precio sale de la
       receta, nunca del navegador, y el panel lo vuelve a calcular igual. */
    if (raw?.clase === 'lab') {
      const receta = recetaValida(raw);
      const cantidad = Number(raw?.cantidad);
      if (!receta || !Number.isSafeInteger(cantidad)
          || cantidad < CANTIDAD_MINIMA || cantidad > CANTIDAD_MAXIMA) {
        return error('Hay un plato del configurador que ya no es válido. Revísalo e inténtalo de nuevo.');
      }
      const precio = precioUnitario(receta);
      const etiqueta = limpiarEtiqueta(raw.etiqueta);
      const nombre = [
        `Custom Lab · ${nombreProtocolo(receta)}`,
        `${receta.pollo}g pollo (${receta.prep.toLowerCase()}) · ${receta.arroz}g arroz · ${receta.brocoli}g brócoli`,
        `${raw.pimienta ? 'con' : 'sin'} pimienta`,
        Number(raw.sal) > 0 ? `sal ${Number(raw.sal)}g` : '',
        etiqueta ? `etiqueta "${etiqueta}"` : '',
      ].filter(Boolean).join(' · ');

      subtotal += precio * cantidad;
      items.push({
        tipo: 'labs',
        cantidad,
        nombre,
        g_pollo: receta.pollo,
        g_arroz: receta.arroz,
        g_brocoli: receta.brocoli,
      });
      lineas.push({ nombre, cantidad, precio });
      continue;
    }

    const variante = VARIANTES.find((v) => v.slug === raw?.variante);
    const pack = PACKS.find((p) => p.unidades === raw?.unidades);
    const cantidad = Number(raw?.cantidad);
    if (!variante || !pack || typeof raw?.pimienta !== 'boolean'
        || !Number.isSafeInteger(cantidad) || cantidad < 1) {
      return error('Hay un producto del carrito que ya no está disponible. Revísalo e inténtalo de nuevo.');
    }
    packs += cantidad;
    subtotal += pack.precio * cantidad;
    items.push({
      tipo: `pack_${pack.unidades}`,
      // El panel usa guion bajo; las URLs del sitio, guion.
      variante: variante.slug.replace('-', '_'),
      cantidad,
      nombre: `${variante.nombre} · ${pack.unidades} comidas · ${raw.pimienta ? 'con' : 'sin'} pimienta`,
    });
    lineas.push({
      nombre: `${variante.nombre} · ${pack.unidades} comidas · ${raw.pimienta ? 'con' : 'sin'} pimienta`,
      cantidad,
      precio: pack.precio,
    });
  }
  if (packs > MAX_PACKS) return error(`Puedes pedir hasta ${MAX_PACKS} packs por semana.`);

  const despacho = calcularDespacho(comuna);

  // ── Al panel ──────────────────────────────────────────────────
  let respuesta: Response;
  try {
    respuesta = await fetch(`${panel.replace(/\/$/, '')}/api/pedidos/nuevo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-webhook-secret': secreto },
      body: JSON.stringify({
        cliente: nombre,
        email: correo,
        telefono,
        comuna,
        direccion: detalle ? `${direccion}, ${detalle}` : direccion,
        notas,
        origen: 'WEB',
        items,
        // Solo para que el panel detecte un descuadre: el total lo calcula él.
        total: subtotal + despacho.costo,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (e) {
    console.error('[pedido] el panel no respondió:', e);
    return error('No pudimos registrar tu pedido. Inténtalo de nuevo en un momento.', 502);
  }

  if (!respuesta.ok) {
    const detalle = (await respuesta.text()).slice(0, 300);

    /* La semana está cerrada. No es un error que se arregle reintentando,
       así que se dice tal cual y con el mensaje que puso el panel. */
    if (respuesta.status === 409 && detalle.includes('PEDIDOS_CERRADOS')) {
      let mensaje = '';
      try { mensaje = String((JSON.parse(detalle) as { mensaje?: unknown }).mensaje ?? ''); } catch {}
      return NextResponse.json(
        { error: mensaje || 'Por ahora no estamos tomando pedidos. Escríbenos por WhatsApp y te avisamos apenas abramos.', cerrado: true },
        { status: 409 }
      );
    }

    console.error('[pedido] el panel respondió', respuesta.status, detalle);
    return error('No pudimos registrar tu pedido. Inténtalo de nuevo en un momento.', 502);
  }

  const { pedido } = (await respuesta.json()) as { pedido?: { numero?: string; total?: number } };
  if (!pedido?.numero) {
    console.error('[pedido] el panel respondió sin número de pedido');
    return error('No pudimos registrar tu pedido. Inténtalo de nuevo en un momento.', 502);
  }

  const total = pedido.total ?? subtotal + despacho.costo;

  /* Los datos para transferir solo cuando el total está cerrado. Fuera de
     la zona de reparto falta sumarle el despacho, así que pedir que
     transfiera ahora sería cobrarle un monto que todavía no es el final. */
  const pago = despacho.cubierta ? datosPago() : null;

  /* El correo va después de que el panel anotó el pedido: nadie debería
     recibir el respaldo de algo que no quedó registrado. Se espera a que
     salga —en Vercel una tarea que queda corriendo después de responder se
     corta a medio camino— pero si falla, el pedido vale igual. */
  const correoEnviado = await enviarConfirmacion({
    numero: pedido.numero,
    nombre,
    correo,
    lineas,
    subtotal,
    despacho: despacho.costo,
    total,
    despachoACoordinar: !despacho.cubierta,
    comuna,
    direccion: detalle ? `${direccion}, ${detalle}` : direccion,
    pago,
  });

  return NextResponse.json({
    ok: true,
    numero: pedido.numero,
    total,
    despachoACoordinar: !despacho.cubierta,
    correoEnviado,
    pago,
  });
}
