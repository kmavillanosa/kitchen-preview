# Kitchen Preview

2D kitchen preview tool: pick textures for countertops, backsplash, cabinet color, and floors and see a composed preview image. Admin manages textures and preview scenes via Decap CMS. Deploys to GitHub Pages.

## Stack

- **Vite** + **React** (TypeScript)
- **Decap CMS** (Git-based) for managing textures and scenes
- **GitHub Pages** (static deploy)

## Local setup

```bash
npm install
npm run dev
```

Open `http://localhost:5173/kitchen-preview/` (or the URL Vite prints).

## Build & deploy

- **Build:** `npm run build` → output in `dist/`
- **Deploy:** Push to `main`; the GitHub Action builds and deploys to GitHub Pages.

In the repo: **Settings → Pages → Build and deployment → Source** set to **GitHub Actions**.

## Admin (Decap CMS)

1. Open `https://<your-username>.github.io/kitchen-preview/admin/` (or locally after build: `/kitchen-preview/admin/`).
2. Log in with GitHub (only users with write access to the repo can edit).
3. Edit **Textures** and **Preview images (Scenes)**. Changes are committed to the repo; the next deploy publishes them.

**One-time:** In `public/admin/config.yml` set `backend.repo` to your repo (e.g. `myuser/kitchen-preview`). For GitHub OAuth you may need a proxy (see [Decap CMS + GitHub Pages](https://decapcms.org/docs/github-backend/)).

## Assets

- **Scenes:** Base kitchen image + four mask PNGs. See `public/scenes/README.md`.
- **Textures:** Optional texture images in `public/textures/`; color options use hex values only.

The app falls back to bundled content if `public/content/textures.json` or `public/content/scenes.json` are missing (e.g. before first CMS save).
