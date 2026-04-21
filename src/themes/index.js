// Theme registry + runtime switcher.
//
// Themes are frozen snapshots — nothing in this file, or anywhere else,
// should mutate a theme object once registered. To introduce a new
// aesthetic, add a new file under src/themes/ and register it here.

import { beautyPro } from './beauty-pro';

export const THEMES = Object.freeze({
  'beauty-pro': beautyPro,
});

export const DEFAULT_THEME_ID = 'beauty-pro';

export function getTheme(id) {
  return THEMES[id] || THEMES[DEFAULT_THEME_ID];
}

// Set `data-theme` on <html> so CSS scoped to [data-theme="<id>"] takes
// effect. CSS variable blocks defined at :root stay as defaults, so the
// call is a no-op visually when the id matches whatever :root already
// serves — exactly the situation for Beauty Pro on a fresh boot.
export function applyTheme(id = DEFAULT_THEME_ID) {
  if (typeof document === 'undefined') return;
  const theme = getTheme(id);
  document.documentElement.setAttribute('data-theme', theme.id);
}
