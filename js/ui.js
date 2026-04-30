/* ═══════════════════════════════════════
   Z CUSTOMS — UI Helpers (SVG, Stripes)
   ═══════════════════════════════════════ */

export function brushX(size, col = '#cc1111', fid = 'bx') {
  return `<svg viewBox="-15 -15 170 175" width="${size*1.45}" height="${size*1.55}"
    style="display:block;overflow:visible;flex-shrink:0">
    <defs>
      <filter id="${fid}" x="-25%" y="-25%" width="150%" height="150%">
        <feTurbulence type="fractalNoise" baseFrequency="0.048 0.072" numOctaves="4" seed="11" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G" result="d"/>
        <feComponentTransfer in="d" result="c"><feFuncA type="linear" slope="6" intercept="-1.5"/></feComponentTransfer>
        <feComposite in="c" in2="SourceGraphic" operator="in"/>
      </filter>
    </defs>
    <g filter="url(#${fid})">
      <line x1="14" y1="10" x2="126" y2="130" stroke="${col}" stroke-width="30" stroke-linecap="round"/>
      <line x1="128" y1="12" x2="12" y2="128" stroke="${col}" stroke-width="22" stroke-linecap="round"/>
      <ellipse cx="130" cy="134" rx="7" ry="11" fill="${col}" transform="rotate(40 130 134)"/>
      <ellipse cx="136" cy="140" rx="4" ry="7"  fill="${col}" transform="rotate(40 136 140)"/>
      <ellipse cx="140" cy="147" rx="3" ry="5"  fill="${col}" transform="rotate(40 140 147)"/>
      <circle cx="132" cy="10" r="4" fill="${col}"/>
      <circle cx="138" cy="6"  r="2.5" fill="${col}"/>
      <circle cx="143" cy="13" r="2" fill="${col}"/>
      <ellipse cx="9" cy="131" rx="5" ry="8" fill="${col}" transform="rotate(-40 9 131)"/>
      <circle cx="4"  cy="136" r="3" fill="${col}"/>
      <circle cx="1"  cy="142" r="2" fill="${col}"/>
    </g>
  </svg>`;
}

export function capSVG(w = 180, h = 150) {
  const cx = w/2, cy = h*.46, rx = w*.28;
  return `<svg class="cap-placeholder-svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="opacity:.4">
    <g stroke="#b0a898" stroke-width="1.5" stroke-dasharray="6,4" fill="none">
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx*.32}"/>
      <path d="M${cx-rx} ${cy} Q${cx-rx*.55} ${cy-rx*.72} ${cx} ${cy-rx*.88} Q${cx+rx*.55} ${cy-rx*.72} ${cx+rx} ${cy}"/>
      <rect x="${cx-rx-2}" y="${cy}" width="${(rx+2)*2}" height="${rx*.14}" rx="2"/>
    </g>
  </svg>`;
}

export function placeholder(w = 180, h = 150) {
  return `<div class="cap-placeholder">
    ${capSVG(w, h)}
    <div class="cap-placeholder-label">3D SPLAT VIEWER</div>
  </div>`;
}

export function stripes(containerId, list) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = list.map(({ top, h, col, op }) =>
    `<div class="stripe" style="top:${top}px;height:${h}px;background:${col};opacity:${op}"></div>`
  ).join('');
}
