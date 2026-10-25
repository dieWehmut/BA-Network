# BA-Network

Interactive Barabási–Albert (preferential attachment) network visualisation built with React, D3 and Vite.

Live demo: https://dieWehmut.github.io/BA-Network/

## Design

The interface follows the console look of [dieWehmut.github.io](https://dieWehmut.github.io/):

- pure black canvas with a monospace type stack
- a single green accent (`#1fc41f`) for markers, figures and controls
- square corners, hairline dividers, no shadows or gradients
- uppercase section markers (LINKS / CONTENT / RUNTIME) above label/value rows

The page is exactly **four aligned boxes** in a 2×2 grid:

| | left | right |
| --- | --- | --- |
| top | network graph | dashboard (LINKS / CONTENT / RUNTIME) |
| bottom | degree distribution | controls + project meta rows |

The project meta rows (uptime, copyright, GitHub) close the bottom-right box, so
there is no separate footer strip. Both charts measure their own box with a
`ResizeObserver`, which keeps the type at real pixel sizes instead of scaling it
with the viewBox. Below 720px the grid stacks into a single column.

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
