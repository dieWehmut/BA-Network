# BA-Network

Interactive Barabási–Albert (preferential attachment) network visualisation built with React, D3 and Vite.

Live demo: https://dieWehmut.github.io/BA-Network/

## Design

The interface follows the console look of [dieWehmut.github.io](https://dieWehmut.github.io/):

- pure black canvas with a monospace (terminal) type stack
- a single green accent (`#1fc41f`) for markers, figures and controls
- square corners, hairline borders, no shadows or gradients
- uppercase section markers (LINKS / CONTENT / RUNTIME) above label/value rows
- a command strip with a `>_` prompt and a token breadcrumb

Design tokens live in `src/styles/index.css` (`--site-*` and `--console-*`).
Dark is the default palette; the header button switches to the light one and the
choice is persisted in `localStorage` under `theme`.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deployment

Every push to `main` triggers the [`Deploy to GitHub Pages`](.github/workflows/deploy.yml) workflow,
which builds the app with Vite and publishes `dist/` to GitHub Pages.
