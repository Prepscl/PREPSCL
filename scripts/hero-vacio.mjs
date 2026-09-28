/**
 * Genera el cuadro inicial perfecto: la foto del hero con la comida borrada.
 *
 * Reutiliza los polígonos y la alineación del envase vacío que ya están en
 * `src/lib/meal-layers.ts`. El resultado es el MISMO lienzo, el MISMO envase en
 * la MISMA posición, con la MISMA luz que la foto final — solo que vacío.
 *
 * Para un modelo de video eso es lo ideal: entre el primer y el último cuadro
 * lo único que cambia es la comida, así que no tiene margen para reinventar el
 * envase, el encuadre ni la iluminación.
 *
 * Uso: node scripts/hero-vacio.mjs
 */
import sharp from 'sharp';
import path from 'node:path';

const HERO = 'public/img/hero-preps-menu2-v3.png';
const ENVASE = 'public/img/hero/envase.webp';
const DESTINO = 'C:/Users/lcace/OneDrive/Desktop/PREPS-video';


const silhouette = [
  [727,452],[744,414],[769,392],[794,366],[824,353],[844,330],[853,298],
  [880,279],[915,259],[951,231],[987,215],[1018,202],[1060,203],[1092,209],
  [1124,216],[1154,232],[1180,247],[1199,278],[1226,291],[1246,316],
  [1249,337],[1267,343],[1286,344],[1300,354],[1324,350],[1341,363],
  [1363,365],[1370,391],[1388,417],[1381,449],[1415,438],[1439,425],
  [1456,428],[1457,460],[1482,453],[1491,431],[1517,420],[1553,424],
  [1575,428],[1586,441],[1580,461],[1560,488],[1553,503],[1579,504],
  [1593,519],[1582,539],[1572,564],[1536,592],[1496,618],[1463,643],
  [1427,668],[1380,698],[1337,718],[1297,725],[1266,723],[1228,704],
  [1195,686],[1156,669],[1126,649],[1086,629],[1046,609],[1007,589],
  [969,572],[931,550],[893,531],[856,512],[819,492],[780,475],[749,462],
];

function contains(points, x, y) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [ax, ay] = points[i], [bx, by] = points[j];
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside;
  }
  return inside;
}

async function main() {
  const meta = await sharp(HERO).metadata();
  const w = meta.width, h = meta.height;
  if (w !== 1672 || h !== 941) throw new Error(`Hero es ${w}x${h}; los polígonos son para 1672x941`);

  const hero = await sharp(HERO).flatten({ background: '#000000' }).removeAlpha()
    .raw().toBuffer();

  // Envase vacío alineado igual que en meal-layers.ts: drawImage(empty, 66, -345, 2304, 1404)
  const escalado = await sharp(ENVASE).resize(2304, 1404, { fit: 'fill' })
    .flatten({ background: '#090b0c' }).toBuffer();

  // El offset vertical es negativo, así que hay que recortar la parte visible.
  const srcTop = 345, destLeft = 66;
  const visible = await sharp(escalado)
    .extract({ left: 0, top: srcTop, width: Math.min(2304, w - destLeft), height: Math.min(1404 - srcTop, h) })
    .toBuffer();

  const fondo = await sharp({
    create: { width: w, height: h, channels: 3, background: '#090b0c' },
  })
    .composite([{ input: visible, left: destLeft, top: 0 }])
    .removeAlpha()
    .raw()
    .toBuffer();

  // Copia del hero, reemplazando cada píxel de comida por el del envase vacío.
  const salida = Buffer.from(hero);
  let tocados = 0;

  for (let y = 185; y < 741; y++) {
    for (let x = 716; x < 1608; x++) {
      const p = (y * w + x) * 3;
      const r = hero[p], g = hero[p + 1], b = hero[p + 2];
      const foodEdge = (g > 24 && g > b * 1.12 && g > r * 1.12)
        || (r > 60 && r > b * 1.035 && g > b * 1.02);
      if (!contains(silhouette, x, y) && !foodEdge) continue;
      salida[p] = fondo[p];
      salida[p + 1] = fondo[p + 1];
      salida[p + 2] = fondo[p + 2];
      tocados++;
    }
  }

  const destino = path.join(DESTINO, 'A-INICIO-hero-vacio.png');
  await sharp(salida, { raw: { width: w, height: h, channels: 3 } })
    .png({ compressionLevel: 9 })
    .toFile(destino);

  console.log(`  ${tocados} píxeles de comida reemplazados (${(tocados / (w * h) * 100).toFixed(1)}% del cuadro)`);
  console.log(`  escrito ${destino}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
