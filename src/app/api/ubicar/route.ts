import { NextRequest, NextResponse } from 'next/server';
import { comunaCubierta, normalizarComuna } from '@/lib/despacho';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/* ────────────────────────────────────────────────────────────────
   Ubica en el mapa la dirección que se escribe en el carrito.

   Mismo principio que en Ulloa: el mapa confirma que la dirección
   existe y dónde queda, pero es ayuda, no requisito. Si no la
   encuentra, el pedido sigue igual.

   Lo que cambia es de dónde sale. En Ulloa se usa solo Nominatim
   (OpenStreetMap), y probado con direcciones de Santiago casi nunca
   encuentra una calle con número. Photon usa los mismos datos pero
   busca con más flexibilidad, y encuentra bastante más. El precio
   de esa flexibilidad es que a veces devuelve OTRA calle: "La Dehesa
   1200" lo manda a "Camino La Capellanía 1200".

   Por eso ningún resultado se acepta tal cual: la calle tiene que
   tener las palabras que escribió la persona y, si escribió número,
   ese mismo número. Un punto equivocado en el mapa es peor que no
   mostrar mapa: la persona confía en él.

   Las dos son gratis y sin clave, a cambio de usarlas con cuidado:
   identificarse, no consultar en cada tecla (el carrito espera a que
   se deje de escribir) y recordar lo ya consultado.
   ──────────────────────────────────────────────────────────────── */

const AGENTE = 'PREPS/1.0 (https://preps.cl)';
// Región Metropolitana con margen: el reparto es en Santiago.
const RM = { oeste: -71.3, sur: -34.0, este: -70.2, norte: -33.0 };

interface Candidato { lat: number; lon: number; calle: string; numero: string; comunas: string[] }
type Resultado =
  | { ok: true; lat: number; lon: number; comuna: string; etiqueta: string }
  | { ok: false };

// ── Memoria y tope ────────────────────────────────────────────────
// En memoria de cada instancia: no es exacto en serverless, pero basta
// para no repetir consultas ni dejar que un script use el servicio
// ajeno a través de este sitio.
const DIA = 24 * 60 * 60 * 1000;
const cache = new Map<string, { valor: Resultado; vence: number }>();
const consultas = new Map<string, number[]>();

function permitir(ip: string): boolean {
  const ahora = Date.now();
  const recientes = (consultas.get(ip) ?? []).filter((t) => ahora - t < 60_000);
  if (recientes.length >= 20) return false;
  recientes.push(ahora);
  consultas.set(ip, recientes);
  if (consultas.size > 5000) consultas.clear();
  return true;
}

function guardar(clave: string, valor: Resultado) {
  if (cache.size >= 500) cache.delete(cache.keys().next().value as string);
  cache.set(clave, { valor, vence: Date.now() + DIA });
}

// ── Comparar lo escrito con lo encontrado ─────────────────────────
// Palabras que no distinguen una calle de otra.
const GENERICAS = new Set([
  'avenida', 'av', 'avda', 'calle', 'pasaje', 'psje', 'pje', 'camino', 'paseo',
  'el', 'la', 'los', 'las', 'de', 'del', 'y', 'n', 'no', 'nro', 'numero',
]);

function palabras(s: string): string[] {
  return normalizarComuna(s).split(' ').filter((w) => w && !GENERICAS.has(w) && !/^\d+$/.test(w));
}

/** "Av. Irarrázaval 3400" → calle "Av. Irarrázaval", número "3400". */
function separar(direccion: string): { calle: string; numero: string } {
  const m = direccion.match(/\d{1,6}(?!.*\d)/);
  if (!m || m.index === undefined) return { calle: direccion, numero: '' };
  return { calle: direccion.slice(0, m.index) + direccion.slice(m.index + m[0].length), numero: m[0] };
}

/**
 * De qué comuna es. Las comunas cubiertas ganan: "Las Condes" viene como
 * distrito y "Santiago" como ciudad, y la que importa es la primera. Si
 * no es ninguna cubierta, la más específica que no sea el "Santiago"
 * genérico de la provincia.
 */
function comunaDe(c: Candidato): string {
  for (const x of c.comunas) {
    const cubierta = comunaCubierta(x);
    if (cubierta) return cubierta.comuna;
  }
  const utiles = c.comunas.filter((x) => !/^(provincia|region)\b/.test(normalizarComuna(x)));
  return utiles.find((x) => normalizarComuna(x) !== 'santiago') ?? utiles[0] ?? '';
}

