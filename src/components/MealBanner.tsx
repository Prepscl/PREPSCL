'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function MealBanner() {
  const [loaded, setLoaded] = useState(false);
  const [entry, setEntry] = useState(0);

  return (
    <section key={entry} className={`meal-banner${loaded ? ' meal-banner--ready' : ''}`} aria-labelledby="meal-banner-title">
      <div className="meal-banner-top">
        <span>Meal preps / Comida real</span>
        <button type="button" className="meal-banner-replay" onClick={() => setEntry(value => value + 1)}>Repetir entrada ↻</button>
      </div>
      <div className="meal-banner-scene">
        <h1 id="meal-banner-title" className="meal-banner-title"><span>Come bien.</span><span>Rinde más.</span></h1>
        <div className="meal-banner-visual">
          <Image src="/img/hero-preps-empaque-1194.png" alt="Envase PREPS sellado, con tapa transparente y etiqueta Power Breast" fill priority sizes="(max-width: 700px) 130vw, 1100px" quality={90} className="meal-banner-photo" onLoad={() => setLoaded(true)} onError={() => setLoaded(true)} />
        </div>
      </div>
      <a href="#menus" className="meal-banner-cta">Elige tu meal prep <span aria-hidden="true">↘</span></a>
    </section>
  );
}
