/* ═══════════════════════════════════════
   Z CUSTOMS — App Entry Point
   ═══════════════════════════════════════ */

import { renderHero, carouselGo, carouselStep, attachCarouselSwipe } from './carousel.js';
import { goTo, toggleMenu, renderCollection, openDetail, closeDetail } from './pages.js';

/* Dynamic viewport height fix for old iOS / Android */
function setVH() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
setVH();
window.addEventListener('resize', setVH, { passive: true });
window.addEventListener('orientationchange', () => setTimeout(setVH, 150));

/* Click vs Drag guard */
let _downX = 0, _downY = 0, _downType = 'mouse';

document.addEventListener('pointerdown', e => {
  _downX = e.clientX;
  _downY = e.clientY;
  _downType = e.pointerType || 'mouse';
}, true);

function safeOpenDetail(pieceId, event) {
  if (event) {
    const dx = Math.abs(event.clientX - _downX);
    const dy = Math.abs(event.clientY - _downY);
    const threshold = (_downType === 'touch' || _downType === 'pen') ? 14 : 6;
    if (dx > threshold || dy > threshold) return;
  }
  openDetail(pieceId);
}

window.goTo = goTo;
window.toggleMenu = toggleMenu;
window.openDetail = safeOpenDetail;
window.closeDetail = closeDetail;
window.carouselGo = carouselGo;
window.carouselStep = carouselStep;

/* Debounced resize */
let _resizeTimer = null;
let _lastWidth = window.innerWidth;

function onResize() {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(() => {
    const w = window.innerWidth;
    const crossedMobileBreakpoint =
      (w < 768 && _lastWidth >= 768) || (w >= 768 && _lastWidth < 768);
    if (crossedMobileBreakpoint) renderHero();
    _lastWidth = w;
  }, 250);
}

document.addEventListener('DOMContentLoaded', () => {
  renderHero();
  renderCollection();
  attachCarouselSwipe();

  const savedPage = localStorage.getItem('zc_page') || 'hero';
  goTo(savedPage);
});

window.addEventListener('resize', onResize, { passive: true });