function elegir(candidatos: Candidato[], buscado: { palabras: string[]; numero: string; comuna: string }): Candidato | null {
  const validos = candidatos.filter((c) => {
    const deLaCalle = new Set(palabras(c.calle));
    if (!buscado.palabras.every((p) => deLaCalle.has(p))) return false;
    if (buscado.numero) return c.numero.replace(/\D/g, '') === buscado.numero;
    // Sin número, un punto cualquiera de la calle solo sirve si al menos
    // es en la comuna que eligió: una calle larga cruza varias.
    return c.comunas.some((x) => normalizarComuna(x) === buscado.comuna);
  });
  return validos.find((c) => c.comunas.some((x) => normalizarComuna(x) === buscado.comuna)) ?? validos[0] ?? null;
}

// ── Los dos servicios ─────────────────────────────────────────────
async function photon(q: string): Promise<Candidato[]> {
  const params = new URLSearchParams({ q, limit: '8', bbox: `${RM.oeste},${RM.sur},${RM.este},${RM.norte}` });
  const r = await fetch(`https://photon.komoot.io/api/?${params}`, {
    headers: { 'User-Agent': AGENTE, Accept: 'application/json' },
    signal: AbortSignal.timeout(4000),
  });
  if (!r.ok) return [];
  const datos = (await r.json()) as {
    features?: Array<{ geometry: { coordinates: [number, number] }; properties: Record<string, string | undefined> }>;
  };
  return (datos.features ?? []).map(({ geometry, properties: p }) => ({
    lon: geometry.coordinates[0],
    lat: geometry.coordinates[1],
    calle: p.street ?? p.name ?? '',
    numero: p.housenumber ?? '',
    comunas: [p.district, p.city, p.locality, p.county].filter((x): x is string => Boolean(x)),
  }));
}

async function nominatim(q: string): Promise<Candidato[]> {
  const params = new URLSearchParams({
    q, format: 'jsonv2', addressdetails: '1', limit: '5', countrycodes: 'cl', 'accept-language': 'es',
    viewbox: `${RM.oeste},${RM.norte},${RM.este},${RM.sur}`, bounded: '1',
  });
  const r = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'User-Agent': AGENTE, Accept: 'application/json' },
    signal: AbortSignal.timeout(4000),
  });
  if (!r.ok) return [];
  const datos = (await r.json()) as Array<{ lat: string; lon: string; address?: Record<string, string | undefined> }>;
  return datos.map(({ lat, lon, address: a = {} }) => ({
    lat: Number(lat),
    lon: Number(lon),
    calle: a.road ?? '',
    numero: a.house_number ?? '',
    comunas: [a.city_district, a.municipality, a.suburb, a.city, a.town, a.village].filter((x): x is string => Boolean(x)),
  }));
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!permitir(ip)) return NextResponse.json({ ok: false }, { status: 429 });

  const direccion = (req.nextUrl.searchParams.get('direccion') ?? '').trim().replace(/\s+/g, ' ').slice(0, 160);
  const comuna = (req.nextUrl.searchParams.get('comuna') ?? '').trim().slice(0, 60);
  const { calle, numero } = separar(direccion);
  const buscado = { palabras: palabras(calle), numero, comuna: normalizarComuna(comuna) };
  if (buscado.palabras.length === 0 || comuna.length < 2) return NextResponse.json({ ok: false });

  const clave = `${normalizarComuna(direccion)}|${buscado.comuna}`;
  const guardado = cache.get(clave);
  if (guardado && guardado.vence > Date.now()) return NextResponse.json(guardado.valor);

  // De la más precisa a la más amplia; se para en la primera que calce.
  // Photon encuentra más sin la comuna en el texto (con ella a veces no
  // encuentra nada), así que la comuna se usa para elegir, no para buscar.
  const intentos = [
    () => photon(direccion),
    () => photon(`${direccion} ${comuna}`),
    () => nominatim(`${direccion}, ${comuna}, Chile`),
  ];

  let valor: Resultado = { ok: false };
  let fallo = false;
  for (const intento of intentos) {
    try {
      const elegido = elegir(await intento(), buscado);
      if (elegido) {
        const c = comunaDe(elegido);
        valor = {
          ok: true,
          lat: elegido.lat,
          lon: elegido.lon,
          comuna: c,
          etiqueta: [`${elegido.calle} ${elegido.numero}`.trim(), c].filter(Boolean).join(', '),
        };
        break;
      }
    } catch {
      // Sin conexión o tiempo agotado: se prueba el siguiente. No es algo
      // de lo que el cliente tenga que enterarse.
      fallo = true;
    }
  }

  // Un "no la encontramos" se recuerda; una caída del servicio no, para
  // volver a intentar la próxima vez.
  if (valor.ok || !fallo) guardar(clave, valor);
  return NextResponse.json(valor);
}
