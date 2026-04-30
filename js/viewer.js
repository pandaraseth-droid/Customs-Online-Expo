/* ═══════════════════════════════════════
   Z CUSTOMS — 3D Viewer (GaussianSplats)
   ═══════════════════════════════════════ */

import { placeholder } from './ui.js';

const _activeViewers = {};

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

export function disposeViewer(key) {
  if (_activeViewers[key]) {
    try { _activeViewers[key].dispose(); } catch(e) {}
    delete _activeViewers[key];
  }
}

export function disposeAllViewers() {
  for (const key of Object.keys(_activeViewers)) {
    disposeViewer(key);
  }
}

export function initSplatViewer(container, cap, key) {
  if (!window.GaussianSplats3D || !cap || !container) return;

  // Clean up existing viewer for this key
  disposeViewer(key);
  container.innerHTML = '';

  const url = cap.splatUrl;
  const pivot = cap.pivot || [0, 0, 0];
  const offset = cap.offset || [0, 0, 0];
  const rotationDegres = cap.rotation || [0, 0, 0];
  const zoom = cap.zoom || 2;

  try {
    const viewer = new window.GaussianSplats3D.Viewer({
      rootElement: container,
      cameraUp: [0, -1, -0.6],
      initialCameraPosition: [0, 0, zoom],
      initialCameraLookAt: pivot,
      selfDrivenMode: true,
      useBuiltInControls: true,
      sharedMemoryForWorkers: false,
      halfPrecisionCovariancesOnGPU: false,
      backgroundColor: [0, 0, 0, 0], // TRANSPARENT
      sceneRevealMode: window.GaussianSplats3D.SceneRevealMode.Instant
    });

    viewer.addSplatScene(url, {
      splatAlphaRemovalThreshold: 5,
      showLoadingUI: false,
      position: offset,
      rotation: eulerToQuaternion(rotationDegres[0], rotationDegres[1], rotationDegres[2])
    }).then(() => {
      viewer.start();
      const controls = viewer.cameraControls || viewer.controls;
      if (controls) {
        // Lock pivot
        const targetFixe = controls.target.clone();
        targetFixe.set(pivot[0], pivot[1], pivot[2]);
        targetFixe.copy = function() { return this; };
        targetFixe.set = function() { return this; };
        targetFixe.add = function() { return this; };
        Object.defineProperty(controls, 'target', { get: () => targetFixe, set: () => {} });

        // Constraints
        controls.enablePan = false;
        const angleCentral = Math.PI / 2.2;
        const marge = 0.2;
        controls.maxPolarAngle = angleCentral + marge;
        controls.minPolarAngle = angleCentral - marge;
        controls.minDistance = 1.0;
        controls.maxDistance = 5.0;
      }
    });

    _activeViewers[key] = viewer;
  } catch(e) {
    console.warn('[Viewer]', e);
    container.innerHTML = placeholder();
  }
}
