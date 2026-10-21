# BA-Network

Interactive Barabási–Albert (preferential attachment) network visualisation built with React, D3 and Vite.

Live demo: https://dieWehmut.github.io/BA-Network/

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
