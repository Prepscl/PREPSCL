/* ════════════════════════════════════════════════════════════
   PREPS CHATBOT WIDGET — protocolo de operación
   ════════════════════════════════════════════════════════════ */
(function() {
  if (window.__PREPS_BOT__) return;
  window.__PREPS_BOT__ = true;

  const ACCENT = '#000000';
  const LOGO   = 'img/logo-preps.png';
  const WSP    = '56941892028';

  const SLIDES = [
    {
      eyebrow: '01 // VENTANAS DE PRODUCCIÓN',
      title: 'TIEMPOS DE PREPARACIÓN',
      body: `
        <div class="prp-rule">
          <span class="prp-tag">MIN 24 HRS</span>
          <div>
            <strong>PEDIDOS ESTÁNDAR</strong>
            Todos los pedidos de menos de 15 unidades requieren un mínimo de <b>24 horas</b> de antelación.
          </div>
        </div>
        <div class="prp-rule">
          <span class="prp-tag">36 - 48 HRS</span>
          <div>
            <strong>CARGAS VOLUMÉTRICAS</strong>
            Pedidos de <b>15 unidades o más</b> requieren de 2 a 3 días de antelación.
          </div>
        </div>
        <p class="prp-foot">* El conteo inicia tras la validación del pago vía WhatsApp.</p>
      `
    },
    {
      eyebrow: '02 // CADENA DE FRÍO',
      title: 'MANIPULACIÓN',
      body: `
        <div class="prp-rule">
          <span class="prp-tag">0°C — 5°C</span>
          <div>
            <strong>REFRIGERACIÓN</strong>
            Los productos PREPS son perecederos. Refrigerar inmediatamente tras la entrega o consumir en el momento.
          </div>
        </div>
        <div class="prp-rule">
          <span class="prp-tag">VIDA ÚTIL</span>
          <div>
            <strong>CONSUMO PREFERENTE</strong>
            <b>4 días</b> en refrigeración · <b>3 meses</b> congelado.
          </div>
        </div>
      `
    },
    {
      eyebrow: '03 // LOGÍSTICA',
      title: 'ENTREGAS Y RETIRO',
      body: `
        <div class="prp-rule">
          <span class="prp-tag">DELIVERY</span>
          <div>
            <strong>ZONA ORIENTE RM</strong>
            Providencia · Ñuñoa · La Reina · Las Condes · Vitacura · Lo Barnechea
          </div>
        </div>
        <div class="prp-rule">
          <span class="prp-tag">GRATIS</span>
          <div>
            <strong>ENVÍO SIN COSTO</strong>
            Con <b>5 menús o más</b> el envío es gratis. También podés <b>retirar</b> en local sin costo.
          </div>
        </div>
        <div class="prp-rule">
          <span class="prp-tag">FIN DE SEMANA</span>
          <div>
            <strong>SÁBADO Y DOMINGO</strong>
            Sujetos a carga mínima de 5 pedidos.
          </div>
        </div>
      `
    },
    {
      eyebrow: '04 // PAGO',
      title: 'VALIDACIÓN',
      body: `
        <div class="prp-rule">
          <span class="prp-tag">WHATSAPP</span>
          <div>
            <strong>COMPROBANTE</strong>
            Una vez generado el ticket, debes enviarlo por WhatsApp para validar tu pedido.
          </div>
        </div>
        <div class="prp-rule">
          <span class="prp-tag">ACTIVACIÓN</span>
          <div>
            <strong>INICIO DEL CONTEO</strong>
            El tiempo de preparación comienza cuando confirmamos tu pago.
          </div>
        </div>
      `
    }
  ];

  const style = document.createElement('style');
  style.textContent = `
    .prp-bubble { position: fixed; bottom: 24px; right: 24px; width: 52px; height: 52px; background: #fff; color: #000; border: 1px solid #000; border-radius: 50%; cursor: pointer; z-index: 9998; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 12px rgba(0,0,0,0.12); transition: all 0.2s ease; }
    .prp-bubble:hover { background: #000; color: #fff; transform: translateY(-2px); }
    .prp-bubble svg { width: 22px; height: 22px; stroke-width: 1.6; }
    .prp-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); z-index: 9999; display: none; align-items: center; justify-content: center; animation: prp-fadein 0.25s ease; padding: 20px; }
    .prp-modal.open { display: flex; }
    @keyframes prp-fadein { from { opacity: 0; } to { opacity: 1; } }
    .prp-card { width: 100%; max-width: 480px; max-height: 90vh; background: #f2f2f2; border: 1px solid #000; font-family: 'Courier New', Courier, monospace; text-transform: uppercase; color: #000; display: flex; flex-direction: column; overflow: hidden; position: relative; animation: prp-slide 0.4s cubic-bezier(0.17, 0.55, 0.55, 1); }
    @keyframes prp-slide { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    .prp-head { background: #000; color: #fff; padding: 18px 22px; display: flex; align-items: center; justify-content: space-between; gap: 12px; border-bottom: 1px solid #000; }
    .prp-head img { height: 22px; width: auto; display: block; filter: invert(1); }
    .prp-head .prp-status { font-family: 'Courier New', monospace; font-size: 9px; color: #888; letter-spacing: 0.3em; }
    .prp-close { position: absolute; top: 12px; right: 12px; background: transparent; border: none; color: #fff; font-size: 22px; cursor: pointer; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; }
    .prp-close:hover { color: #888; }
    .prp-body { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 0; position: relative; }
    .prp-body::-webkit-scrollbar { width: 4px; }
    .prp-body::-webkit-scrollbar-thumb { background: #000; }
    .prp-slide { padding: 30px 26px 24px; animation: prp-slidein 0.4s cubic-bezier(0.17, 0.55, 0.55, 1); }
    @keyframes prp-slidein { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
    .prp-eyebrow { font-size: 9px; letter-spacing: 0.4em; color: #888; margin-bottom: 8px; }
    .prp-title { font-family: 'Inter', sans-serif; font-weight: 900; font-size: 28px; letter-spacing: -1.2px; line-height: 1; margin-bottom: 24px; color: #000; }
    .prp-rule { display: flex; gap: 12px; padding: 14px 0; border-bottom: 1px solid #ddd; animation: prp-itemin 0.4s ease both; }
    .prp-rule:nth-child(1) { animation-delay: 0.05s; }
    .prp-rule:nth-child(2) { animation-delay: 0.12s; }
    .prp-rule:nth-child(3) { animation-delay: 0.18s; }
    .prp-rule:last-child { border-bottom: none; }
    @keyframes prp-itemin { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
    .prp-rule div { flex: 1; font-size: 11px; line-height: 1.55; color: #333; }
    .prp-rule strong { display: block; color: #000; font-size: 11px; letter-spacing: 1px; margin-bottom: 4px; }
    .prp-rule b { color: #fff; font-weight: 900; background: #000; padding: 0 4px; }
    .prp-tag { flex-shrink: 0; background: #000; color: #fff; font-family: 'Inter', sans-serif; font-weight: 900; font-size: 9px; letter-spacing: 1px; padding: 6px 8px; align-self: flex-start; min-width: 84px; text-align: center; }
    .prp-foot { font-size: 9px; color: #999; margin-top: 14px; letter-spacing: 1px; }
    .prp-nav { background: #000; padding: 14px 22px; display: flex; align-items: center; justify-content: space-between; gap: 12px; border-top: 1px solid #000; }
    .prp-dots { display: flex; gap: 6px; }
    .prp-dot { width: 6px; height: 6px; background: #444; border-radius: 50%; transition: all 0.3s; }
    .prp-dot.active { background: #fff; width: 22px; border-radius: 3px; }
    .prp-arrow { background: transparent; border: 1px solid #444; color: #fff; cursor: pointer; width: 38px; height: 38px; font-size: 16px; transition: 0.2s; }
    .prp-arrow:hover { border-color: #fff; }
    .prp-arrow:disabled { opacity: 0.25; cursor: not-allowed; }
    .prp-cta { background: #000; color: #fff; padding: 14px 18px; font-family: 'Inter', sans-serif; font-weight: 900; font-size: 11px; letter-spacing: 2px; border: none; cursor: pointer; width: 100%; text-transform: uppercase; transition: 0.2s; border-top: 1px solid #222; }
    .prp-cta:hover { background: #fff; color: #000; }
    @media (max-width: 600px) { .prp-bubble { width: 46px; height: 46px; bottom: 18px; right: 18px; } .prp-bubble svg { width: 20px; height: 20px; } .prp-title { font-size: 22px; } .prp-slide { padding: 24px 20px 20px; } }
  `;
  document.head.appendChild(style);

  const bubble = document.createElement('button');
  bubble.className = 'prp-bubble';
  bubble.setAttribute('aria-label', 'Información PREPS');
  bubble.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
  document.body.appendChild(bubble);

  const modal = document.createElement('div');
  modal.className = 'prp-modal';
  modal.innerHTML = `<div class="prp-card"><div class="prp-head"><img src="${LOGO}" alt="PREPS"><span class="prp-status">PROTOCOLO</span><button class="prp-close" aria-label="Cerrar">&times;</button></div><div class="prp-body" id="prpBody"></div><div class="prp-nav"><button class="prp-arrow" id="prpPrev">&lsaquo;</button><div class="prp-dots" id="prpDots"></div><button class="prp-arrow" id="prpNext">&rsaquo;</button></div><button class="prp-cta" id="prpCta">CONTACTAR POR WHATSAPP</button></div>`;
  document.body.appendChild(modal);

  let idx = 0;
  const body = modal.querySelector('#prpBody');
  const dots = modal.querySelector('#prpDots');
  const prev = modal.querySelector('#prpPrev');
  const next = modal.querySelector('#prpNext');

  SLIDES.forEach(() => { const d = document.createElement('span'); d.className = 'prp-dot'; dots.appendChild(d); });

  function render() {
    const s = SLIDES[idx];
    body.innerHTML = `<div class="prp-slide"><p class="prp-eyebrow">${s.eyebrow}</p><h2 class="prp-title">${s.title}</h2>${s.body}</div>`;
    dots.querySelectorAll('.prp-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
    prev.disabled = idx === 0;
    next.disabled = idx === SLIDES.length - 1;
    body.scrollTop = 0;
  }
  function open() { modal.classList.add('open'); render(); }
  function close() { modal.classList.remove('open'); }

  bubble.addEventListener('click', open);
  modal.querySelector('.prp-close').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  prev.addEventListener('click', () => { if (idx > 0) { idx--; render(); } });
  next.addEventListener('click', () => { if (idx < SLIDES.length - 1) { idx++; render(); } });
  modal.querySelector('#prpCta').addEventListener('click', () => {
    const txt = encodeURIComponent('Hola! Vengo desde la web, tengo una consulta 🍱');
    window.open(`https://wa.me/${WSP}?text=${txt}`, '_blank');
  });

  let sx = 0;
  body.addEventListener('touchstart', e => sx = e.touches[0].clientX);
  body.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) {
      if (dx < 0 && idx < SLIDES.length - 1) { idx++; render(); }
      else if (dx > 0 && idx > 0) { idx--; render(); }
    }
  });

  document.addEventListener('keydown', e => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft' && idx > 0) { idx--; render(); }
    if (e.key === 'ArrowRight' && idx < SLIDES.length - 1) { idx++; render(); }
  });
})();
