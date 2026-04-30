/* ═══════════════════════════════════════
   Z CUSTOMS — Pages (Navigation, Collection, Detail)
   ═══════════════════════════════════════ */

import { PIECES } from './data.js';
import { placeholder, stripes } from './ui.js';
import { initSplatViewer } from './viewer.js';

const PAGE_ORDER = ['hero', 'collection', 'detail'];
let prevPageId = 'hero';

/* ─── Navigation ─── */
export function goTo(name) {
  const ti = PAGE_ORDER.indexOf(name);
  document.querySelectorAll('.page').forEach(p => {
    const id = p.id.replace('page-', '');
    const ii = PAGE_ORDER.indexOf(id);
    p.classList.remove('active', 'slide-left', 'slide-right');
    p.classList.add(id === name ? 'active' : ii < ti ? 'slide-left' : 'slide-right');
  });
  document.querySelectorAll('[data-page]').forEach(el =>
    el.classList.toggle('active', el.dataset.page === name)
  );
  document.getElementById('app').dataset.activePage = name;
  localStorage.setItem('zc_page', name);

  if (name === 'collection') initCollViewers();
}

export function toggleMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}

/* ─── Collection ─── */
export function renderCollection() {
  document.getElementById('collCount').textContent =
    `${PIECES.length} pièce${PIECES.length > 1 ? 's' : ''} · toutes uniques`;

  stripes('collStripes', [
    { top: 6, h: 20, col: '#100e0a', op: .08 },
    { top: 28, h: 3, col: '#100e0a', op: .06 },
  ]);

  document.getElementById('collGrid').innerHTML = PIECES.map(p => `
    <div class="coll-card" onclick="openDetail('${p.id}', event)">
      ${p.duoWith ? `<div class="coll-duo-tag">DUO ×</div>` : ''}
      <div class="card-band" style="background:${p.band}"></div>
      <div class="cap-viewer" id="cv-${p.id}">${placeholder(300, 220)}</div>
      <div class="card-info">
        <div class="plate ${p.band === '#100e0a' ? 'plate-ink' : 'plate-red'}">${p.number}</div>
        <div class="card-meta">
          <div class="card-name">${p.name}</div>
          <div class="card-tags">${p.tags.join(' · ')}</div>
        </div>
        <div class="stamp ${p.status === 'available' ? 'stamp-ok' : 'stamp-sold'}">${p.status === 'available' ? 'DISPO!' : 'SOLD'}</div>
      </div>
    </div>`
  ).join('') +
  `<div class="coll-card coll-empty"><div class="coll-empty-label"><div class="e1">COMING SOON</div><div class="e2">+ nouvelle pièce</div></div></div>`;
}

function initCollViewers() {
  PIECES.forEach(p => {
    const el = document.getElementById(`cv-${p.id}`);
    if (el) initSplatViewer(el, p, `coll-${p.id}`);
  });
}

/* ─── Detail ─── */
export function openDetail(pieceId) {
  prevPageId = document.querySelector('.page.active')?.id?.replace('page-', '') || 'hero';
  const piece = PIECES.find(p => p.id === pieceId);
  if (!piece) return;

  const idx = PIECES.findIndex(p => p.id === pieceId);
  document.getElementById('detailCounter').textContent = `${idx + 1} / ${PIECES.length}`;
  document.getElementById('detailFooterTag').textContent = piece.tags[0];

  const statusOk = piece.status === 'available';
  document.getElementById('detailInfo').innerHTML = `
    <div class="d-plate-row">
      <div class="d-plate ${piece.band === '#100e0a' ? 'plate-ink' : 'plate-red'}">${piece.number}</div>
      <div class="d-name">${piece.name}</div>
    </div>
    <div class="d-divider"></div>
    <div>
      <div class="d-section">TECHNIQUES</div>
      <div class="d-tags">${piece.tags.map(t => `<div class="d-tag">${t}</div>`).join('')}</div>
    </div>
    <div>
      <div class="d-section">STATUS</div>
      <div class="d-status">
        <div class="d-status-dot" style="background:${statusOk ? '#0a7a0a' : '#cc1111'}"></div>
        <div class="d-status-text" style="color:${statusOk ? '#0a7a0a' : '#cc1111'}">${statusOk ? 'DISPONIBLE' : 'VENDU'}</div>
      </div>
    </div>`;

  const vc = document.getElementById('detailViewerEl');
  initSplatViewer(vc, piece, 'detail');
  goTo('detail');
}

export function closeDetail() {
  goTo(prevPageId);
}
