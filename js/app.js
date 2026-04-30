/* ═══════════════════════════════════════
   Z CUSTOMS — App Entry Point
   ═══════════════════════════════════════ */

import { renderHero, carouselGo, carouselStep } from './carousel.js';
import { goTo, toggleMenu, renderCollection, openDetail, closeDetail } from './pages.js';

/* ─── Click vs Drag guard ───
   When user drags to rotate the 3D model, the click event still fires
   on the parent .cap-card. We track pointer movement distance and
   block the openDetail call if the user dragged more than a few pixels.
*/
let _downX = 0, _downY = 0, _downTime = 0;
const CLICK_THRESHOLD = 6;

document.addEventListener('pointerdown', e => {
  _downX = e.clientX;
  _downY = e.clientY;
  _downTime = Date.now();
}, true);

function safeOpenDetail(pieceId, event) {
  if (event) {
    const dx = Math.abs(event.clientX - _downX);
    const dy = Math.abs(event.clientY - _downY);
    if (dx > CLICK_THRESHOLD || dy > CLICK_THRESHOLD) return;
  }
  openDetail(pieceId);
}

// Expose to global scope for onclick handlers in HTML
window.goTo = goTo;
window.toggleMenu = toggleMenu;
window.openDetail = safeOpenDetail;
window.closeDetail = closeDetail;
window.carouselGo = carouselGo;
window.carouselStep = carouselStep;

/* ─── Debounced resize ─── */
let _resizeTimer = null;

function onResize() {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(() => {
    renderHero();
  }, 250);
}

/* ─── Boot ─── */
document.addEventListener('DOMContentLoaded', () => {
  renderHero();
  renderCollection();

  const savedPage = localStorage.getItem('zc_page') || 'hero';
  goTo(savedPage);
});

window.addEventListener('resize', onResize);
