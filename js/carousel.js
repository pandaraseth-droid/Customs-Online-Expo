/* ═══════════════════════════════════════
   Z CUSTOMS — Carousel (Hero slides)
   ═══════════════════════════════════════ */

import { PIECES } from './data.js';
import { brushX, placeholder, stripes } from './ui.js';
import { initSplatViewer, disposeAllViewers } from './viewer.js';

let curSlide = +localStorage.getItem('zc_slide') || 0;

/* Track which slide currently owns the live 3D viewers.  We only re-init
   viewers when that index actually changes, so iOS Safari's URL-bar resize
   events (which fire constantly while you scroll/drag) don't keep
   destroying & recreating the splat viewers and flashing white. */
let _lastViewerSlide = -1;

export function buildSlides() {
  const slides = [];
  const seen = new Set();
  for (const p of PIECES) {
    if (seen.has(p.id)) continue;
    const partner = p.duoWith
      ? PIECES.find(x => x.id === p.duoWith && !seen.has(x.id))
      : null;
    if (partner) {
      slides.push({ type: 'duo', pieces: [p, partner] });
      seen.add(p.id);
      seen.add(partner.id);
    } else {
      slides.push({ type: 'single', pieces: [p] });
      seen.add(p.id);
    }
  }
  return slides;
}

export const SLIDES = buildSlides();

curSlide = SLIDES.length > 0 ? Math.min(curSlide, SLIDES.length - 1) : 0;

export function getCurSlide() { return curSlide; }

export function renderHero() {
  disposeAllViewers();
  _lastViewerSlide = -1;   // reset so the rebuilt DOM gets viewers attached

  const track = document.getElementById('carouselTrack');
  if (!track) return;

  const mobile = window.innerWidth < 768;

  track.innerHTML = SLIDES.map((sl, i) => {
    if (sl.type === 'duo') {
      const [a, b] = sl.pieces;
      return `<div class="carousel-slide" data-slide="${i}">
        <div class="duo-layout"${mobile ? ' style="position:relative"' : ''}>
          <div class="cap-card hero-card card-left" onclick="openDetail('${a.id}', event)">
            <div class="card-band" style="background:${a.band}"></div>
            <div class="cap-viewer" id="hv-${a.id}">${placeholder()}</div>
            <div class="card-info">
              <div class="plate ${a.band === '#100e0a' ? 'plate-ink' : 'plate-red'}">${a.number}</div>
              <div class="card-meta">
                <div class="card-name">${a.name}</div>
                <div class="card-tags">${a.tags.join(' · ')}</div>
              </div>
              <div class="stamp ${a.status === 'available' ? 'stamp-ok' : 'stamp-sold'}">${a.status === 'available' ? 'DISPO!' : 'SOLD'}</div>
            </div>
          </div>
          <div class="brush-x${mobile ? ' center-x' : ''}">${brushX(mobile ? 44 : 58, '#cc1111', 'bxh' + i)}</div>
          <div class="cap-card hero-card card-right" onclick="openDetail('${b.id}', event)">
            <div class="card-band" style="background:${b.band}"></div>
            <div class="cap-viewer" id="hv-${b.id}">${placeholder()}</div>
            <div class="card-info">
              <div class="plate ${b.band === '#100e0a' ? 'plate-ink' : 'plate-red'}">${b.number}</div>
              <div class="card-meta">
                <div class="card-name">${b.name}</div>
                <div class="card-tags">${b.tags.join(' · ')}</div>
              </div>
              <div class="stamp ${b.status === 'available' ? 'stamp-ok' : 'stamp-sold'}">${b.status === 'available' ? 'DISPO!' : 'SOLD'}</div>
            </div>
          </div>
        </div>
      </div>`;
    } else {
      const [p] = sl.pieces;
      return `<div class="carousel-slide" data-slide="${i}">
        <div style="display:flex;align-items:center;justify-content:center;height:100%;width:100%;padding:0 24px">
          <div class="cap-card hero-card" onclick="openDetail('${p.id}', event)">
            <div class="card-band" style="background:${p.band}"></div>
            <div class="cap-viewer" id="hv-${p.id}">${placeholder()}</div>
            <div class="card-info">
              <div class="plate ${p.band === '#100e0a' ? 'plate-ink' : 'plate-red'}">${p.number}</div>
              <div class="card-meta">
                <div class="card-name">${p.name}</div>
                <div class="card-tags">${p.tags.join(' · ')}</div>
              </div>
              <div class="stamp ${p.status === 'available' ? 'stamp-ok' : 'stamp-sold'}">${p.status === 'available' ? 'DISPO!' : 'SOLD'}</div>
            </div>
          </div>
        </div>
      </div>`;
    }
  }).join('');

  carouselGo(curSlide, true);

  const badge = document.getElementById('heroBadge');
  const slideType = SLIDES[curSlide]?.type;
  if (badge) badge.style.display = slideType === 'duo' ? '' : 'none';

  const dots = document.getElementById('dotNav');
  if (dots) {
    dots.innerHTML = SLIDES.map((_, i) =>
      `<button class="dot${i === curSlide ? ' active' : ''}" onclick="carouselGo(${i})" aria-label="Aller à la pièce ${i + 1}"${i === curSlide ? ' aria-current="true"' : ''}></button>`
    ).join('') + `<span class="dot-label">↓ scroll</span>`;
  }

  const arrowL = document.getElementById('arrowL');
  const arrowR = document.getElementById('arrowR');
  if (arrowL) arrowL.style.display = SLIDES.length > 1 ? '' : 'none';
  if (arrowR) arrowR.style.display = SLIDES.length > 1 ? '' : 'none';

  stripes('heroStripes', [
    { top: 10, h: 22, col: '#100e0a', op: .09 },
    { top: 34, h: 4, col: '#100e0a', op: .06 },
    { top: 40, h: 3, col: '#100e0a', op: .05 },
  ]);

  renderBelowFold();

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion) {
    requestAnimationFrame(() => {
      document.querySelectorAll('.card-left,.card-right,.brush-x').forEach(el =>
        el.classList.add('intro-anim')
      );
    });
  }
}

