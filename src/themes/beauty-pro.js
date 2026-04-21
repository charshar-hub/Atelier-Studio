// Beauty Pro — locked snapshot of the current Atelier Studio design.
//
// This file is a FROZEN RECORD. Treat it as a design contract: once
// shipped, values here must not change. New global design work adds a
// new theme file instead of mutating this one.
//
// Every token here mirrors exactly what shipped prior to the theme
// system landing (see tailwind.config.js + index.css + component usages
// at commit 4331bb4). If you're thinking "I'll just nudge this colour",
// stop — create a new theme instead.

const tokens = {
  id: 'beauty-pro',
  name: 'Beauty Pro',
  description:
    'The original Atelier Studio aesthetic — warm cream, espresso ink, camel accent. Built for beauty educators.',

  color: {
    // Backgrounds
    canvas: '#FAF6F0', // page / app background — warm cream
    paper: '#F3ECE1', // sidebars, hover fills — softer beige

    // Typography hierarchy — three readable tiers over the warm paper bg.
    ink: '#2B2118', // primary: headings, key content
    inkSoft: '#5A4A3F', // secondary: descriptions, italic body
    inkMuted: '#8A7666', // tertiary: placeholders, subtle labels
    inkFaint: '#8A7666', // alias of tertiary (historical name)

    // Accents
    accent: '#B8936A', // primary accent — warm camel
    accentDeep: '#8A6A47', // accent hover / deeper camel
    rose: '#D4A89A', // feminine secondary accent
    whisper: '#E8DFD2', // borders + dividers

    // Intent colours (surface, used implicitly through /opacity modifiers).
    tipBorder: 'rgba(212, 168, 154, 0.30)', // rose/30
    calloutBorder: 'rgba(184, 147, 106, 0.30)', // accent/30
    calloutSurface: 'rgba(243, 236, 225, 0.60)', // paper/60

    // Typography inherited from legacy body style (`src/index.css`).
    bodyText: '#3A2E26',
    placeholder: '#8A7666',
  },

  font: {
    sans: "'Inter Tight', system-ui, sans-serif",
    serif: "'Cormorant Garamond', Georgia, serif",
    // Weights actually loaded via Google Fonts link in index.html.
    weights: { sans: [400, 500], serif: [400, 500] },
  },

  // Canonical type styles used across the app. Numbers aren't exhaustive —
  // they're the anchors that give the theme its feel. Freehand sizes in
  // components fall between these.
  type: {
    displaySerif: {
      family: 'serif',
      size: '44px',
      lineHeight: '1.05',
      tracking: '-0.01em',
      italic: false,
    },
    heading: {
      family: 'serif',
      size: '32px',
      lineHeight: '1.1',
      tracking: '-0.01em',
    },
    subheading: {
      family: 'serif',
      size: '23px',
      lineHeight: '1.25',
    },
    bodyLarge: { family: 'sans', size: '17px', lineHeight: '1.75' },
    body: { family: 'sans', size: '15px', lineHeight: '1.7' },
    small: { family: 'sans', size: '12px', lineHeight: '1.55' },
    // Eyebrow labels — the small uppercase tracked-out markers above cards.
    eyebrow: {
      family: 'sans',
      size: '10px',
      tracking: '0.25em',
      transform: 'uppercase',
    },
  },

  radius: {
    sm: '6px', // rounded-md
    md: '10px', // rounded-[10px] — add-block buttons, callouts
    lg: '12px', // rounded-[12px] — lesson cards
    xl: '14px', // rounded-[14px] — style-kit cards
    pill: '9999px',
  },

  shadow: {
    // The bespoke shadows sprinkled through the app.
    card: '0 1px 3px rgba(58,46,38,0.04)',
    cardSubtle: '0 1px 3px rgba(58,46,38,0.03)',
    cardHover: '0 4px 16px -8px rgba(58,46,38,0.08)',
    popover: '0 8px 28px -12px rgba(58,46,38,0.20)',
    toolbar: '0 4px 16px -6px rgba(58,46,38,0.18)',
    deep: '0 6px 20px -10px rgba(58,46,38,0.25)',
    welcome: '0 2px 10px rgba(58,46,38,0.18)',
    // Focus ring used on selected lesson cards + focused split blocks.
    focusRing: '0 0 0 3px rgba(184,147,106,0.08)',
    focusRingFirm: '0 0 0 3px rgba(184,147,106,0.16)',
  },

  // How surfaces look — not raw tokens, but named recipes components use.
  surfaces: {
    card: {
      background: '#FFFFFF',
      border: '#E8DFD2',
      radius: '12px',
      shadow: '0 1px 3px rgba(58,46,38,0.04)',
    },
    cardSelected: {
      background: '#FFFFFF',
      borderColor: 'rgba(184,147,106,0.60)',
      shadow: '0 0 0 3px rgba(184,147,106,0.08)',
    },
    dashedDrop: {
      background: 'rgba(243,236,225,0.20)',
      borderColor: '#E8DFD2',
      borderStyle: 'dashed',
    },
  },

  buttons: {
    // Primary — espresso on cream.
    primary: {
      background: '#2B2118',
      foreground: '#FAF6F0',
      hoverBackground: '#2A1F18',
      height: '32px',
      padding: '0 16px',
      radius: '6px',
      fontSize: '12px',
      tracking: '0.02em',
    },
    // Secondary / outline — neutral on canvas.
    secondary: {
      background: 'transparent',
      borderColor: '#E8DFD2',
      foreground: '#5A4A3F',
      hoverBackground: '#F3ECE1',
      hoverForeground: '#2B2118',
      height: '32px',
      padding: '0 12px',
      radius: '6px',
      fontSize: '11px',
    },
    // Pill — used for chips, eyebrow buttons, tags.
    pill: {
      background: '#FAF6F0',
      borderColor: '#E8DFD2',
      foreground: '#5A4A3F',
      hoverBackground: '#F3ECE1',
      height: '28px',
      padding: '0 14px',
      radius: '9999px',
      fontSize: '11px',
      tracking: '0.02em',
    },
  },

  motion: {
    fadeUp: 'fade-up 260ms ease-out',
    slideInRight: 'slide-in-right 320ms cubic-bezier(0.22, 0.61, 0.36, 1)',
    slideInLeft: 'slide-in-left 320ms cubic-bezier(0.22, 0.61, 0.36, 1)',
    hover: '150ms ease-out',
  },

  // Component-scoped styling — not every component, just the surfaces
  // this theme explicitly locks (editor, student preview, block cards).
  components: {
    editor: {
      page: '#FAF6F0',
      padding: '40px 56px', // px-14 py-10
      sidebar: {
        background: '#F3ECE1',
        borderColor: '#E8DFD2',
        width: '260px',
        eyebrowColor: '#8A7666',
      },
      topbar: {
        height: '56px',
        background: '#FAF6F0',
        borderColor: '#E8DFD2',
      },
      lessonCard: {
        background: '#FFFFFF',
        border: '#E8DFD2',
        selectedBorder: 'rgba(184,147,106,0.60)',
        radius: '12px',
        padding: '24px',
        numberBadge: {
          background: '#F3ECE1',
          foreground: '#8A7666',
          font: 'serif italic',
        },
      },
    },
    studentPreview: {
      page: '#FAF6F0',
      contentMaxWidth: '740px',
      sidebarWidth: '320px',
      hero: {
        titleFamily: 'serif',
        titleSize: '44px',
        eyebrowColor: '#B8936A',
        eyebrowTracking: '0.28em',
      },
      sectionCard: {
        background: '#FFFFFF',
        radius: '12px',
        padding: '24px 28px',
        shadow: '0 1px 3px rgba(58,46,38,0.04)',
        leftBorderWidth: '3px', // coloured with block.tint
      },
      progressBar: {
        track: '#E8DFD2',
        fill: '#B8936A',
        height: '4px',
      },
      completeButton: {
        idleBackground: '#FFFFFF',
        idleForeground: '#2B2118',
        activeBackground: '#2B2118',
        activeForeground: '#FAF6F0',
        radius: '9999px',
      },
    },
    block: {
      text: {
        size: '16px',
        lineHeight: '1.7',
      },
      heading: {
        family: 'serif',
        size: '24px',
        lineHeight: '1.2',
        tracking: '-0.01em',
      },
      tip: {
        border: 'rgba(212,168,154,0.30)',
        background: 'rgba(250,246,240,0.60)',
        eyebrowColor: '#D4A89A',
      },
      callout: {
        border: 'rgba(184,147,106,0.30)',
        background: 'rgba(243,236,225,0.60)',
        eyebrowColor: '#B8936A',
      },
      divider: {
        color: '#E8DFD2',
      },
      image: {
        radius: '8px',
      },
      split: {
        background: 'rgba(243,236,225,0.20)',
        border: '#E8DFD2',
        emptyColumnBorder: '#E8DFD2',
        emptyColumnBackground: 'rgba(255,255,255,0.70)',
        toolbar: {
          background: '#FFFFFF',
          border: '#E8DFD2',
          shadow: '0 4px 16px -6px rgba(58,46,38,0.18)',
        },
      },
    },
  },
};

export const beautyPro = Object.freeze(tokens);
export default beautyPro;
