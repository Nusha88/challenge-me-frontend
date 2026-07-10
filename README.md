# Ignite — Frontend

Vue 3 + Vuetify 3 PWA for the Ignite / XHappyDays gamified challenge & habit tracker.
Built with Vite, Pinia, vue-router and vue-i18n. Talks to the Express/MongoDB
backend (`challenge-me-backend-main`).

## Tech stack

- **Vue 3** (Composition API, `<script setup>`)
- **Vuetify 3** — tree-shaken via `vite-plugin-vuetify` (auto-import)
- **Pinia** — state (`stores/user`, `stores/watchedChallenges`)
- **vue-router** — routes are lazy-loaded; protected routes use `meta.requiresAuth`
- **vue-i18n** — EN/RU locales in `src/locales`
- **axios** — single instance in `src/services/api.js` (Bearer token interceptor)
- Service worker (`public/sw.js`) for push notifications

## Project layout

```
src/
  components/     UI + page components (feature subfolders: all-challenges, home, heroes, ...)
  composables/    reusable logic (use*)
  stores/         Pinia stores
  services/api.js backend client
  utils/          pure helpers
  locales/        i18n messages
  router/         route table + auth guard
```

## Setup

```sh
npm install
cp .env.example .env   # then fill in values
```

## Environment variables

All client vars are prefixed `VITE_` and are embedded into the bundle at build time.
See `.env.example`. Key ones:

- `VITE_API_BASE_URL` — backend API base (include `/api`). Defaults to localhost in dev, Render in prod.
- `VITE_PUBLIC_APP_URL` — public origin used to build share links.
- `VITE_IMGBB_API_KEY` — ImgBB key for client-side image uploads. **Ships in the bundle**; rotate the previously committed key and prefer proxying uploads through the backend.

## Scripts

```sh
npm run dev       # dev server with HMR
npm run build     # production build → dist/
npm run preview   # preview the production build
npm run lint      # eslint --fix
npm run format    # prettier --write src/
```
