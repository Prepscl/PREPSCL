/**
 * Reencuadra los cuadros alineados a 16:9 con el envase a la derecha, como en
 * el hero.
 *
 * La herramienta de video genera en 16:9. Si le entregamos cuadros 3:2 recorta
 * por su cuenta y perdemos el control de dónde queda el envase. Mejor
 * entregárselos ya en 16:9.
 *
 * De paso se corre el envase a la derecha para que calce con el hero, que deja
 * la mitad izquierda libre para el titular. Como el fondo es negro plano,
 * agregar lienzo a la izquierda no se nota.
 *
 * Uso: node scripts/encuadre-169.mjs
 */
import sharp from 'sharp';
import path from 'node:path';

const CARPETA = 'C:/Users/lcace/OneDrive/Desktop/PREPS-video';

const SALIDA_W = 1920;
const SALIDA_H = 1080;

// Posición del centro del envase en el hero actual.
const CENTRO_X = 0.69;
const CENTRO_Y = 0.51;

const CUADROS = [
  { entrada: '1-INICIO-envase-vacio.png', salida: '1-INICIO-envase-vacio.png' },
  { entrada: '2-FINAL-plato-completo.png', salida: '2-FINAL-plato-completo.png' },
];

/** Caja del envase sobre fondo negro. */
async function cajaEnvase(archivo) {
  const { data, info } = await sharp(archivo)
    .flatten({ background: '#000000' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[y * w + x] > 18) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1, W: w, H: h };
}

async function main() {
  // El primer cuadro define la escala; el segundo usa la MISMA para que el
  // envase no cambie de tamaño entre uno y otro.
  const ref = await cajaEnvase(path.join(CARPETA, CUADROS[0].entrada));

  // Que el envase ocupe la misma fracción de ancho que en el hero (~59 %).
  const anchoDestino = SALIDA_W * 0.59;
  const escala = anchoDestino / ref.w;

  console.log(`envase original ${ref.w}x${ref.h} — escala ${escala.toFixed(4)}`);

  for (const { entrada, salida } of CUADROS) {
    const ruta = path.join(CARPETA, entrada);

    const nuevoW = Math.round(ref.W * escala);
    const nuevoH = Math.round(ref.H * escala);

    // Dónde queda el centro del envase tras escalar.
    const cxEscalado = (ref.x0 + ref.w / 2) * escala;
    const cyEscalado = (ref.y0 + ref.h / 2) * escala;

    // Desplazamiento para llevarlo al punto del hero.
    const dx = Math.round(SALIDA_W * CENTRO_X - cxEscalado);
    const dy = Math.round(SALIDA_H * CENTRO_Y - cyEscalado);

    const escalada = await sharp(ruta)
      .flatten({ background: '#000000' })
      .resize(nuevoW, nuevoH)
      .toBuffer();

    // La escalada puede ser más grande que el lienzo, así que hay que quedarse
    // solo con la parte que efectivamente entra: sharp no compone imágenes que
    // sobresalgan.
    const srcLeft = Math.max(0, -dx);
    const srcTop = Math.max(0, -dy);
    const destLeft = Math.max(0, dx);
    const destTop = Math.max(0, dy);
    const srcW = Math.min(nuevoW - srcLeft, SALIDA_W - destLeft);
    const srcH = Math.min(nuevoH - srcTop, SALIDA_H - destTop);

    const visible = await sharp(escalada)
      .extract({ left: srcLeft, top: srcTop, width: srcW, height: srcH })
      .toBuffer();

    await sharp({
      create: {
        width: SALIDA_W, height: SALIDA_H, channels: 3,
        background: '#000000',
      },
    })
      .composite([{ input: visible, left: destLeft, top: destTop }])
      .png()
      .toFile(path.join(CARPETA, salida.replace('.png', '-16x9.png')));

    console.log(
      `  ${salida.replace('.png', '-16x9.png')} — ventana ${srcW}x${srcH} en (${destLeft},${destTop})`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
