/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter Tight', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      colors: {
        canvas: '#FAF6F0',
        paper: '#F3ECE1',
        // Typography hierarchy — three readable tiers over the warm paper background.
        ink: '#2B2118', // primary — headings, key content
        'ink-soft': '#5A4A3F', // secondary — descriptions, assistant text, italic body
        'ink-muted': '#8A7666', // tertiary — placeholders, subtle labels
        // ink-faint used to be #A3958A (too light). Now aliased to the tertiary
        // tier so the hundreds of `text-ink-faint` usages across the app lift
        // to readable contrast without a codebase-wide rename.
        'ink-faint': '#8A7666',
        accent: '#B8936A',
        'accent-deep': '#8A6A47',
        rose: '#D4A89A',
        whisper: '#E8DFD2',
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
