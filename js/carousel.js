/* ═══════════════════════════════════════
   Z CUSTOMS — Carousel (Hero slides)
   ═══════════════════════════════════════ */

import { PIECES } from './data.js';
import { brushX, placeholder, stripes } from './ui.js';
import { initSplatViewer, disposeAllViewers } from './viewer.js';

let curSlide = +localStorage.getItem('zc_slide') || 0;

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

// Clamp saved slide index to valid range
curSlide = SLIDES.length > 0 ? Math.min(curSlide, SLIDES.length - 1) : 0;

export function getCurSlide() { return curSlide; }

export function renderHero() {
  // Dispose all active viewers before rebuilding the DOM
  disposeAllViewers();

  const track = document.getElementById('carouselTrack');
  track.innerHTML = SLIDES.map((sl, i) => {
    if (sl.type === 'duo') {
      const [a, b] = sl.pieces;
      const mobile = window.innerWidth < 768;
      return `<div class="carousel-slide" data-slide="${i}">
        <div class="duo-layout" style="${mobile ? 'position:relative' : ''}">
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
        <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:0 60px">
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

  // Carousel position first (clamps curSlide)
  carouselGo(curSlide, true);

  // Badge / Dots — AFTER carouselGo so curSlide is clamped
  const badge = document.getElementById('heroBadge');
  const slideType = SLIDES[curSlide]?.type;
  badge.style.display = slideType === 'duo' ? '' : 'none';
  console.log('[DEBUG] curSlide:', curSlide, 'type:', slideType, 'SLIDES.length:', SLIDES.length);

  const dots = document.getElementById('dotNav');
  dots.innerHTML = SLIDES.map((_, i) =>
    `<div class="dot${i === curSlide ? ' active' : ''}" onclick="carouselGo(${i})"></div>`
  ).join('') + `<span class="dot-label">↓ scroll</span>`;

  document.getElementById('arrowL').style.display = SLIDES.length > 1 ? '' : 'none';
  document.getElementById('arrowR').style.display = SLIDES.length > 1 ? '' : 'none';

  stripes('heroStripes', [
    { top: 10, h: 22, col: '#100e0a', op: .09 },
    { top: 34, h: 4, col: '#100e0a', op: .06 },
    { top: 40, h: 3, col: '#100e0a', op: .05 },
  ]);

  renderBelowFold();

  // Intro animation
  requestAnimationFrame(() => {
    document.querySelectorAll('.card-left,.card-right,.brush-x').forEach(el =>
      el.classList.add('intro-anim')
    );
  });
}

export function carouselGo(n, instant = false) {
  if (SLIDES.length === 0) return;
  curSlide = ((n % SLIDES.length) + SLIDES.length) % SLIDES.length;
  localStorage.setItem('zc_slide', curSlide);

  const track = document.getElementById('carouselTrack');
  if (instant) track.style.transition = 'none';
  track.style.transform = `translateX(-${curSlide * 100}vw)`;
  if (instant) requestAnimationFrame(() => { track.style.transition = ''; });

  document.querySelectorAll('.dot').forEach((d, i) =>
    d.classList.toggle('active', i === curSlide)
  );

  // Init viewers for current slide
  const current = SLIDES[curSlide];
  if (current) {
    current.pieces.forEach(p => {
      const el = document.getElementById(`hv-${p.id}`);
      if (el) initSplatViewer(el, p, `hero-${p.id}`);
    });
  }
}

export function carouselStep(dir) {
  carouselGo(curSlide + dir);
}

function renderBelowFold() {
  const el = document.getElementById('heroBelowFold');
  if (!el) return;
  el.innerHTML = `
    <div class="hero-below">
      <div class="below-stripe-bar"></div>
      <div class="below-stripe-bar2"></div>
      <div class="below-statement">
        <div class="below-eyebrow">DESTROY ART COLLECTIVE · HANDMADE · 2025</div>
        <div class="below-body">
          Chaque pièce est unique. Bleach dye, piercings métalliques,
          distressed — techniques de destruction appliquées au streetwear.
        </div>
        <div class="below-cta" onclick="goTo('collection')">VOIR LA COLLECTION →</div>
      </div>
      <div>
        <div class="below-strip-label">DERNIERS SCANS</div>
        <div class="below-strip">
          ${PIECES.map(p => `
            <div class="strip-card" onclick="openDetail('${p.id}', event)">
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
