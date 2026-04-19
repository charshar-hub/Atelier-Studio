// Dummy data used across the app.
// Replace these with real state or API calls later.

export const courseMeta = {
  title: 'Korean Lash Lift Masterclass',
  status: 'DRAFT',
  moduleNumber: 2,
  moduleCount: 4,
  moduleTitle: 'The Lift & Set Technique',
  moduleSubtitle:
    'The heart of every Korean lash lift — where precision meets patience. Four lessons walking students from rod selection through the final reveal.',
  savedAt: 'Saved 2m ago',
};

export const lessons = [
  {
    id: 'l1',
    number: 1,
    title: 'Choosing the right rod size',
    duration: '5 MIN',
    summary:
      'A lash lift lives and dies by the rod. Walk through four rod sizes and the "pinch test" that never fails.',
    subBlocks: [
      { label: 'Script', content: '"Hold the rod against the lash line..."', tint: '#B8936A' },
      { label: 'Demo steps', content: '3 steps · measure, compare, confirm', tint: '#D4A89A' },
      { label: 'Common mistakes', content: 'Choosing too small for drama', tint: '#C9A876' },
      { label: 'Pro tip', content: 'Shorter rod = softer lift', tint: '#A89178' },
    ],
  },
  {
    id: 'l2',
    number: 2,
    title: 'Prepping the lash line',
    duration: '8 MIN',
    summary:
      'Cleansing, drying, and the two-step adhesive prep that makes everything after it easier.',
    subBlocks: [],
  },
  {
    id: 'l3',
    number: 3,
    title: 'Applying the lifting lotion…',
    duration: '',
    summary: '',
    subBlocks: [],
    empty: true,
  },
];

export const sidebarWorkspace = [
  { key: 'overview', label: 'Course Overview' },
  { key: 'modules', label: 'Modules', count: 4 },
  { key: 'teach', label: 'Teach Mode' },
];

export const sidebarVoice = [
  { key: 'style', label: 'Style Kit', dot: true },
  { key: 'saved', label: 'Saved Content', disabled: true, hint: 'Soon' },
];

export const styleProfile = {
  label: 'STYLE ACTIVE',
  title: 'Warm & Mentor-like',
  subtitle: 'Based on 3 past courses',
};

export const generateActions = [
  { key: 'g-lesson', label: 'Generate full lesson', primary: true },
  { key: 'g-demo', label: 'Generate demo steps' },
];

export const refineActions = [
  { key: 'r-improve', label: 'Improve content' },
  { key: 'r-style', label: 'Match my style', highlight: true },
  { key: 'r-tone', label: 'Rewrite in my tone' },
  { key: 'r-simplify', label: 'Simplify language' },
];

export const lastGenerated =
  '"Let\'s take our time with this — a good lift begins before the rod ever touches the lash."';
