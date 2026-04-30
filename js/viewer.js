/* ═══════════════════════════════════════
   Z CUSTOMS — 3D Viewer (GaussianSplats)
   ═══════════════════════════════════════ */

import { placeholder } from './ui.js';

const _activeViewers = {};
/* Generation counter per key. Each call to initSplatViewer increments it.
   When a scene's load promise resolves, we check whether its generation is
   still current; if not, we silently dispose without touching the (now
   reused/cleared) container — that prevents the
     "Failed to execute 'removeChild' on 'Node'"
   error that fires when the user swipes the carousel before a previous
   splat scene has finished loading. */
const _viewerGen = {};

const MAX_DPR = 1.5;

function eulerToQuaternion(degX, degY, degZ) {
  const x = degX * Math.PI / 180;
  const y = degY * Math.PI / 180;
  const z = degZ * Math.PI / 180;
  const c1 = Math.cos(x/2), c2 = Math.cos(y/2), c3 = Math.cos(z/2);
  const s1 = Math.sin(x/2), s2 = Math.sin(y/2), s3 = Math.sin(z/2);
  return [
    s1*c2*c3 + c1*s2*s3,
    c1*s2*c3 - s1*c2*s3,
    c1*c2*s3 + s1*s2*c3,
    c1*c2*c3 - s1*s2*s3
  ];
}

/* Safely dispose a viewer, swallowing both sync exceptions and async
   promise rejections. The library's dispose() returns a promise that can
   reject if the canvas was never attached. */
function safeDispose(viewer) {
  if (!viewer) return;
  try {
    const result = viewer.dispose();
    if (result && typeof result.then === 'function') {
      result.catch(() => {});
    }
  } catch (e) { /* ignore */ }
}

export function disposeViewer(key) {
  if (_activeViewers[key]) {
    const v = _activeViewers[key];
    delete _activeViewers[key];
    safeDispose(v);
  }
}

export function disposeAllViewers() {
  for (const key of Object.keys(_activeViewers)) {
    disposeViewer(key);
  }
}

export function initSplatViewer(container, cap, key) {
  if (!window.GaussianSplats3D || !cap || !container) return;

  /* Bump the generation for this key, then dispose any previous viewer.
     The new generation is what the load callback will compare against. */
  const gen = (_viewerGen[key] || 0) + 1;
  _viewerGen[key] = gen;

  disposeViewer(key);
  container.innerHTML = '';

  const url = cap.splatUrl;
  const pivot = cap.pivot || [0, 0, 0];
  const offset = cap.offset || [0, 0, 0];
  const rotationDegres = cap.rotation || [0, 0, 0];
  const zoom = cap.zoom || 2;

  let viewer;
  try {
    viewer = new window.GaussianSplats3D.Viewer({
      rootElement: container,
      cameraUp: [0, -1, -0.6],
      initialCameraPosition: [0, 0, zoom],
      initialCameraLookAt: pivot,
      selfDrivenMode: true,
      useBuiltInControls: true,
      sharedMemoryForWorkers: false,
      halfPrecisionCovariancesOnGPU: false,
      backgroundColor: [0, 0, 0, 0],
      sceneRevealMode: window.GaussianSplats3D.SceneRevealMode.Instant
    });
  } catch (e) {
    console.warn('[Viewer] init failed', e);
    container.innerHTML = placeholder();
    return;
  }

  if (viewer.renderer && typeof viewer.renderer.setPixelRatio === 'function') {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    viewer.renderer.setPixelRatio(dpr);
  }

  _activeViewers[key] = viewer;

  viewer.addSplatScene(url, {
    splatAlphaRemovalThreshold: 5,
    showLoadingUI: false,
    position: offset,
    rotation: eulerToQuaternion(rotationDegres[0], rotationDegres[1], rotationDegres[2])
  }).then(() => {
    /* If the user moved on before this scene finished loading, abandon it
       silently rather than trying to attach controls to a stale viewer. */
    if (_viewerGen[key] !== gen || _activeViewers[key] !== viewer) {
      safeDispose(viewer);
      return;
    }

    viewer.start();
    const controls = viewer.cameraControls || viewer.controls;
    if (controls) {
      const targetFixe = controls.target.clone();
      targetFixe.set(pivot[0], pivot[1], pivot[2]);
      targetFixe.copy = function() { return this; };
      targetFixe.set = function() { return this; };
      targetFixe.add = function() { return this; };
      Object.defineProperty(controls, 'target', { get: () => targetFixe, set: () => {} });

      controls.enablePan = false;
      const angleCentral = Math.PI / 2.2;
      const marge = 0.2;
      controls.maxPolarAngle = angleCentral + marge;
      controls.minPolarAngle = angleCentral - marge;
      controls.minDistance = 1.0;
      controls.maxDistance = 5.0;
    }

    const cvs = container.querySelector('canvas');
    if (cvs) cvs.style.touchAction = 'none';
  }).catch(err => {
    /* Network errors, parse errors, or stale-load aborts. Don't bubble. */
    console.warn('[Viewer] scene load aborted:', err && err.message ? err.message : err);
    if (_activeViewers[key] === viewer) {
      delete _activeViewers[key];
      safeDispose(viewer);
      container.innerHTML = placeholder();
    }
  });
}
