'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * Landing de los códigos QR de tarjetas y afiches.
 *
 * Los QR ya están impresos y circulando, así que esta ruta y el redirect desde
 * /access.html no se tocan: si dejan de resolver, el material impreso queda
 * muerto y no hay forma de corregirlo.
 */
const MANIFIESTO = [
  'El tiempo es el recurso más escaso.',
  '',
  'La mayoría lo pierde.',
  'Pocos lo optimizan.',
  '',
  'Hemos diseñado la herramienta',
  'para tu rendimiento definitivo.',
];

const TEXTO_PLANO = MANIFIESTO.join('\n');
const VELOCIDAD_MS = 60;

export default function AccessPage() {
  const [escrito, setEscrito] = useState(0);
  const [saltarAnimacion, setSaltarAnimacion] = useState(false);

  useEffect(() => {
    // Quien pidió menos movimiento ve el texto completo de una.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setSaltarAnimacion(true);
      setEscrito(TEXTO_PLANO.length);
      return;
    }

    const id = setInterval(() => {
      setEscrito((n) => {
        if (n >= TEXTO_PLANO.length) {
          clearInterval(id);
          return n;
        }
        return n + 1;
      });
    }, VELOCIDAD_MS);

    return () => clearInterval(id);
  }, []);

  const listo = escrito >= TEXTO_PLANO.length;

  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center bg-black px-6 py-16 text-center text-white">
      <p
        className={`text-sm uppercase tracking-[4px] text-white/80 ${
          saltarAnimacion ? '' : 'animate-pulse'
        }`}
      >
        [ Status: encrypted ]
      </p>

      {/* El texto completo queda disponible para lectores de pantalla y para
          quien llegue sin JS; la animación es solo presentación. */}
      <span className="sr-only">{TEXTO_PLANO}</span>

      <p
        aria-hidden
        className="mt-12 min-h-[220px] max-w-[650px] whitespace-pre-line text-[22px] font-black uppercase leading-[1.6] tracking-[2px] max-[520px]:text-[17px]"
      >
        {TEXTO_PLANO.slice(0, escrito)}
        {!listo && (
          <span className="ml-1 inline-block h-5 w-2.5 translate-y-0.5 animate-blink bg-white align-middle" />
        )}
      </p>

      <Link
        href="/"
        className={`mt-10 border border-white px-12 py-5 text-base uppercase tracking-[5px] transition-[opacity,background,color] duration-700 hover:bg-white hover:text-black max-[520px]:px-8 max-[520px]:text-sm max-[520px]:tracking-[3px] ${
          listo ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        Ingresar al sistema
      </Link>

      <footer className="mt-20 flex flex-col items-center gap-4">
        <a
          href="https://www.instagram.com/prepscl/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] uppercase tracking-[3px] text-white/70 transition-opacity hover:opacity-100"
        >
          Instagram · @prepscl
        </a>
        <p className="text-[10px] uppercase tracking-[3px] text-white/70">PREPS since 2026</p>
      </footer>
    </main>
  );
}
