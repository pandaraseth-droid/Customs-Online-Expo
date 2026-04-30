# Z CUSTOMS — Audit complet & plan de mise à niveau responsive

**Date :** 1er mai 2026
**Périmètre :** site statique vanilla (HTML/CSS/JS) + viewer Gaussian Splatting
**Cibles :** Desktop large (>1440), desktop standard (1024-1440), tablette (iPad/Android), mobile (iOS Safari, Chrome Android)

---

## 1. Vue d'ensemble

Le site est un POC bien structuré pour une vitrine de casquettes custom : 3 pages (Hero/Carrousel, Collection, Détail), viewer 3D Gaussian Splatting, esthétique éditoriale (papier/encre/rouge accent). Le code est propre, modulaire (CSS et JS séparés en modules logiques), mais **la couche responsive est minimaliste** — un seul breakpoint à 768 px, ce qui laisse passer plusieurs bugs critiques sur iOS, Android, tablettes et grands écrans.

L'audit ci-dessous est organisé par sévérité (🔴 bloquant / 🟠 important / 🟡 polish), puis par domaine.

---

## 2. Problèmes bloquants 🔴

### 2.1 `100vh` casse iOS Safari et Chrome Android
`html, body { height: 100% }` + `#app { height: 100vh }` produit deux bugs sur mobile :

- **iOS Safari :** la barre URL se rétracte au scroll, mais `100vh` représente la hauteur barre **déployée**. Résultat : 50-100 px de contenu coupés en bas (footer invisible, CTA inaccessible).
- **Chrome Android :** clavier virtuel + barre d'adresse rebondissante = layout qui saute.

**Fix :** utiliser `100dvh` (dynamic viewport height) avec fallback `100vh`, et exposer une variable `--vh` mise à jour côté JS pour les anciens navigateurs.

### 2.2 Aucune gestion `safe-area-inset` (iPhone notch/Dynamic Island)
Le nav et le footer collent aux bords sans tenir compte des encoches. Sur iPhone X et plus récent en mode portrait, le titre `Z CUSTOMS` peut chevaucher l'encoche ; en paysage le contenu disparaît derrière les "ears".

**Fix :** `meta viewport-fit=cover` + `padding: env(safe-area-inset-*)` sur nav, footer, mobile menu, detail topbar.

### 2.3 `:hover` colle au tap sur écran tactile
Toutes les règles `.cap-card:hover`, `.nav-link:hover`, `.below-cta:hover` se déclenchent au premier tap sur mobile et **restent collées** jusqu'au prochain tap ailleurs. C'est un bug courant et très visible (cards qui restent en transform translateY après navigation).

**Fix :** wrapper toutes les règles hover dans `@media (hover: hover) and (pointer: fine)`.

### 2.4 Carrousel hero non swipeable
`carousel-track` n'a aucune gestion touch ; sur mobile l'utilisateur ne peut changer de slide qu'en cliquant sur les minuscules flèches `arrow-left/right` (44 px, à 14 px du bord — tap trop précis).

**Fix :** ajouter pointer events (pointerdown/move/up) avec seuil de swipe horizontal (~50 px) et clamp.

### 2.5 `overflow:hidden` sur `html, body` + viewport mobile
`html, body { overflow: hidden }` + `#app { height: 100vh }` empêche **tout scroll** de l'application. Le contenu "below fold" du hero (`#heroBelowFold`) est censé scroller dans `#page-hero { overflow-y: auto }` mais sur iOS le rebond/élastique fait que les overlays absolutely positionnés (`.ghost-text`, `.duo-badge`) cassent le calcul.

**Fix :** retirer `overflow:hidden` du html/body, garder le contrôle via `#app`, ajouter `-webkit-overflow-scrolling: touch` et `overscroll-behavior: contain`.

---

## 3. Problèmes importants 🟠

### 3.1 Single breakpoint 768 px insuffisant
Le seul `@media (max-width: 768px)` ne couvre ni :
- mobile S (≤ 360 px — Galaxy S8, iPhone SE)
- tablette portrait (768-1024 px — iPad standard)
- tablette paysage / petit laptop (1024-1280 px)
- desktop large (≥ 1440 px — MacBook 16″, écran 4K)
- mobile **landscape** (hauteur < 500 px)

