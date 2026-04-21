// Theme registry + runtime switcher.
//
// Themes are frozen snapshots — nothing in this file, or anywhere else,
// should mutate a theme object once registered. To introduce a new
// aesthetic, add a new file under src/themes/ and register it here.

import { beautyPro } from './beauty-pro';
import { softDark } from './soft-dark';
import { creatorClean } from './creator-clean';
import { educationClassic } from './education-classic';
import { wellnessCalm } from './wellness-calm';
import { blush } from './blush';

export const THEMES = Object.freeze({
  'beauty-pro': beautyPro,
  'soft-dark': softDark,
  'creator-clean': creatorClean,
  'education-classic': educationClassic,
  'wellness-calm': wellnessCalm,
  blush,
});

// Ordered for UI pickers.
export const THEME_LIST = Object.freeze([
  beautyPro,
  softDark,
  creatorClean,
  educationClassic,
  wellnessCalm,
  blush,
]);

// Legacy id → current id. Keeps existing courses (saved before a
// rename) pointing at the right theme. Consulted in App.jsx when
// loading a course.
const LEGACY_THEME_IDS = Object.freeze({
  'minimal-dark': 'soft-dark',
});

export function resolveThemeId(id) {
  if (!id) return null;
  const migrated = LEGACY_THEME_IDS[id] || id;
  return THEMES[migrated] ? migrated : null;
}

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

// ─── Global light/dark mode ───
// Separate from the course theme system. Dark mode is NOT a theme —
// it toggles the app chrome only (Topbar / Sidebar / AIPanel / modals
// / Homepage). Inside [data-surface="themed"] the active course theme
// overrides, so dark mode doesn't leak into course output.

const MODE_STORAGE_KEY = 'ayuai.mode';
export const MODES = ['light', 'dark'];
export const DEFAULT_MODE = 'light';

export function applyMode(mode = DEFAULT_MODE) {
  if (typeof document === 'undefined') return;
  const next = mode === 'dark' ? 'dark' : 'light';
  if (next === 'dark') {
    document.documentElement.setAttribute('data-mode', 'dark');
  } else {
    document.documentElement.removeAttribute('data-mode');
  }
  try {
    localStorage.setItem(MODE_STORAGE_KEY, next);
  } catch {
    // localStorage can throw in private mode / SSR — ignore.
  }
}

export function loadStoredMode() {
  if (typeof localStorage === 'undefined') return DEFAULT_MODE;
  try {
    const raw = localStorage.getItem(MODE_STORAGE_KEY);
    return MODES.includes(raw) ? raw : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}
