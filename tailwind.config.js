/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter Tight', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      // Colors resolve from --bp-rgb-* CSS variables so themes can swap by
      // overriding the variables under [data-theme="<id>"]. The RGB channel
      // form keeps Tailwind's /<alpha> opacity modifiers working.
      // Defaults (Beauty Pro) live in src/themes/beauty-pro.css.
      colors: {
        canvas: 'rgb(var(--bp-rgb-canvas) / <alpha-value>)',
        paper: 'rgb(var(--bp-rgb-paper) / <alpha-value>)',
        ink: 'rgb(var(--bp-rgb-ink) / <alpha-value>)',
        'ink-soft': 'rgb(var(--bp-rgb-ink-soft) / <alpha-value>)',
        'ink-muted': 'rgb(var(--bp-rgb-ink-muted) / <alpha-value>)',
        'ink-faint': 'rgb(var(--bp-rgb-ink-faint) / <alpha-value>)',
        accent: 'rgb(var(--bp-rgb-accent) / <alpha-value>)',
        'accent-deep': 'rgb(var(--bp-rgb-accent-deep) / <alpha-value>)',
        rose: 'rgb(var(--bp-rgb-rose) / <alpha-value>)',
        whisper: 'rgb(var(--bp-rgb-whisper) / <alpha-value>)',
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