/* Update only layout (slide widths + translate). Does NOT touch viewers. */
function carouselUpdateLayout(instant = false) {
  const track = document.getElementById('carouselTrack');
  if (!track) return;
  if (instant) track.style.transition = 'none';
  const wrap = track.parentElement;
  const w = wrap ? wrap.clientWidth : window.innerWidth;
  track.querySelectorAll('.carousel-slide').forEach(s => { s.style.width = w + 'px'; });
  track.style.transform = `translateX(${-curSlide * w}px)`;
  if (instant) requestAnimationFrame(() => { track.style.transition = ''; });
}

export function carouselGo(n, instant = false) {
  if (SLIDES.length === 0) return;
  curSlide = ((n % SLIDES.length) + SLIDES.length) % SLIDES.length;
  localStorage.setItem('zc_slide', curSlide);

  carouselUpdateLayout(instant);

  document.querySelectorAll('.dot').forEach((d, i) => {
    const active = i === curSlide;
    d.classList.toggle('active', active);
    if (active) d.setAttribute('aria-current', 'true');
    else d.removeAttribute('aria-current');
  });

  const badge = document.getElementById('heroBadge');
  if (badge) badge.style.display = SLIDES[curSlide]?.type === 'duo' ? '' : 'none';

  /* Only re-init the 3D viewers when the slide actually changes.  This is
     critical: iOS Safari fires resize on URL-bar collapse, which used to
     destroy and rebuild every viewer (white flash). */
  if (_lastViewerSlide !== curSlide) {
    _lastViewerSlide = curSlide;
    const current = SLIDES[curSlide];
    if (current) {
      current.pieces.forEach(p => {
        const el = document.getElementById(`hv-${p.id}`);
        if (el) initSplatViewer(el, p, `hero-${p.id}`);
      });
    }
  }
}

export function carouselStep(dir) {
  carouselGo(curSlide + dir);
}

export function attachCarouselSwipe() {
  const wrap = document.querySelector('.carousel-wrap');
  if (!wrap) return;

  let startX = 0, startY = 0, startT = 0, dragging = false, locked = null;
  const SWIPE_THRESHOLD_X = 40;
  const MAX_TIME = 700;

  wrap.addEventListener('pointerdown', e => {
    if (e.target.closest('.carousel-arrow, .dot')) return;
    /* Don't start a swipe if the user is grabbing the WebGL canvas — the
       splat viewer's own controls handle drag-to-rotate there. */
    if (e.target.closest('.cap-viewer canvas')) return;
    startX = e.clientX;
    startY = e.clientY;
    startT = Date.now();
    dragging = true;
    locked = null;
  }, { passive: true });

  wrap.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (locked === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      locked = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
    }
  }, { passive: true });

  const finish = e => {
    if (!dragging) return;
    dragging = false;
    const dx = (e.clientX ?? startX) - startX;
    const dt = Date.now() - startT;
    if (locked === 'h' && dt < MAX_TIME && Math.abs(dx) > SWIPE_THRESHOLD_X) {
      carouselStep(dx < 0 ? 1 : -1);
    }
    locked = null;
  };

  wrap.addEventListener('pointerup', finish, { passive: true });
  wrap.addEventListener('pointercancel', () => { dragging = false; locked = null; }, { passive: true });

  wrap.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  carouselStep(-1);
    if (e.key === 'ArrowRight') carouselStep(1);
  });

  /* Only update layout on resize (no viewer reinit).  Track width to
     ignore height-only resizes (iOS URL bar). */
  let resizeT;
  let lastW = window.innerWidth;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      if (window.innerWidth !== lastW) {
        lastW = window.innerWidth;
        carouselUpdateLayout(true);
      }
    }, 200);
  }, { passive: true });
}

function renderBelowFold() {
  const el = document.getElementById('heroBelowFold');
  if (!el) return;
  el.innerHTML = `
    <div class="hero-below">
      <div class="below-stripe-bar" aria-hidden="true"></div>
      <div class="below-stripe-bar2" aria-hidden="true"></div>
      <div class="below-statement">
        <div class="below-eyebrow">DESTROY ART COLLECTIVE · HANDMADE · 2025</div>
        <div class="below-body">
          Chaque pièce est unique. Bleach dye, piercings métalliques,
          distressed — techniques de destruction appliquées au streetwear.
        </div>
        <button class="below-cta" onclick="goTo('collection')" type="button">VOIR LA COLLECTION →</button>
      </div>
      <div>
        <div class="below-strip-label">DERNIERS SCANS</div>
        <div class="below-strip">
          ${PIECES.map(p => `
            <div class="strip-card" onclick="openDetail('${p.id}', event)" role="button" tabindex="0">
              <div class="card-band" style="background:${p.band}"></div>
              <div class="cap-viewer" style="aspect-ratio:4/3">${placeholder(160, 120)}</div>
              <div class="strip-card-info">
                <div class="strip-plate ${p.band === '#100e0a' ? 'plate-ink' : 'plate-red'}">${p.number}</div>
                <div class="strip-name">${p.name}</div>
              </div>
            </div>`).join('')}
          <div class="strip-card" style="border:2px dashed var(--lgray);box-shadow:none;background:transparent;display:flex;align-items:center;justify-content:center;min-height:120px;color:var(--lgray);font-family:var(--bebas);font-size:12px;letter-spacing:3px;transform:none">SOON</div>
        </div>
      </div>
    </div>`;
}
