'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Rail from '@/components/Rail';

/**
 * El hero: la fotografia del meal prep abierto, sin tapa.
 *
 * Es la composicion original tal cual, sin retocar. Se intento rehacerla en
 * mayor resolucion trayendo el envase desde el original de 4515x3010, pero el
 * resplandor y el reflejo sinteticos no se integran igual: el envase quedaba
 * apoyado encima de la escena en vez de pertenecer a ella. La integracion pesa
 * mas que los pixeles.
 *
 * Lo unico que se le agrego es negro arriba y abajo hasta la proporcion 1.40,
 * para que object-fit: cover recorte ese relleno en las ventanas anchas y
 * nunca el envase, que llega a 32px del borde derecho.
 */
const HERO = '/img/hero-preps-abierto.webp';

export default function HomeHero() {
  const [ready, setReady] = useState(false);
  const [entry, setEntry] = useState(0);
  const [intro, setIntro] = useState(true);
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => {
      setIntro(false);
      setReady(true);
    }, reduced ? 0 : 1800);
    return () => window.clearTimeout(timer);
  }, [entry]);
  return (
    <main key={entry} className={`home-scene home-scene--native home-refined${ready ? ' home-refined--ready' : ''}`}>
      {intro && <div className="preps-entry-curtain" aria-hidden="true">
        <img src="/img/logo-preps.png" alt="" width="150" height="150" />
      </div>}
      <div className="home-camera">
        <div className="home-photo-reveal">
          <img
            src={HERO}
            alt="PREPS de pollo, arroz y brócoli"
            className="home-photo"
            fetchPriority="high"
            decoding="async"
          />
        </div>
      </div>
      <div className="home-scrim" aria-hidden="true" />
      <Rail onHomeClick={() => { setReady(false); setIntro(true); setEntry(value => value + 1); }} />
      <section className="home-copy" aria-labelledby="hero-title">
        <h1 id="hero-title" className="home-title" aria-label="Diseñado para tu rendimiento">
          {['Diseñado', 'para tu', 'rendimiento'].map((line, index) => (
            <span className={`home-title-mask home-title-mask--${index}`} key={line} aria-hidden="true">
              <span className="home-title-line headline-metal">{line}</span>
            </span>
          ))}
        </h1>
        <div className="home-cta-reveal">
          <Link className="mt-9 inline-flex min-h-12 items-center rounded-full border border-white/25 px-7 py-3.5 text-[10px] font-bold uppercase tracking-[.2em] transition-colors hover:border-white/60" href="/personalizar">
            Ver meal preps
          </Link>
        </div>
      </section>
    </main>
  );
}
