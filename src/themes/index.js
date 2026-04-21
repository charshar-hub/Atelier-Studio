// Theme registry + runtime switcher.
//
// Themes are frozen snapshots — nothing in this file, or anywhere else,
// should mutate a theme object once registered. To introduce a new
// aesthetic, add a new file under src/themes/ and register it here.

import { beautyPro } from './beauty-pro';
import { editorial } from './editorial';

export const THEMES = Object.freeze({
  'beauty-pro': beautyPro,
  editorial,
});

// Ordered for UI pickers.
export const THEME_LIST = Object.freeze([beautyPro, editorial]);

export const DEFAULT_THEME_ID = 'beauty-pro';

export function getTheme(id) {
  return THEMES[id] || THEMES[DEFAULT_THEME_ID];
}

// Set `data-theme` on <html> so [data-theme="<id>"] CSS blocks take
// effect. Each theme's CSS file is imported once from main.jsx so all
// variable blocks are always present in the bundle — switching is free.
export function applyTheme(id = DEFAULT_THEME_ID) {
  if (typeof document === 'undefined') return;
  const theme = getTheme(id);
  document.documentElement.setAttribute('data-theme', theme.id);
}
