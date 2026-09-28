'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './catalogo.module.css';

export default function MenuCarousel({ children, className }: { children: ReactNode; className?: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const [position, setPosition] = useState({ current: 1, total: 3 });

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const sync = () => {
      const start = el.scrollLeft < 2;
      const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
      const step = (el.firstElementChild as HTMLElement)?.offsetWidth + 60;
      setEdges({ start, end });
      setPosition({ current: start ? 1 : end ? el.children.length : Math.min(el.children.length, Math.round(el.scrollLeft / step) + 1), total: el.children.length });
    };
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    el.addEventListener('scroll', sync, { passive: true });
    sync();
    return () => { observer.disconnect(); el.removeEventListener('scroll', sync); };
  }, []);

  function move(direction: number) {
    const el = track.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const distance = card ? card.offsetWidth + parseFloat(getComputedStyle(el).columnGap) : el.clientWidth;
    el.scrollBy({ left: direction * distance, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  return (
    <section className={`${styles.carousel} ${className ?? ''}`} aria-label="Nuestros menús" aria-roledescription="carrusel">
      <div ref={track} id="menu-carousel" className={styles.catalog} tabIndex={0} aria-label="Desliza para explorar los menús">
        {children}
      </div>
      <div className={styles.controls}>
        <button type="button" aria-label="Menú anterior" aria-controls="menu-carousel" disabled={edges.start} onClick={() => move(-1)}>❮</button>
        <span className={styles.counter} aria-live="polite" aria-atomic="true">{position.current} / {position.total}</span>
        <button type="button" aria-label="Menú siguiente" aria-controls="menu-carousel" disabled={edges.end} onClick={() => move(1)}>❯</button>
      </div>
    </section>
  );
}
