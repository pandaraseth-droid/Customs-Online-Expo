/* ═══════════════════════════════════════
   Z CUSTOMS — Data & Persistence
   ═══════════════════════════════════════ */

export const SPLAT_FILES = [
  {
    id: 'cap01',
    number: '01',
    name: 'CUSTOM 01',
    tags: ['bleach dye', 'piercings laiton', 'distressed'],
    status: 'available',
    band: '#100e0a',
    file: 'gaussiansplatcustom1.ply',
    duoWith: 'cap02',
    pivot: [0, 0, 0],
    offset: [-0.1, 0.25, 0],
    rotation: [30, 90, 0],
    zoom: 2.0
  },
  {
    id: 'cap02',
    number: '02',
    name: 'CUSTOM 02',
    tags: ['overdye', 'hardware laiton', 'unique'],
    status: 'sold',
    band: '#cc1111',
    file: 'gaussiansplatcustom2.ply',
    duoWith: 'cap01',
    pivot: [0, 0, 0],
    offset: [0, .35, 0.2],
    rotation: [30, -20, 0],
    zoom: 2.0
  },
];

const STORAGE_KEY = 'zc_caps_v1';

function getDefaultCaps() {
  return SPLAT_FILES.map(s => ({
    ...s,
    splatUrl: 'splats/' + s.file,
    added: Date.now()
  }));
}

export function loadCaps() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let data = !raw ? getDefaultCaps() : JSON.parse(raw);
    // Auto-fix paths for GitHub Pages
    data.forEach(c => {
      if (c.splatUrl && c.splatUrl.startsWith('/splats/')) {
        c.splatUrl = c.splatUrl.substring(1);
      }
    });
    return data;
  } catch { return getDefaultCaps(); }
}

export const PIECES = loadCaps();
