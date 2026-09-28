/**
 * Genera el cuadro inicial de la animación: el envase vacío en el MISMO
 * encuadre que la foto del plato terminado.
 *
 * Todas las fotos salen de la misma cámara y la misma luz —lo confirma que el
 * envase tenga proporción 1.47 en todas—, pero `1.png` está tomada más lejos
 * que `menu2.png`. Para que un modelo de video interpole entre las dos sin
 * mover la cámara, el envase tiene que medir y estar donde mismo en ambas.
 *
 * Como el ángulo es idéntico, alcanza con recortar y escalar: no hay que
 * corregir perspectiva.
 *
 * Uso: node scripts/alinear-cuadros.mjs
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const ORIGEN = 'C:/Users/lcace/OneDrive/Documentos';
const DESTINO = 'C:/Users/lcace/OneDrive/Desktop/PREPS-video';

const VACIO = '1.png';
const REFERENCIA = 'menu2.png';

/**
 * Caja del envase. Usa el canal alfa si la foto lo trae (fondo recortado) y
 * si no, el brillo: sobre negro puro cualquier parte del envase supera 18.
 */
async function cajaEnvase(archivo) {
  const img = sharp(path.join(ORIGEN, archivo));
  const meta = await img.metadata();

  const canal = meta.hasAlpha
    ? await img.clone().extractChannel(3).raw().toBuffer({ resolveWithObject: true })
    : await img.clone().greyscale().raw().toBuffer({ resolveWithObject: true });

  const { data, info } = canal;
  const { width: w, height: h } = info;
  const umbral = meta.hasAlpha ? 16 : 18;

  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[y * w + x] > umbral) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1, lienzoW: w, lienzoH: h };
}

async function main() {
  await mkdir(DESTINO, { recursive: true });

  const ref = await cajaEnvase(REFERENCIA);
  const vac = await cajaEnvase(VACIO);

  console.log(`${REFERENCIA}: envase ${ref.w}x${ref.h} en (${ref.x0},${ref.y0}) — proporción ${(ref.w / ref.h).toFixed(3)}`);
  console.log(`${VACIO}: envase ${vac.w}x${vac.h} en (${vac.x0},${vac.y0}) — proporción ${(vac.w / vac.h).toFixed(3)}`);

  const propRef = ref.w / ref.h;
  const propVac = vac.w / vac.h;
  const desvio = Math.abs(propRef - propVac) / propRef;
  console.log(`\ndiferencia de proporción: ${(desvio * 100).toFixed(2)}%`);
  if (desvio > 0.04) {
    console.warn('  ATENCIÓN: son ángulos distintos, un recorte no alcanza.');
  } else {
    console.log('  Mismo ángulo de cámara: alcanza con recortar y escalar.');
  }

  // Escala necesaria para que el envase vacío mida lo mismo que el de referencia.
  const escala = ref.w / vac.w;

  // Ventana a recortar de la foto vacía, tal que al escalarla el envase quede
  // exactamente en la posición del de referencia.
  const ventanaW = Math.round(ref.lienzoW / escala);
  const ventanaH = Math.round(ref.lienzoH / escala);
  const left = Math.round(vac.x0 - ref.x0 / escala);
  const top = Math.round(vac.y0 - ref.y0 / escala);

  console.log(`\nescala ${escala.toFixed(4)}  ventana ${ventanaW}x${ventanaH} en (${left},${top})`);

  if (left < 0 || top < 0 || left + ventanaW > vac.lienzoW || top + ventanaH > vac.lienzoH) {
    console.warn('  La ventana se sale de la foto; se rellena con negro.');
  }

  const salida = path.join(DESTINO, 'cuadro-inicial-vacio.png');
  await sharp(path.join(ORIGEN, VACIO))
    .extract({
      left: Math.max(0, left),
      top: Math.max(0, top),
      width: Math.min(ventanaW, vac.lienzoW - Math.max(0, left)),
      height: Math.min(ventanaH, vac.lienzoH - Math.max(0, top)),
    })
    .resize(ref.lienzoW, ref.lienzoH, { fit: 'fill' })
    .flatten({ background: '#000000' })
    .png()
    .toFile(salida);

  // El cuadro final: la referencia sobre negro, mismo lienzo.
  await sharp(path.join(ORIGEN, REFERENCIA))
    .flatten({ background: '#000000' })
    .png()
    .toFile(path.join(DESTINO, 'cuadro-final-completo.png'));

  console.log('\nescritos cuadro-inicial-vacio.png y cuadro-final-completo.png');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
