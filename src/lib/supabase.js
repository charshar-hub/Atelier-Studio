import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Unconditional logs — run in dev AND prod. Do NOT wrap these in any
// NODE_ENV / MODE / DEV guard, or Vite's dead-code-elimination will strip
// them from the production bundle.
console.log('[supabase] URL:', url);
console.log('[supabase] KEY exists:', !!anonKey);

export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured) {
  const missing = [
    !url && 'VITE_SUPABASE_URL',
    !anonKey && 'VITE_SUPABASE_ANON_KEY',
  ]
    .filter(Boolean)
    .join(', ');
  // Loud, but do NOT throw — a throw here kills the whole module graph
  // before other debug logs (in main.jsx, App.jsx, styleKit.js) can run,
  // so prod looks "silent" to the user. Emit the error and let downstream
  // code render its empty-state / error UI.
  console.error(
    `[supabase] Missing env vars: ${missing}. ` +
      'Set them in Vercel → Project Settings → Environment Variables ' +
      '(Production + Preview + Development) and redeploy.',
  );
}

export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null;
