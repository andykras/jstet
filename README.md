# JSTET

Browser puzzle game built with **Vue 2.7**, **Vuex 3**, and **Vite 7**.
The existing Vue Options API components and game engine are unchanged.

![themes](assets/screenshots/themes.png)

## Requirements

Node.js 20.19+ or 22.12+ (Vite 7 requirement), npm.

## Local development

```sh
npm install
npm run dev
```

Open http://localhost:1337/ . The legacy command `npm run serve` is also supported.

## Production build

```sh
npm run build
npm run preview
```

The static site is built in `dist/`. Relative asset paths are retained so it can be hosted from a subdirectory.
The existing `public/manifest.json` and PWA icons are copied as static assets.
The production build generates `service-worker.js` for offline caching, and the existing registration callbacks remain in place. The service worker requires HTTPS or localhost.

## Checks

```sh
npm run lint
npm run test:unit
```

The unit tests cover two pure game utilities. They do not replace an in-browser gameplay smoke test.

## Migration notes

* Vue 2.6 -> 2.7 is required by `@vitejs/plugin-vue2`; this does not migrate the app to Vue 3.
* Global component auto-registration now uses `import.meta.glob` instead of webpack `require.context`.
* `vue.config.js` and Vue CLI dependencies have been removed.
* PWA generation uses `vite-plugin-pwa`. Registration remains in `src/registerServiceWorker.js`.
* Vue 2 and its Vite plugin are end-of-life; a Vue 3 migration can be planned separately.
