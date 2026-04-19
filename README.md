# Atelier Studio

A desktop-first web app for beauty educators. Soft luxury aesthetic with neutral beige, cream, and brown tones.

## Quick start

Open the project folder in VS Code, then in the terminal run:

```bash
npm install
npm run dev
```

Then open the URL that Vite prints (usually http://localhost:5173).

## Tech stack

- React 18 (via Vite)
- Tailwind CSS 3
- Cormorant Garamond (serif) + Inter Tight (sans) from Google Fonts

## Project structure

```
atelier-studio/
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── index.html
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── data/
    │   └── dummyData.js
    └── components/
        ├── Topbar.jsx
        ├── Sidebar.jsx
        ├── Canvas.jsx
        └── AIPanel.jsx
```

## Design tokens

All colors live in `tailwind.config.js` under `theme.extend.colors`. Change them there once and the whole app updates:

- `canvas` — warm cream background
- `paper` — softer beige for sidebars
- `ink` — deep espresso text
- `ink-soft` / `ink-muted` — secondary text
- `accent` — warm camel for CTAs
- `rose` — feminine accent
- `whisper` — borders and dividers
