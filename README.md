# CAPS — Site vitrine POC

Site d'exposition de casquettes custom avec viewer Gaussian Splatting 3D.

## 🚀 Déploiement Vercel (5 min, gratuit)

### Méthode 1 — Via GitHub (recommandée)

1. Crée un repo GitHub (public ou privé)
2. Upload les fichiers de ce dossier dedans
3. Va sur **vercel.com** → "Add New Project"
4. Connecte ton GitHub → sélectionne le repo
5. Framework: **Other** (site statique)
6. Clique **Deploy** → ton site est en ligne en 30 secondes

### Méthode 2 — Via Vercel CLI (direct)

```bash
# Installe Vercel CLI
npm i -g vercel

# Dans ce dossier
vercel

# Suis les instructions (login, projet name...)
# Ton URL sera: https://caps-xxx.vercel.app
```

## 📁 Structure

```
caps-site/
├── index.html       ← site complet (tout en un fichier)
├── vercel.json      ← config Vercel
├── public/
│   └── splats/      ← dossier pour tes fichiers .splat/.ply
└── README.md
```

## 🎩 Ajouter tes Gaussian Splats

### Option A — Via l'interface web (upload direct)
1. Ouvre ton site déployé
2. Section "Ajouter un Splat" en bas de page
3. Glisse ton fichier `.splat` ou `.ply`
4. Remplis le nom + technique → "Ajouter à la collection"
⚠️ Les splats uploadés sont stockés localement dans le navigateur (blob URL).
Ils disparaissent au rechargement. Pour les rendre permanents → Option B.

### Option B — Hébergement permanent des splats

**Solution la plus simple : Cloudflare R2 (gratuit jusqu'à 10 Go)**
1. cloudflare.com → R2 → Create bucket (ex: `caps-splats`)
2. Active "Public access"
3. Upload ton .splat → copie l'URL publique
4. Dans `index.html`, modifie la liste `caps` :
```js
{ id: 'cap1', name: 'Soleil Levant', splatUrl: 'https://pub-xxx.r2.dev/soleil-levant.splat', ... }
```

**Ou via GitHub + Vercel (fichiers < 100 Mo)**
1. Met tes `.splat` dans `public/splats/`
2. Push sur GitHub → Vercel redéploie automatiquement
3. URL: `https://ton-site.vercel.app/splats/nom.splat`

## 🔧 Formats supportés

| Format | Source | Taille typique |
|--------|--------|----------------|
| `.splat` | Luma AI export, Polycam | 50-200 Mo |
| `.ply`   | Tous les outils GS      | 200-500 Mo |
| `.spz`   | Polyvia3D converter     | 15-50 Mo ← recommandé web |

💡 Convertis tes `.ply` en `.spz` sur **polyvia3d.com/splat-convert/ply-to-spz**
pour des fichiers 10x plus légers.

## 📦 Stack technique

- HTML/CSS/JS vanilla — zéro dépendance build
- `@mkkellogg/gaussian-splats-3d` — viewer 3D WebGL
- Luma AI — génération des splats
- Vercel — hébergement gratuit
- localStorage — persistance légère des métadonnées
