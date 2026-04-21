/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Global app UI uses Inter everywhere. Course themes override
        // .font-serif / .font-sans inside [data-surface="themed"] via
        // app.css — Tailwind's utilities still point here by default.
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      // Colors resolve from --app-rgb-* CSS variables (neutral SaaS
      // defaults, see src/themes/app.css). Subtrees marked
      // data-surface="themed" cascade the active course theme
      // (--bp-rgb-*) into these same tokens, so ReadOnlyBlock output
      // inherits Beauty Pro / Editorial / etc. without class changes.
      colors: {
        canvas: 'rgb(var(--app-rgb-canvas) / <alpha-value>)',
        paper: 'rgb(var(--app-rgb-paper) / <alpha-value>)',
        ink: 'rgb(var(--app-rgb-ink) / <alpha-value>)',
        'ink-soft': 'rgb(var(--app-rgb-ink-soft) / <alpha-value>)',
        'ink-muted': 'rgb(var(--app-rgb-ink-muted) / <alpha-value>)',
        'ink-faint': 'rgb(var(--app-rgb-ink-faint) / <alpha-value>)',
        accent: 'rgb(var(--app-rgb-accent) / <alpha-value>)',
        'accent-deep': 'rgb(var(--app-rgb-accent-deep) / <alpha-value>)',
        rose: 'rgb(var(--app-rgb-rose) / <alpha-value>)',
        whisper: 'rgb(var(--app-rgb-whisper) / <alpha-value>)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 260ms ease-out',
        'slide-in-right': 'slide-in-right 320ms cubic-bezier(0.22, 0.61, 0.36, 1)',
        'slide-in-left': 'slide-in-left 320ms cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