**Conséquences observées :**
- Sur iPad portrait (768 px), grille collection passe en 1 colonne (perte d'espace énorme).
- Sur iPad paysage (1024 px), pas adaptée — texte hero `clamp(22px,3vw,38px)` correct mais carrousel cards `clamp(320px, 38vw, 520px)` → 389 px chacune, layout cramé.
- Sur 4K, `.hero-card` plafonne à 520 px → cards perdues dans le vide.
- En **mobile landscape**, le hero occupe toute la hauteur → carrousel écrasé à 200 px.

### 3.2 Detail page : `width: 400px` rigide
`.detail-info { width: 400px }` + `.detail-viewer-wrap { flex: 1 }` :
- Sur 320 px de large, le detail est cassé (en attendant le breakpoint 768 qui force `width:100%`).
- Sur 1024-1280 px, le viewer 3D se retrouve avec ~600 px → trop étroit pour bien apprécier.

**Fix :** remplacer par `flex: 0 0 clamp(300px, 30%, 460px)`.

### 3.3 Viewer 3D : pas de cap de devicePixelRatio
Sur iPhone Pro / Android haut de gamme, `devicePixelRatio = 3`. La librairie `@mkkellogg/gaussian-splats-3d` rend potentiellement à 3× la résolution → 9× les pixels à splatter. Trois viewers en simultané (carrousel + collection grid) = stutter/freeze sur mobile.

**Fix :** passer `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))` après init, et lazy-load les viewers de la collection (IntersectionObserver) au lieu de tous les init au mount.

### 3.4 `100vw` sur les slides du carrousel
`.carousel-slide { width: 100vw }` ignore la barre de scroll Windows (~17 px). Résultat : décalage horizontal sur Windows desktop (pas iOS/Android, pas macOS Safari).

**Fix :** utiliser `width: 100%` sur le slide avec `.carousel-track` qui calcule sa largeur en JS, ou `scrollbar-gutter: stable`.

### 3.5 Mobile menu : pas de scroll-lock body
Quand `.mobile-menu.open` est affiché en `position: fixed`, le body en arrière-plan reste scrollable (uniquement applicable si on retire `overflow:hidden` global). Standard UX : verrouiller le scroll body quand un overlay plein écran est ouvert.

**Fix :** toggle `body { overflow: hidden }` + sauvegarder/restaurer `scrollY` à l'ouverture/fermeture.

### 3.6 Mobile menu mauvais positionnement
`.mobile-menu { top: 50px }` est codé en dur. Le nav fait 46 px + 4 px de bordure rouge = 50 px **sans** safe-area. Avec safe-area-top sur iPhone (44-59 px), le menu démarre à 50 px et **passe sous** la barre d'état.

**Fix :** `.mobile-menu { top: calc(46px + 4px + env(safe-area-inset-top)) }`.

### 3.7 Pas de `prefers-reduced-motion`
Animations carousel intro `slideFromLeft/Right`, `paintIn`, `capSpin` (placeholder), transitions de page (`.55s cubic-bezier`) tournent toutes même chez les users ayant activé "Réduire les animations" dans iOS/macOS.

**Fix :** wrapper dans `@media (prefers-reduced-motion: no-preference)` ou désactiver via `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }`.

### 3.8 Viewer 3D : `touch-action` manquant
Le canvas WebGL doit drag pour rotation, mais sans `touch-action: none`, iOS interprète les drags verticaux comme scroll de page, ce qui combat la rotation 3D et provoque des "jumps".

**Fix :** sur `.cap-viewer canvas { touch-action: none }`.

### 3.9 Click vs drag : seuil 6 px trop strict mobile
`CLICK_THRESHOLD = 6` dans `app.js` : sur écran tactile haute densité, n'importe quel tap génère 2-4 px de jitter. Un tap "propre" peut être interprété comme drag.

**Fix :** seuil dynamique selon `pointerType` : 6 px souris, 12-15 px touch.

### 3.10 Stretch font-rendering iOS
Pas de `-webkit-font-smoothing: antialiased` ni `text-rendering: optimizeLegibility` → fonts (Bebas, Barlow) un peu épaisses sur iOS Safari par rapport à Chrome.

**Fix :** sur `body`.

---

## 4. Problèmes mineurs / polish 🟡

### 4.1 Meta tags incomplets
Manquent : `theme-color`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-mobile-web-app-title`, `apple-touch-icon`, favicon, `og:image`, `twitter:card`. La fenêtre browser sur mobile garde donc un look générique (pas de couleur de status bar, pas de fallback "ajouter à l'écran d'accueil" propre).

### 4.2 Google Fonts non préchargées + pas de `font-display:swap` explicite
Le `<link>` actuel demande `display=swap` (bon), mais aucun `<link rel="preconnect">` ni `<link rel="preload">` → FOIT/FOUT visible 200-500 ms.

**Fix :** ajouter `<link rel="preconnect" href="https://fonts.googleapis.com">` et `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`.

### 4.3 `localStorage` pour position de slide / page
`zc_slide` et `zc_page` sont relus au boot, utile pour la continuité de session, mais peut être déstabilisant : un user qui partage le lien atterrit sur la page qu'il avait quittée (collection) au lieu du hero. Pas critique mais à évaluer.

### 4.4 `console.log('[DEBUG] curSlide:', ...)`
Présent dans `carousel.js` ligne 104, à retirer en prod.

### 4.5 Card `transform: rotate(±1deg)` sur mobile
`.coll-card:nth-child(odd) { transform: rotate(-1deg) }` est sympa esthétiquement mais sur mobile crée des collisions de bordure entre cards adjacentes en grille 1 colonne. À atténuer en mobile (≤ 480 px).

### 4.6 Pas de `loading="lazy"` (n/a — pas d'images)
Note : tous les visuels sont SVG inline ou WebGL. Rien à lazy-load côté image. En revanche, **les .ply (6 Mo + 6 Mo)** sont fetchés au boot pour les viewers carrousel — la collection peut bénéficier d'IntersectionObserver pour ne charger qu'à l'apparition.

### 4.7 Accessibilité
- Pas de `aria-label` sur les flèches du carrousel ni sur les dots.
- `nav-link` est un `<button>` (bien) mais `data-page` n'est pas relié à l'état `aria-current`.
- Mobile menu n'a pas `aria-expanded` ni focus trap.
- `.duo-badge` est `<div>` informatif sans rôle.

### 4.8 Pas de `lang` sur les textes EN
`<html lang="fr">` mais "DESTROY ART · 2025", "TOUTES PIÈCES UNIQUES", "DERNIERS SCANS" mélangent FR/EN. Cosmétique.

### 4.9 Hero scroll : pas d'indicateur clair
`↓ scroll` est minuscule et placé **à côté** des dots (gauche/droite ambigu). Sur mobile l'utilisateur ne voit pas qu'il y a du contenu sous le carrousel.

### 4.10 SharedArrayBuffer fix
Le hack `if (!window.crossOriginIsolated) window.SharedArrayBuffer = undefined` est nécessaire pour GitHub Pages. À conserver. Pour Vercel/Cloudflare, possibilité de configurer COOP/COEP headers et virer le hack.

---

## 5. Plan d'action

| # | Fichier | Action |
|---|---------|--------|
| 1 | `index.html` | Meta theme-color, viewport-fit=cover, apple-* tags, preconnect fonts |
| 2 | `css/tokens.css` | Variables `--vh`, safe-area, reset moderne, antialiasing |
| 3 | `css/layout.css` | Safe-area sur nav/footer/menu, scroll-lock, dvh, hover (hover:hover) |
| 4 | `css/components.css` | Detail layout flex, fluid typo, hover guards, carousel touch-action |
| 5 | `css/responsive.css` | Breakpoints multi (480/768/1024/1440), landscape mobile, reduced-motion |
| 6 | `js/app.js` | Variable `--vh` dynamique, scroll-lock body, click threshold dynamique |
| 7 | `js/carousel.js` | Swipe touch, retrait du `console.log` |
| 8 | `js/viewer.js` | Cap pixelRatio à 1.5, touch-action canvas, lazy-load via IO |
| 9 | `js/pages.js` | aria-current, aria-expanded sur menu, scroll-lock |

---

## 6. Tests recommandés post-livraison

1. **iPhone 14 Pro** (Safari) — portrait + paysage, vérifier safe-area Dynamic Island.
2. **iPhone SE 2** (Safari) — petit écran 375×667, vérifier que tout passe.
3. **iPad 10ᵉ gen** (Safari) — portrait 810×1080 + paysage 1080×810.
4. **Galaxy S22** (Chrome) — clavier qui apparaît sur un éventuel input ne casse pas le viewport.
5. **MacBook Air 13″** (Safari + Chrome) — 1280×800.
6. **Écran 4K** (Chrome) — 2560×1440 et au-delà.
7. **Mode `prefers-reduced-motion: reduce`** activé via DevTools.
8. **Mode `prefers-color-scheme: dark`** — site reste light (intentionnel).

---

Fin de l'audit. Je passe maintenant à l'implémentation des corrections.
