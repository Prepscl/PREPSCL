/**
 * Parte cada recorte de ingrediente en piezas sueltas.
 *
 * `recortar-ingredientes.mjs` deja un WebP por ingrediente, pero animarlo
 * entero se ve como un bloque rígido bajando. Acá se etiquetan las regiones
 * conectadas del canal alfa para separar cada floreta de brócoli y cada trozo
 * de pollo, y así cada pieza puede caer con su propia trayectoria y rotación.
 *
 * Sale un WebP por pieza más un manifiesto con su posición en el lienzo.
 *
 * Uso: node scripts/segmentar-piezas.mjs
 */
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ORIGEN = 'public/img/hero';
const DESTINO = 'public/img/hero/piezas';

/** Bajo este tamaño es ruido del recorte, no un trozo de comida. */
const AREA_MINIMA = 900;

const INGREDIENTES = ['arroz', 'brocoli', 'pollo'];

/**
 * Etiquetado de componentes conectados (8-vecinos) sobre el alfa.
 * Iterativo con pila propia: recursivo desborda con regiones grandes.
 */
function componentes(alfa, w, h) {
  const etiqueta = new Int32Array(w * h);
  const regiones = [];
  const pila = new Int32Array(w * h);

  for (let inicio = 0; inicio < w * h; inicio++) {
    if (alfa[inicio] <= 128 || etiqueta[inicio] !== 0) continue;

    const id = regiones.length + 1;
    let tope = 0;
    pila[tope++] = inicio;
    etiqueta[inicio] = id;

    let x0 = w, y0 = h, x1 = -1, y1 = -1, area = 0;

    while (tope > 0) {
      const p = pila[--tope];
      const px = p % w;
      const py = (p / w) | 0;
      area++;
      if (px < x0) x0 = px;
      if (px > x1) x1 = px;
      if (py < y0) y0 = py;
      if (py > y1) y1 = py;

      for (let dy = -1; dy <= 1; dy++) {
        const ny = py + dy;
        if (ny < 0 || ny >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = px + dx;
          if (nx < 0 || nx >= w) continue;
          const q = ny * w + nx;
          if (alfa[q] > 128 && etiqueta[q] === 0) {
            etiqueta[q] = id;
            pila[tope++] = q;
          }
        }
      }
    }

    regiones.push({ id, area, left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 });
  }

  return { etiqueta, regiones };
}

async function main() {
  await mkdir(DESTINO, { recursive: true });
  const manifiesto = {};

  for (const nombre of INGREDIENTES) {
    const archivo = path.join(ORIGEN, `${nombre}.webp`);
    const { data, info } = await sharp(archivo)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width: w, height: h } = info;
    const alfa = new Uint8Array(w * h);
    for (let p = 0; p < w * h; p++) alfa[p] = data[p * 4 + 3];

    const { etiqueta, regiones } = componentes(alfa, w, h);
    const utiles = regiones
      .filter((r) => r.area >= AREA_MINIMA)
      .sort((a, b) => b.area - a.area);

    console.log(
      `${nombre}: ${regiones.length} regiones, ${utiles.length} sobre ${AREA_MINIMA}px`
    );

    manifiesto[nombre] = [];

    for (let i = 0; i < utiles.length; i++) {
      const r = utiles[i];

      // Copia solo los píxeles de ESTA región; el resto transparente.
      const recorte = Buffer.alloc(r.width * r.height * 4);
      for (let y = 0; y < r.height; y++) {
        for (let x = 0; x < r.width; x++) {
          const src = (r.top + y) * w + (r.left + x);
          const dst = (y * r.width + x) * 4;
          if (etiqueta[src] === r.id) {
            recorte[dst] = data[src * 4];
            recorte[dst + 1] = data[src * 4 + 1];
            recorte[dst + 2] = data[src * 4 + 2];
            recorte[dst + 3] = data[src * 4 + 3];
          }
        }
      }

      const salida = `${nombre}-${String(i + 1).padStart(2, '0')}.webp`;
      await sharp(recorte, { raw: { width: r.width, height: r.height, channels: 4 } })
        .webp({ quality: 88, alphaQuality: 90, effort: 6 })
        .toFile(path.join(DESTINO, salida));

      // Posición en porcentaje sobre el lienzo, para que la animación sea
      // independiente del tamaño al que se muestre.
      manifiesto[nombre].push({
        src: `/img/hero/piezas/${salida}`,
        left: +((r.left / w) * 100).toFixed(3),
        top: +((r.top / h) * 100).toFixed(3),
        width: +((r.width / w) * 100).toFixed(3),
        height: +((r.height / h) * 100).toFixed(3),
        area: r.area,
      });

      console.log(`  ${salida}  ${r.width}x${r.height}  area ${r.area}`);
    }
  }

  await writeFile(
    path.join(DESTINO, 'manifiesto.json'),
    JSON.stringify(manifiesto, null, 2)
  );
  const total = Object.values(manifiesto).reduce((s, a) => s + a.length, 0);
  console.log(`\n${total} piezas en total`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
