// [env] logs — MUST run before any other import, so that even if a downstream
// module (e.g. supabase.js) throws at init, these lines still reach the
// browser console in production. Do NOT move below the imports.
console.log('[env] VITE_SUPABASE_URL set:', !!import.meta.env.VITE_SUPABASE_URL);
console.log('[env] VITE_SUPABASE_ANON_KEY set:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('[env] MODE:', import.meta.env.MODE);
console.log('[env] raw URL:', import.meta.env.VITE_SUPABASE_URL);

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './themes/beauty-pro.css';
import { applyTheme } from './themes';

// Beauty Pro is the frozen snapshot of the current aesthetic. Setting it
// early adds `data-theme="beauty-pro"` to <html> so future theme-aware
// styles scope correctly. Doesn't change visuals until a different theme
// is applied.
applyTheme('beauty-pro');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
