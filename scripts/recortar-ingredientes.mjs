/**
 * Recorta cada ingrediente por diferencia contra el envase vacío.
 *
 * Las fotos del Custom Lab están registradas al píxel: mismo encuadre, misma
 * luz, el envase en el mismo lugar. Entonces lo que cambia entre la foto del
 * envase vacío y la del envase con arroz *es* el arroz. Comparando píxel a
 * píxel sale un PNG transparente con solo ese ingrediente, que después se puede
 * animar cayendo en el navegador.
 *
 * Uso: node scripts/recortar-ingredientes.mjs
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const ORIGEN = 'C:/Users/lcace/OneDrive/Documentos';
const DESTINO = 'public/img/hero';

const ANCHO = 1800;       // ancho de trabajo y de salida
const UMBRAL = 38;        // distancia RGB mínima para considerar "cambió"
const FEATHER = 1.5;      // desenfoque del borde, en px

const VACIO = '1.png';

/**
 * Cadena progresiva: cada paso se compara contra el ANTERIOR, no contra el
 * envase vacío.
 *
 * Es la diferencia clave. Las fotos de cada ingrediente por separado lo ponen
 * siempre en el medio del envase, así que superponerlas no arma el plato.
 * En cambio, restando `5 - 4` sale el brócoli exactamente donde va en la
 * composición final, y apilando envase + arroz + brócoli + pollo se reconstruye
 * la foto 31 tal cual.
 */
const CADENA = [
  { base: '1.png',  con: '4.png',  salida: 'arroz'   },
  { base: '4.png',  con: '5.png',  salida: 'brocoli' },
  { base: '5.png',  con: '31.png', salida: 'pollo'   },
];

/**
 * Píxeles RGB crudos, sin canal alfa.
 *
 * Sin alfa a propósito: después le pegamos la máscara con joinChannel, y si la
 * imagen ya trae alfa el resultado queda de 5 canales en vez de RGBA.
 */
async function crudo(archivo) {
  const { data, info } = await sharp(path.join(ORIGEN, archivo))
    .resize({ width: ANCHO })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height, canales: info.channels };
}

/**
 * Máscara de 1 canal: 255 donde el ingrediente difiere del envase vacío.
 * Se compara en distancia euclídea sobre RGB.
 */
function construirMascara(base, cmp, w, h) {
  const mascara = Buffer.alloc(w * h);
  for (let i = 0, p = 0; p < w * h; i += 3, p++) {
    const dr = cmp[i] - base[i];
    const dg = cmp[i + 1] - base[i + 1];
    const db = cmp[i + 2] - base[i + 2];
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    mascara[p] = dist > UMBRAL ? 255 : 0;
  }
  return mascara;
}

/** Caja que contiene todo lo opaco, para recortar el PNG y que pese menos. */
function caja(mascara, w, h) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mascara[y * w + x] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null;
  return { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}

async function main() {
  await mkdir(DESTINO, { recursive: true });

  // El envase vacío es la capa de fondo de la animación.
  await sharp(path.join(ORIGEN, VACIO))
    .resize({ width: ANCHO })
    .webp({ quality: 88, alphaQuality: 90, effort: 6 })
    .toFile(path.join(DESTINO, 'envase.webp'));

  const cache = new Map();
  const leer = async (f) => {
    if (!cache.has(f)) cache.set(f, await crudo(f));
    return cache.get(f);
  };

  const primero = await leer(VACIO);
  console.log(`lienzo ${primero.w}x${primero.h}\n`);

  for (const { base: fBase, con, salida } of CADENA) {
    const base = await leer(fBase);
    const ing = await leer(con);
    if (ing.w !== base.w || ing.h !== base.h) {
      console.error(`  ${con}: dimensiones distintas, se omite`);
      continue;
    }

    const cruda = construirMascara(base.data, ing.data, base.w, base.h);

    // Suavizar el borde para que no quede recortado a cuchillo.
    // blur() promueve el buffer a 3 canales, así que hay que volverlo a 1 o el
    // resto lo lee corrido.
    const mascara = await sharp(cruda, {
      raw: { width: base.w, height: base.h, channels: 1 },
    })
      .blur(FEATHER)
      .toColourspace('b-w')
      .raw()
      .toBuffer();

    if (mascara.length !== base.w * base.h) {
      throw new Error(
        `máscara de ${mascara.length} bytes, se esperaban ${base.w * base.h}`
      );
    }

    const region = caja(mascara, base.w, base.h);
    if (!region) {
      console.error(`  ${con}: no se detectó diferencia, se omite`);
      continue;
    }

    // Se guarda el lienzo completo, no recortado: así todas las capas comparten
    // el mismo sistema de coordenadas y en CSS se apilan con inset:0 sin tener
    // que posicionar cada una a mano.
    const salidaWebp = `${salida}.webp`;
    const buf = await sharp(ing.data, {
      raw: { width: base.w, height: base.h, channels: 3 },
    })
      .joinChannel(mascara, { raw: { width: base.w, height: base.h, channels: 1 } })
      .webp({ quality: 88, alphaQuality: 90, effort: 6 })
      .toBuffer();

    await sharp(buf).toFile(path.join(DESTINO, salidaWebp));

    // El centro de la caja sirve como origen de la caída en la animación.
    const cx = ((region.left + region.width / 2) / base.w * 100).toFixed(1);
    const cy = ((region.top + region.height / 2) / base.h * 100).toFixed(1);
    console.log(
      `  ${salidaWebp.padEnd(13)} centro ${cx}% ${cy}%  —  ${Math.round(buf.length / 1024)}KB`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
