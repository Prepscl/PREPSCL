'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import PaginaConRail from '@/components/PaginaConRail';
import CarritoSuplementos from '@/components/CarritoSuplementos';
import { useCarrito } from '@/lib/carrito';
import {
  MAX_PACKS, comidasLinea, esLab, precioLinea, recetaDe, useMealCart,
} from '@/lib/carrito-meals';
import { CANTIDAD_MAXIMA, CANTIDAD_MINIMA, fotoReceta, nombreProtocolo } from '@/lib/lab';
import { VARIANTES, WHATSAPP_NUMERO, formatCLP } from '@/lib/productos';
import { COMUNAS_CUBIERTAS, OTRA_COMUNA, calcularDespacho, comunaCubierta, normalizarComuna } from '@/lib/despacho';
import type { DatosPago } from '@/lib/pago';

/* Carrito — una sola página, como la de Ulloa: los datos a la izquierda y el
   pedido a la derecha, editable ahí mismo. Antes había una página intermedia
   (el "pre carrito") entre el producto y esta; ahora esa pregunta la hace el
   aviso que aparece al agregar (AgregadoAlCarrito).

   Sigue el lenguaje de la ficha de producto: etiquetas en mayúsculas con
   interletrado ancho, opciones como botones con borde, blanco de marca. */

type Campo = 'nombre' | 'correo' | 'telefono' | 'comuna' | 'comunaOtra' | 'direccion' | 'protocolo';

interface Confirmado {
  numero: string; total: number; despachoACoordinar: boolean;
  correo: string; correoEnviado: boolean;
  // Para el mensaje de WhatsApp: el carrito se vacía al confirmar, así que
  // lo que se pidió hay que guardarlo antes de que desaparezca.
  nombre: string; comuna: string; resumen: string;
  pago: DatosPago | null;
}
interface Ubicacion { lat: number; lon: number; comuna: string; etiqueta: string }

/** Recuadro del mapa alrededor del punto: alcanza para reconocer la cuadra. */
function recuadro(lat: number, lon: number): string {
  return [lon - 0.006, lat - 0.004, lon + 0.006, lat + 0.004].map((n) => n.toFixed(5)).join(',');
}

const mono = { fontFamily: "'Courier New', Courier, monospace" };

