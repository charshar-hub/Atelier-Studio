// Editorial — brighter, cooler, terracotta-accented theme snapshot.
// Tokens mirror editorial.css. Structure (radii, shadows, typography,
// component recipes) inherits from Beauty Pro since those aren't
// overridden for this theme.

const tokens = {
  id: 'editorial',
  name: 'Editorial',
  description:
    'Bright, airy, minimal — warm off-white canvas with terracotta accents. Reads like a magazine.',

  color: {
    canvas: '#FDFBF7',
    paper: '#F4F1EA',
    ink: '#0A0A0A',
    inkSoft: '#3F3F46',
    inkMuted: '#71717A',
    inkFaint: '#71717A',
    accent: '#D97757',
    accentDeep: '#A85D41',
    rose: '#E8B3A0',
    whisper: '#E7E5E4',
    bodyText: '#0A0A0A',
    placeholder: '#71717A',
  },
};

export const editorial = Object.freeze(tokens);
export default editorial;