/** Los datos para transferir, con todo junto a un toque de distancia. */
function DatosTransferencia({ pago, numero, total }: { pago: DatosPago; numero: string; total: number }) {
  const [copiado, setCopiado] = useState(false);

  const texto = [
    pago.titular, pago.rut, `${pago.banco} · ${pago.tipo}`, pago.numero, pago.correo,
    `Pedido ${numero} · ${formatCLP(total)}`,
  ].join('\n');

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Sin permiso para copiar (o navegador antiguo): los datos igual están
      // escritos arriba, así que no se avisa de nada.
    }
  }

  const filas = [
    ['Titular', pago.titular],
    ['RUT', pago.rut],
    ['Banco', pago.banco],
    ['Cuenta', pago.tipo],
    ['Número', pago.numero],
    ['Correo', pago.correo],
  ];

  return (
    <section className="mt-9 rounded-xl border border-white/15 p-6 text-left max-[520px]:p-5" aria-label="Datos para transferir">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[10px] font-semibold uppercase tracking-[2px] text-preps-white">Cómo pagar</p>
        <button type="button" onClick={copiar}
          className="text-[10px] font-semibold uppercase tracking-[2px] text-white/55 transition-colors hover:text-preps-white">
          {copiado ? '¡Copiado!' : 'Copiar datos'}
        </button>
      </div>

      <dl className="mt-5 space-y-2.5">
        {filas.map(([etq, valor]) => (
          <div key={etq} className="flex items-baseline justify-between gap-4 text-xs">
            <dt className="uppercase tracking-[1.5px] text-white/45">{etq}</dt>
            <dd className={clsx('text-right', etq === 'Número' && 'text-sm')} style={etq === 'Número' ? mono : undefined}>
              {valor}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-5 border-t border-white/15 pt-4 text-center text-xs leading-relaxed text-white/65">
        Transfiere <strong className="font-semibold text-preps-white">{formatCLP(total)}</strong> y escribe{' '}
        <strong className="font-semibold text-preps-white">{numero}</strong> en el mensaje de la transferencia.
      </p>
    </section>
  );
}
const etiqueta = 'block text-[10px] font-semibold uppercase tracking-[2px] text-white/55';
const campo =
  'mt-2.5 w-full rounded-lg border border-white/20 bg-transparent px-4 py-3.5 text-sm text-preps-white ' +
  'placeholder:text-white/30 transition-colors duration-200 focus:border-white focus:outline-none ' +
  'aria-[invalid=true]:border-red-300/70';
const botonPrimario =
  'flex w-full items-center justify-center gap-3 rounded-full bg-preps-white px-6 py-5 text-[11px] font-bold uppercase ' +
  'tracking-[2px] text-preps-bg transition-opacity duration-200 hover:opacity-90';

export default function CarritoPage() {
  const cart = useMealCart();
  const suplementos = useCarrito();
  const [verSuplementos, setVerSuplementos] = useState(false);

  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [comuna, setComuna] = useState('');
  const [comunaOtra, setComunaOtra] = useState('');
  const [direccion, setDireccion] = useState('');
  const [detalle, setDetalle] = useState('');
  const [notas, setNotas] = useState('');
  const [protocolo, setProtocolo] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<{ campo?: Campo; mensaje: string } | null>(null);
  const [listo, setListo] = useState<Confirmado | null>(null);

  const refs = {
    nombre: useRef<HTMLInputElement>(null),
    correo: useRef<HTMLInputElement>(null),
    telefono: useRef<HTMLInputElement>(null),
    comuna: useRef<HTMLDivElement>(null),
    comunaOtra: useRef<HTMLInputElement>(null),
    direccion: useRef<HTMLInputElement>(null),
    protocolo: useRef<HTMLInputElement>(null),
  };

  /* En el carrito conviven packs de los menús y platos del configurador. Cada
     línea se describe una vez acá y el resto de la página usa eso, sin volver
     a preguntar de qué clase es. */
  const lineas = cart.items.map((item) => {
    if (esLab(item)) {
      const receta = recetaDe(item);
      return {
        item,
        titulo: `Custom Lab · ${nombreProtocolo(receta)}`,
        detalle: `${item.cantidad} comidas · ${item.pollo}g pollo · ${item.arroz}g arroz · ${item.brocoli}g brócoli · ${item.pimienta ? 'con' : 'sin'} pimienta`,
        imagen: fotoReceta(receta),
        enlace: '/personalizar/lab',
        precio: precioLinea(item),
      };
    }
    const v = VARIANTES.find((x) => x.slug === item.variante)!;
    return {
      item,
      titulo: v.nombre,
      detalle: `${item.unidades} comidas · ${item.pimienta ? 'con' : 'sin'} pimienta`,
      imagen: v.imagen,
      enlace: `/personalizar/${v.slug}`,
      precio: precioLinea(item),
    };
  });
  const packs = cart.items.reduce((s, i) => s + (esLab(i) ? 0 : i.cantidad), 0);
  const comidas = cart.items.reduce((s, i) => s + comidasLinea(i), 0);
  const subtotal = lineas.reduce((s, l) => s + l.precio, 0);
  const esOtra = comuna === OTRA_COMUNA;
  const despacho = comuna && !esOtra ? calcularDespacho(comuna) : null;
  const total = subtotal + (despacho?.costo ?? 0);

  // ── Mapa ──────────────────────────────────────────────────────
  // Como en Ulloa: confirma que la dirección existe y dónde queda. Es
  // ayuda, no requisito; si no la encuentra, el pedido sigue igual.
  const comunaEscrita = esOtra ? comunaOtra.trim() : comuna;
  const consultaMapa = comunaEscrita.length >= 2 && direccion.trim().length >= 5
    ? `direccion=${encodeURIComponent(direccion.trim())}&comuna=${encodeURIComponent(comunaEscrita)}`
    : '';
  // El resultado se guarda con la consulta que lo produjo: apenas cambia lo
  // escrito, el mapa viejo deja de mostrarse solo.
  const [mapa, setMapa] = useState<{ consulta: string; ubicacion: Ubicacion | null } | null>(null);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    if (!consultaMapa) return;
    let vigente = true;
    // Se busca cuando deja de escribir, no en cada tecla: el servicio es
    // gratuito y hay que usarlo con cuidado.
    const t = setTimeout(async () => {
      setBuscando(true);
      try {
        const d = await fetch(`/api/ubicar?${consultaMapa}`).then((r) => r.json());
        if (vigente) setMapa({ consulta: consultaMapa, ubicacion: d?.ok ? d : null });
      } catch {
        if (vigente) setMapa({ consulta: consultaMapa, ubicacion: null });
      } finally {
        if (vigente) setBuscando(false);
      }
    }, 900);
    return () => { vigente = false; clearTimeout(t); setBuscando(false); };
  }, [consultaMapa]);

  /* Si la semana está cerrada, el panel lo dice y acá se muestra antes de
     que alguien llene el formulario. El rechazo de verdad lo hace el panel
     cuando llega el pedido: esto es para no hacer perder el tiempo. */
  const [cerrado, setCerrado] = useState<{ mensaje: string } | null>(null);
  useEffect(() => {
    let vigente = true;
    fetch('/api/estado-pedidos')
      .then((r) => r.json())
      .then((e) => { if (vigente && e?.abierto === false) setCerrado({ mensaje: String(e.mensaje ?? '') }); })
      .catch(() => {});
    return () => { vigente = false; };
  }, []);

  const resultadoMapa = mapa?.consulta === consultaMapa ? mapa : null;
  const ubicacion = resultadoMapa?.ubicacion ?? null;
  /* El mapa ubicó la dirección en otra comuna. Puede ser un error al elegir
     o una calle que se repite en varias comunas, así que se ofrece el cambio
     en vez de hacerlo solo: si cambia la comuna cambia el despacho, y eso no
     se toca a espaldas de nadie. */
  const sugerencia = ubicacion?.comuna && normalizarComuna(ubicacion.comuna) !== normalizarComuna(comunaEscrita)
    ? ubicacion.comuna : '';
  const sugerenciaCubierta = sugerencia ? comunaCubierta(sugerencia) : undefined;
  function usarSugerencia() {
    if (sugerenciaCubierta) {
      setComuna(sugerenciaCubierta.comuna);
    } else {
      setComuna(OTRA_COMUNA);
      setComunaOtra(sugerencia);
    }
  }

  /** Lo mismo que valida el servidor, para marcar el campo sin ir y volver. */
  function validar(): { campo: Campo; mensaje: string } | null {
    if (nombre.trim().length < 2) return { campo: 'nombre', mensaje: 'Escribe tu nombre.' };
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(correo.trim())) return { campo: 'correo', mensaje: 'Revisa el correo.' };
    const d = telefono.replace(/\D/g, '');
    if (!/^9\d{8}$/.test(d.startsWith('56') ? d.slice(2) : d)) {
      return { campo: 'telefono', mensaje: 'Revisa el celular: 9 dígitos, empezando con 9.' };
    }
    if (!comuna) return { campo: 'comuna', mensaje: 'Elige tu comuna.' };
    if (esOtra && comunaOtra.trim().length < 2) return { campo: 'comunaOtra', mensaje: 'Escribe tu comuna.' };
    if (direccion.trim().length < 5) return { campo: 'direccion', mensaje: 'Escribe tu dirección.' };
    if (!protocolo) return { campo: 'protocolo', mensaje: 'Acepta el protocolo de operación para continuar.' };
    return null;
  }

  async function confirmar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;

    const falla = validar();
    if (falla) {
      setError(falla);
      refs[falla.campo].current?.focus();
      return;
    }

    setEnviando(true);
    setError(null);
    try {
      const r = await fetch('/api/pedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre, correo, telefono, comuna, comunaOtra, direccion, detalle, notas, protocolo,
          // El servidor revalida y vuelve a poner los precios: esto es lo
          // que se pidió, no lo que cuesta.
          items: cart.items,
        }),
      });
      const cuerpo = await r.json().catch(() => null);
      if (!r.ok || !cuerpo?.ok) {
        setError({ mensaje: cuerpo?.error ?? 'No pudimos registrar tu pedido. Inténtalo de nuevo.' });
        return;
      }
      setListo({
        numero: cuerpo.numero,
        total: cuerpo.total,
        despachoACoordinar: cuerpo.despachoACoordinar,
        correo,
        correoEnviado: cuerpo.correoEnviado === true,
        nombre: nombre.trim(),
        comuna: comunaEscrita,
        resumen: lineas.map((l) => `${l.titulo} (${l.detalle})`).join('; '),
        pago: cuerpo.pago ?? null,
      });
      cart.vaciar();
      window.scrollTo({ top: 0 });
    } catch {
      setError({ mensaje: 'Sin conexión. Revisa tu internet e inténtalo de nuevo.' });
    } finally {
      setEnviando(false);
    }
  }

  const botonSuplementos = suplementos.items.length > 0 && (
    <button type="button" onClick={() => setVerSuplementos(true)}
      className="text-[10px] font-semibold uppercase tracking-[2px] text-white/55 transition-colors hover:text-preps-white">
      Ver mi carrito de suplementos ({suplementos.unidades}) →
    </button>
  );

  // ── Suplementos ───────────────────────────────────────────────
  if (verSuplementos) {
    return (
      <>
        <button onClick={() => setVerSuplementos(false)}
          className="fixed right-[18px] top-[18px] z-[100] rounded-full bg-white/[.08] px-4 py-2.5 text-preps-white">
          ← Volver a meal preps
        </button>
        <CarritoSuplementos />
      </>
    );
  }

  // ── Pedido registrado ─────────────────────────────────────────
  if (listo) {
    /* Fuera de la zona de reparto no se cierra la venta en la web: el pedido
       queda anotado y se sigue por WhatsApp, que es donde se puede acordar
       cómo llega y cuánto cuesta. Por eso el mensaje lleva el detalle: la
       conversación empieza con todo a la vista y sin volver a preguntarlo. */
    const mensaje = listo.despachoACoordinar
      ? `Hola PREPS, hice el pedido ${listo.numero} en la web. Soy ${listo.nombre}, de ${listo.comuna}, que está fuera de la zona de reparto. Llevo ${listo.resumen}: ${formatCLP(listo.total)} más el despacho. ¿Cómo lo coordinamos?`
      : listo.pago
        ? `Hola PREPS, hice el pedido ${listo.numero} por ${formatCLP(listo.total)}. Acá va el comprobante de la transferencia.`
        : `Hola PREPS, acabo de hacer el pedido ${listo.numero} en la web. ¿Me confirman el cupo y el pago?`;
    return (
      <PaginaConRail ancho={640} centrarConRail>
        <section className="py-10 text-center" aria-live="polite">
          <p className={etiqueta}>{listo.despachoACoordinar ? 'Pedido por coordinar' : 'Pedido recibido'}</p>
          {/* Blanco pleno, sin el degradado metálico de los h1 (ver
              .pedido-numero en globals.css): es el dato que la persona tiene
              que leer, anotar o capturar, no un titular. */}
          <h1 className="pedido-numero mt-5 text-[34px] font-extrabold uppercase leading-none tracking-[-1.5px] max-[520px]:text-[26px]">
            {listo.numero}
          </h1>
          <p className="mt-6 text-3xl font-semibold tracking-[-1px]" style={mono}>
            {formatCLP(listo.total)}
          </p>
          {listo.despachoACoordinar && (
            <p className="mt-2 text-xs text-white/45">+ despacho a coordinar</p>
          )}
          <p className="mx-auto mt-8 max-w-sm text-sm leading-relaxed text-white/65">
            {listo.despachoACoordinar
              ? `Todavía no llegamos a ${listo.comuna}, así que este pedido no queda cerrado: escríbenos por WhatsApp y vemos cómo hacértelo llegar y cuánto sale el despacho. El mensaje ya va escrito con tu pedido.`
              : listo.pago
                ? 'Transfiere el total y mándanos el comprobante por WhatsApp. Ahí mismo te confirmamos el cupo de la semana.'
                : 'Te escribimos por WhatsApp para confirmar tu cupo de la semana y coordinar el pago.'}
          </p>

          {/* Los datos quedan a la vista y en un botón: en el teléfono, copiar
              un número de cuenta a mano es donde la gente se equivoca o se
              aburre. El número de pedido va en el mensaje de la transferencia
              para poder calzarla después sin preguntar. */}
          {listo.pago && <DatosTransferencia pago={listo.pago} numero={listo.numero} total={listo.total} />}
          {/* Solo si el correo salió de verdad: prometer uno que no llegó deja
              a la persona esperando y revisando el spam. */}
          {listo.correoEnviado && (
            <p className="mx-auto mt-3 max-w-sm text-xs leading-relaxed text-white/45">
              Te mandamos el detalle a {listo.correo}.
            </p>
          )}
          <a
            href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={clsx(botonPrimario, 'mt-9')}
          >
            {listo.pago ? 'Enviar comprobante' : <>Escribir por WhatsApp <span aria-hidden>→</span></>}
          </a>
          <Link href="/" className="mt-6 inline-block text-[10px] font-semibold uppercase tracking-[2px] text-white/45 transition-colors hover:text-preps-white">
            Volver al inicio
          </Link>
        </section>
      </PaginaConRail>
    );
  }

  // ── Carrito vacío ─────────────────────────────────────────────
  // Vacío es no tener líneas. Mirar solo los packs dejaba fuera un carrito
  // con puros platos del configurador, que se veía vacío teniendo cosas.
  if (cart.ready && cart.items.length === 0) {
    return (
      <PaginaConRail ancho={640} centrarConRail>
        <section className="py-16 text-center">
          <h1 className="headline-metal text-[34px] font-bold uppercase leading-none tracking-[-1.26px] max-[520px]:text-[28px]">
            Tu carrito está vacío
          </h1>
          <p className="mt-5 text-sm text-white/55">Elige un menú y vuelve para completar tu pedido.</p>
          {/* El mismo "Ver meal preps" del inicio y del catálogo. */}
          <Link href="/personalizar" className="mt-9 inline-block rounded-full border border-white/25 px-7 py-3.5 text-[10px] font-bold uppercase tracking-[.2em] transition-colors hover:border-white/60">
            Ver meal preps
          </Link>
          {botonSuplementos && <div className="mt-8">{botonSuplementos}</div>}
        </section>
      </PaginaConRail>
    );
  }

  // ── Carrito + datos ───────────────────────────────────────────
  const invalido = (c: Campo) => error?.campo === c || undefined;

  return (
    <PaginaConRail ancho={960} centrarConRail>
      <Link href="/personalizar" className="inline-block text-[10px] font-semibold uppercase tracking-[2px] text-white/55 transition-colors hover:text-preps-white">
        ← Seguir en el catálogo
      </Link>
      <h1 className="headline-metal mt-8 text-[34px] font-bold uppercase leading-none tracking-[-1.26px] max-[520px]:text-[28px]">
        Completar pedido
      </h1>

      {cerrado && (
        <div className="mt-6 rounded-xl border border-[#FFC93C]/30 bg-[#FFC93C]/[.06] px-5 py-4" role="status">
          <p className="text-[10px] font-semibold uppercase tracking-[2px] text-[#FFC93C]">Pedidos cerrados</p>
          <p className="mt-2 text-sm leading-relaxed text-white/75">
            {cerrado.mensaje || 'Por ahora no estamos tomando pedidos nuevos. Tu selección queda guardada en el carrito.'}
          </p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent('Hola PREPS, quiero pedir cuando vuelvan a abrir. ¿Me avisan?')}`}
            target="_blank" rel="noopener noreferrer"
            className="mt-3 inline-block text-[10px] font-semibold uppercase tracking-[2px] text-[#FFC93C] transition-colors hover:text-preps-white"
          >
            Avísame cuando abran →
          </a>
        </div>
      )}

      <form onSubmit={confirmar} noValidate className="mt-10 grid grid-cols-[minmax(0,1fr)_340px] items-start gap-14 max-[860px]:grid-cols-1 max-[860px]:gap-10">
        <div className="space-y-10">
          {/* ── Contacto ───────────────────────── */}
          <fieldset className="space-y-5">
            <legend className="mb-5 text-[10px] font-semibold uppercase tracking-[2px] text-preps-white">01 · Contacto</legend>
            <label className="block">
              <span className={etiqueta}>Nombre y apellido</span>
              <input ref={refs.nombre} className={campo} value={nombre} onChange={(e) => setNombre(e.target.value)}
                autoComplete="name" maxLength={80} aria-invalid={invalido('nombre')} />
            </label>
            <div className="grid grid-cols-2 gap-4 max-[520px]:grid-cols-1">
              <label className="block">
                <span className={etiqueta}>Correo</span>
                <input ref={refs.correo} className={campo} value={correo} onChange={(e) => setCorreo(e.target.value)}
                  type="email" inputMode="email" autoComplete="email" maxLength={254} aria-invalid={invalido('correo')} />
              </label>
              <label className="block">
                <span className={etiqueta}>Celular (WhatsApp)</span>
                <input ref={refs.telefono} className={campo} value={telefono} onChange={(e) => setTelefono(e.target.value)}
                  type="tel" inputMode="tel" autoComplete="tel" placeholder="9 1234 5678" maxLength={16} aria-invalid={invalido('telefono')} />
              </label>
            </div>
          </fieldset>

          {/* ── Entrega ────────────────────────── */}
          <fieldset className="space-y-5">
            <legend className="mb-5 text-[10px] font-semibold uppercase tracking-[2px] text-preps-white">02 · Entrega</legend>
            <div>
              <span className={etiqueta} id="comuna-label">Comuna</span>
              {/* Botones y no <select>: son siete opciones y el precio tiene que
                  verse antes de elegir, no después. */}
              <div ref={refs.comuna} tabIndex={-1} role="radiogroup" aria-labelledby="comuna-label"
                className="mt-2.5 grid grid-cols-3 gap-2 focus:outline-none max-[520px]:grid-cols-2">
                {COMUNAS_CUBIERTAS.map((c) => (
                  <button key={c.comuna} type="button" role="radio" aria-checked={comuna === c.comuna}
                    onClick={() => setComuna(c.comuna)}
                    className={clsx(
                      'rounded-lg border px-3 py-3.5 text-left transition-colors duration-200',
                      comuna === c.comuna ? 'border-white bg-white/10' : 'border-white/20 hover:border-white',
                      error?.campo === 'comuna' && 'border-red-300/70'
                    )}>
                    <span className="block text-[11px] font-semibold uppercase tracking-[1px]">{c.comuna}</span>
                    <span className="mt-1 block text-xs text-white/50">{formatCLP(c.costo)}</span>
                  </button>
                ))}
                <button type="button" role="radio" aria-checked={esOtra} onClick={() => setComuna(OTRA_COMUNA)}
                  className={clsx(
                    'col-span-3 rounded-lg border px-3 py-3.5 text-left transition-colors duration-200 max-[520px]:col-span-2',
                    esOtra ? 'border-white bg-white/10' : 'border-white/20 hover:border-white',
                    error?.campo === 'comuna' && 'border-red-300/70'
                  )}>
                  <span className="block text-[11px] font-semibold uppercase tracking-[1px]">Otra comuna</span>
                  <span className="mt-1 block text-xs text-white/50">Despacho a coordinar</span>
                </button>
              </div>
            </div>

            {esOtra && (
              <label className="block">
                <span className={etiqueta}>¿Cuál?</span>
                <input ref={refs.comunaOtra} className={campo} value={comunaOtra} onChange={(e) => setComunaOtra(e.target.value)}
                  autoComplete="address-level2" maxLength={60} aria-invalid={invalido('comunaOtra')} />
                <span className="mt-2 block text-xs leading-relaxed text-white/45">
                  Está fuera de la zona de reparto. Recibimos tu pedido igual y el despacho lo acordamos por WhatsApp.
                </span>
              </label>
            )}

            <label className="block">
              <span className={etiqueta}>Dirección</span>
              <input ref={refs.direccion} className={campo} value={direccion} onChange={(e) => setDireccion(e.target.value)}
                autoComplete="street-address" placeholder="Calle y número" maxLength={160} aria-invalid={invalido('direccion')} />
            </label>

            {consultaMapa && (buscando && !resultadoMapa ? (
              <p className="text-xs text-white/45" aria-live="polite">Buscando la dirección en el mapa…</p>
            ) : ubicacion ? (
              <div>
                {/* OpenStreetMap pasado a negro (.mapa-oscuro). No se puede
                    arrastrar: el punto va fijo al centro y, si el mapa se
                    moviera, dejaría de marcar la dirección.

                    El iframe sobra 48px por cada lado: así quedan fuera los
                    botones de zoom (que sin arrastre no sirven) y la barra de
                    créditos, que en celular ocupaba dos líneas sobre el mapa.
                    Se recorta parejo para que el centro, donde va el punto,
                    no se mueva. El crédito, que la licencia exige, va abajo. */}
                <div className="relative h-[210px] overflow-hidden rounded-lg border border-white/15 bg-[#0b0b0b]">
                  <iframe
                    key={`${ubicacion.lat},${ubicacion.lon}`}
                    title={`Mapa: ${ubicacion.etiqueta}`}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${recuadro(ubicacion.lat, ubicacion.lon)}&layer=mapnik`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    tabIndex={-1}
                    className="mapa-oscuro pointer-events-none absolute -left-12 -top-12 h-[calc(100%+96px)] w-[calc(100%+96px)] border-0"
                  />
                  <span aria-hidden className="mapa-pin" />
                </div>
                <div className="mt-2 flex items-baseline justify-between gap-4 text-xs text-white/45">
                  <p className="min-w-0">{ubicacion.etiqueta}</p>
                  <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer"
                    className="shrink-0 text-[10px] text-white/30 transition-colors hover:text-white/60">
                    © OpenStreetMap
                  </a>
                </div>
                {sugerencia && (
                  <div className="mt-3 rounded-lg border border-[#FFC93C]/30 bg-[#FFC93C]/[.06] px-4 py-3 text-xs leading-relaxed text-white/75">
                    El mapa ubica esa dirección en <strong className="font-semibold text-preps-white">{sugerencia}</strong>
                    {sugerenciaCubierta ? ` (despacho ${formatCLP(sugerenciaCubierta.costo)}).` : ', fuera de la zona de reparto.'}
                    <button type="button" onClick={usarSugerencia}
                      className="mt-2 block text-[10px] font-semibold uppercase tracking-[2px] text-[#FFC93C] transition-colors hover:text-preps-white">
                      Usar {sugerencia}
                    </button>
                  </div>
                )}
              </div>
            ) : resultadoMapa ? (
              <p className="text-xs leading-relaxed text-white/45">
                No pudimos ubicar esa dirección en el mapa. Igual puedes seguir: la confirmamos contigo por WhatsApp.
              </p>
            ) : null)}
            <label className="block">
              <span className={etiqueta}>Depto, casa u oficina · opcional</span>
              <input className={campo} value={detalle} onChange={(e) => setDetalle(e.target.value)}
                autoComplete="address-line2" maxLength={120} />
            </label>
            <p className="text-xs text-white/45">Entregamos los lunes por la mañana.</p>
          </fieldset>

          {/* ── Notas ──────────────────────────── */}
          <label className="block">
            <span className={etiqueta}>Notas · opcional</span>
            <textarea className={clsx(campo, 'min-h-[96px] resize-y')} value={notas}
              onChange={(e) => setNotas(e.target.value)} maxLength={300}
              placeholder="Alergias, indicaciones para la entrega…" />
          </label>
        </div>

        {/* ── Columna del pedido ───────────────────
            En escritorio es una sola tarjeta fija a la derecha. En celular la
            tarjeta se deshace (contents) y sus dos partes se reparten: lo que
            llevas arriba de todo, para ver qué compras apenas entras, y el
            total con el botón al final, después de los datos. */}
        <div className="rounded-xl border border-white/15 min-[861px]:sticky min-[861px]:top-8 max-[860px]:contents">
          <section aria-label="Tu pedido" className="p-6 pb-2 max-[860px]:order-first max-[860px]:rounded-xl max-[860px]:border max-[860px]:border-white/15 max-[860px]:p-5 max-[860px]:pb-1">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[2px] text-preps-white">Tu pedido</p>
              {cart.ready && (
                <p className="text-[10px] uppercase tracking-[1.5px] text-white/45">
                  {packs > 0 && `${packs} ${packs === 1 ? 'pack' : 'packs'} · `}{comidas} comidas
                </p>
              )}
            </div>

            <ul className="mt-4">
              {lineas.map(({ item, titulo, detalle, imagen, enlace, precio }) => {
                const lab = esLab(item);
                // Los platos del lab se cuentan por comidas y los packs por
                // packs: cada uno tiene su tope y su forma de nombrarse.
                const unidad = lab ? 'comida' : 'pack';
                const tope = lab ? item.cantidad >= CANTIDAD_MAXIMA : packs >= MAX_PACKS;
                return (
                  <li key={item.id} className="flex gap-3.5 border-b border-white/10 py-4 first:pt-1">
                    <Link href={enlace} className="relative aspect-[3/2] w-[72px] shrink-0 self-start overflow-hidden rounded-lg bg-white/[.04]">
                      <Image src={imagen} alt={titulo} fill sizes="72px" className="object-cover" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-[13px] font-bold uppercase tracking-[-.01em]">{titulo}</p>
                        <p className="shrink-0 text-[13px] font-semibold" style={mono}>{formatCLP(precio)}</p>
                      </div>
                      <p className="mt-0.5 text-[10px] uppercase tracking-[1px] text-white/45">{detalle}</p>
                      {lab && item.etiqueta && (
                        <p className="mt-0.5 text-[10px] uppercase tracking-[1px] text-white/45">
                          Etiqueta: {item.etiqueta}
                        </p>
                      )}
                      <div className="mt-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center rounded-full border border-white/15">
                          <button type="button" onClick={() => cart.cantidad(item.id, item.cantidad - 1)}
                            aria-label={`Quitar ${unidad} de ${titulo}`}
                            className="grid h-8 w-8 place-items-center rounded-full text-white/60 transition-colors hover:text-preps-white">
                            −
                          </button>
                          <span className="w-7 text-center text-xs tabular-nums">{item.cantidad}</span>
                          <button type="button" onClick={() => cart.cantidad(item.id, item.cantidad + 1)}
                            aria-label={`Agregar ${unidad} de ${titulo}`} disabled={tope}
                            className="grid h-8 w-8 place-items-center rounded-full text-white/60 transition-colors hover:text-preps-white disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:text-white/60">
                            +
                          </button>
                        </div>
                        <button type="button" onClick={() => cart.quitar(item.id)} aria-label={`Eliminar ${titulo}`}
                          className="py-1 text-[10px] uppercase tracking-[1.5px] text-white/40 transition-colors hover:text-preps-white">
                          Quitar
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4">
              {packs < MAX_PACKS ? (
                <Link href="/personalizar" className="text-[10px] font-semibold uppercase tracking-[2px] text-white/55 transition-colors hover:text-preps-white">
                  + Agregar otro menú
                </Link>
              ) : (
                <p className="text-[10px] uppercase tracking-[1.5px] text-white/45">Máximo 5 packs por semana</p>
              )}
              {botonSuplementos}
            </div>
            {cart.error && <p role="alert" className="pb-3 text-xs text-red-300">{cart.error}</p>}
          </section>

          <section aria-label="Total" className="border-t border-white/15 p-6 pt-5 max-[860px]:rounded-xl max-[860px]:border max-[860px]:p-5">
            <dl className="space-y-3 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="uppercase tracking-[1.5px] text-white/55">Subtotal</dt>
                <dd>{formatCLP(subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="uppercase tracking-[1.5px] text-white/55">Despacho</dt>
                <dd>{despacho ? formatCLP(despacho.costo) : esOtra ? 'A coordinar' : 'Elige tu comuna'}</dd>
              </div>
            </dl>
            <div className="mt-5 flex items-baseline justify-between gap-3 border-t border-white/15 pt-5">
              <span className="text-[10px] font-semibold uppercase tracking-[2px] text-white/55">Total</span>
              <strong className="text-2xl font-semibold tracking-[-1px]" style={mono} aria-live="polite">
                {formatCLP(total)}
              </strong>
            </div>

            <label className="mt-6 flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-white/65">
              <input ref={refs.protocolo} type="checkbox" checked={protocolo} onChange={(e) => setProtocolo(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-preps-white" aria-invalid={invalido('protocolo')} />
              <span>
                Leí y acepto el{' '}
                <Link href="/protocolo" target="_blank" className="text-preps-white underline underline-offset-4">protocolo de operación</Link>.
              </span>
            </label>

            {/* Fuera de la zona de reparto no se vende en la web: el botón dice
                lo que va a pasar de verdad, que es abrir la conversación. */}
            {esOtra && (
              <p className="mt-5 rounded-lg border border-[#FFC93C]/30 bg-[#FFC93C]/[.06] px-4 py-3 text-xs leading-relaxed text-white/75">
                Todavía no repartimos en tu comuna, así que este pedido no se cierra acá:
                queda anotado y seguimos por WhatsApp, donde vemos cómo te llega y cuánto sale el despacho.
              </p>
            )}

            <button type="submit" disabled={enviando || !cart.ready || !!cerrado}
              className={clsx(botonPrimario, 'mt-6 disabled:cursor-default disabled:opacity-50')}>
              {cerrado ? 'Pedidos cerrados' : enviando ? 'Enviando…' : esOtra
                ? <>Coordinar por WhatsApp <span aria-hidden>→</span></>
                : <>Confirmar pedido <span aria-hidden>→</span></>}
            </button>

            <p role="alert" className="mt-3 min-h-[18px] text-xs leading-relaxed text-red-300">{error?.mensaje ?? ''}</p>
            <p className="text-center text-xs leading-relaxed text-white/45">
              Al confirmar te mostramos los datos para transferir.
            </p>
          </section>
        </div>
      </form>
    </PaginaConRail>
  );
}
