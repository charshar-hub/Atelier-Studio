import { useCallback, useEffect, useRef, useState } from 'react';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import AIPanel from './components/AIPanel';
import StyleKit from './components/StyleKit';
import StyleComparison from './components/StyleComparison';
import StyleMatchDialog from './components/StyleMatchDialog';
import ExportModal from './components/ExportModal';
import StructuredOutlineModal from './components/StructuredOutlineModal';
import ExpansionPreviewModal from './components/ExpansionPreviewModal';
import Dashboard from './components/Dashboard';
import StudentPreview from './components/StudentPreview';
import TeachMode from './components/TeachMode';
import CourseOverview from './components/CourseOverview';
import Teach from './components/Teach';
import Homepage from './components/Homepage';
import Onboarding, { clearOnboardingDraft } from './components/Onboarding';
import OnboardingIntro from './components/OnboardingIntro';
import { isSupabaseConfigured } from './lib/supabase';
import * as coursesApi from './lib/courses';

const BLOCK_TYPES = {
  text: { label: 'Text', defaultLabel: 'Notes', tint: '#B8936A' },
  steps: { label: 'Demo steps', defaultLabel: 'Demo steps', tint: '#D4A89A' },
  tips: { label: 'Tips', defaultLabel: 'Tips', tint: '#C9A876' },
  custom: { label: 'Custom section', defaultLabel: 'Section', tint: '#A89178' },
  visual: { label: 'Visual example', defaultLabel: 'Visual example', tint: '#C9A876' },
  comparison: {
    label: 'Comparison',
    defaultLabel: 'Correct vs. incorrect',
    tint: '#D4A89A',
  },
};

// The four canonical blocks that exist on a fresh lesson and map to AI payload
// keys. `role` is what keeps AI response merging working when users rename
// ("Script" → "My opening") — labels are cosmetic, roles are semantic.
const CANONICAL_BLOCKS = [
  { type: 'text', role: 'script', label: 'Script', tint: '#B8936A' },
  { type: 'steps', role: 'demoSteps', label: 'Demo steps', tint: '#D4A89A' },
  { type: 'tips', role: 'mistakes', label: 'Common mistakes', tint: '#C9A876' },
  { type: 'tips', role: 'tip', label: 'Pro tip', tint: '#A89178' },
];

const LEGACY_LABEL_TO_CANONICAL = {
  Script: CANONICAL_BLOCKS[0],
  'Demo steps': CANONICAL_BLOCKS[1],
  'Common mistakes': CANONICAL_BLOCKS[2],
  'Pro tip': CANONICAL_BLOCKS[3],
};

const ROLE_TO_API_KEY = {
  script: 'script',
  demoSteps: 'demoSteps',
  mistakes: 'commonMistakes',
  tip: 'proTip',
};

const ROLE_TO_LEGACY_LABEL = {
  script: 'Script',
  demoSteps: 'Demo steps',
  mistakes: 'Common mistakes',
  tip: 'Pro tip',
};

function makeId() {
  return `l-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function makeModuleId() {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function makeBlockId() {
  return `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function makeItemId() {
  return `i-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

const IMAGE_WIDTHS = ['small', 'medium', 'large', 'full'];

function normalizeImage(img) {
  if (!img || typeof img !== 'object' || typeof img.src !== 'string') return null;
  return {
    src: img.src,
    width: IMAGE_WIDTHS.includes(img.width) ? img.width : 'full',
  };
}

function normalizeStepItem(raw) {
  return {
    id: raw?.id || makeItemId(),
    text: typeof raw?.text === 'string' ? raw.text : '',
    image: normalizeImage(raw?.image),
  };
}

function splitLegacyStepsContent(content) {
  if (typeof content !== 'string' || !content.trim()) return [];
  const lines = content
    .split(/\n+|\s*·\s*/)
    .map((s) => s.replace(/^\s*\d+\s*[.)]\s*/, '').trim())
    .filter(Boolean);
  if (lines.length === 0) return [{ id: makeItemId(), text: content.trim(), image: null }];
  return lines.map((text) => ({ id: makeItemId(), text, image: null }));
}

function blockTypeDefaults(type) {
  switch (type) {
    case 'steps':
      return { items: [] };
    case 'visual':
      return { image: null, caption: '', notes: [], layout: 'standard' };
    case 'comparison':
      return {
        left: { image: null, label: 'Correct' },
        right: { image: null, label: 'Incorrect' },
        size: 'full',
      };
    default:
      return { content: '' };
  }
}

function makeCanonicalBlock(def) {
  return {
    id: makeBlockId(),
    type: def.type,
    role: def.role,
    label: def.label,
    tint: def.tint,
    ...blockTypeDefaults(def.type),
  };
}

// Converts one section from /api/structureLesson's sections[] shape into a
// lesson sub-block. bullet_points → a steps block (rendered as a list).
// expand → a text block holding the educator notes.
function outlineSectionToBlock(section) {
  const title = typeof section?.title === 'string' ? section.title.trim() : '';
  if (section?.type === 'expand') {
    return {
      id: makeBlockId(),
      type: 'text',
      label: title || 'Deeper Understanding',
      tint: BLOCK_TYPES.text.tint,
      content: typeof section?.notes === 'string' ? section.notes : '',
    };
  }
  const items = Array.isArray(section?.items)
    ? section.items
        .filter((t) => typeof t === 'string' && t.trim())
        .map((text) => ({ id: makeItemId(), text: text.trim(), image: null }))
    : [];
  return {
    id: makeBlockId(),
    type: 'steps',
    label: title || 'Section',
    tint: BLOCK_TYPES.steps.tint,
    items,
  };
}

function normalizeBlock(raw) {
  const fallbackTint = (type) => BLOCK_TYPES[type]?.tint || '#A89178';

  // Already normalized (has id + type) — round-trip type-specific fields.
  if (raw && raw.id && raw.type) {
    const base = {
      id: raw.id,
      type: raw.type,
      role: raw.role,
      label: raw.label || BLOCK_TYPES[raw.type]?.defaultLabel || 'Section',
      tint: raw.tint || fallbackTint(raw.type),
    };
    if (raw.type === 'steps') {
      const items = Array.isArray(raw.items) ? raw.items.map(normalizeStepItem) : [];
      if (items.length === 0 && typeof raw.content === 'string' && raw.content.trim()) {
        return { ...base, items: splitLegacyStepsContent(raw.content) };
      }
      return { ...base, items };
    }
    if (raw.type === 'visual') {
      return {
        ...base,
        image: normalizeImage(raw.image),
        caption: typeof raw.caption === 'string' ? raw.caption : '',
        notes: Array.isArray(raw.notes)
          ? raw.notes.filter((n) => typeof n === 'string')
          : [],
        layout: raw.layout === 'split' ? 'split' : 'standard',
      };
    }
    if (raw.type === 'comparison') {
      const side = (s, fallback) => ({
        image: normalizeImage(s?.image),
        label: typeof s?.label === 'string' && s.label.trim() ? s.label : fallback,
      });
      return {
        ...base,
        left: side(raw.left, 'Correct'),
        right: side(raw.right, 'Incorrect'),
        size: IMAGE_WIDTHS.includes(raw.size) ? raw.size : 'full',
      };
    }
    return { ...base, content: raw.content || '' };
  }
  // Legacy block: identify canonical by label.
  const legacyLabel = raw?.label || '';
  const canonical = LEGACY_LABEL_TO_CANONICAL[legacyLabel];
  if (canonical) {
    const base = {
      id: makeBlockId(),
      type: canonical.type,
      role: canonical.role,
      label: legacyLabel,
      tint: raw?.tint || canonical.tint,
    };
    if (canonical.type === 'steps') {
      return { ...base, items: splitLegacyStepsContent(raw?.content || '') };
    }
    return { ...base, content: raw?.content || '' };
  }
  return {
    id: makeBlockId(),
    type: 'text',
    label: legacyLabel || 'Section',
    tint: raw?.tint || BLOCK_TYPES.text.tint,
    content: raw?.content || '',
  };
}

function normalizeCard(raw) {
  const r = raw || {};
  // Legacy slide shape: {title, points}
  if (Array.isArray(r.points) && !Array.isArray(r.keyPoints)) {
    return {
      title: r.title || '',
      keyPoints: r.points.filter((p) => typeof p === 'string'),
      sayLikeThis: '',
      watchFor: '',
      image: normalizeImage(r.image),
    };
  }
  return {
    title: r.title || '',
    keyPoints: Array.isArray(r.keyPoints)
      ? r.keyPoints.filter((p) => typeof p === 'string')
      : [],
    sayLikeThis: typeof r.sayLikeThis === 'string' ? r.sayLikeThis : '',
    watchFor: typeof r.watchFor === 'string' ? r.watchFor : '',
    image: normalizeImage(r.image),
  };
}

function normalizeLesson(lesson) {
  const raw = Array.isArray(lesson.subBlocks) ? lesson.subBlocks : [];
  const subBlocks = raw.map(normalizeBlock);
  const rawCards = Array.isArray(lesson.cards)
    ? lesson.cards
    : Array.isArray(lesson.slides)
      ? lesson.slides
      : [];
  return {
    id: lesson.id || makeId(),
    number: lesson.number,
    moduleId: lesson.moduleId || '',
    title: lesson.title || '',
    duration: lesson.duration || '',
    summary: lesson.summary || '',
    subBlocks,
    cards: rawCards.map(normalizeCard),
  };
}

function migrateCourseContent(raw) {
  const c = raw || {};
  const overview = c.overview || { ...DEFAULT_OVERVIEW };
  const existingLessons = Array.isArray(c.lessons) ? c.lessons : [];

  if (Array.isArray(c.modules) && c.modules.length > 0) {
    const modules = c.modules.map((m) => ({
      id: m.id || makeModuleId(),
      title: m.title || 'Untitled module',
      subtitle: m.subtitle || '',
    }));
    const fallbackId = modules[0].id;
    const lessons = existingLessons.map((l) => ({
      ...l,
      moduleId: modules.some((m) => m.id === l.moduleId) ? l.moduleId : fallbackId,
    }));
    return { modules, lessons, overview };
  }

  // Legacy shape: derive a single module from meta
  const meta = c.meta || DEFAULT_META;
  const moduleId = makeModuleId();
  return {
    modules: [
      {
        id: moduleId,
        title: meta.moduleTitle || 'Module 1',
        subtitle: meta.moduleSubtitle || '',
      },
    ],
    lessons: existingLessons.map((l) => ({ ...l, moduleId })),
    overview,
  };
}

const STORAGE_KEYS = {
  styleProfile: 'atelier.styleProfile',
  styleSampleText: 'atelier.styleSampleText',
};

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota / access errors
  }
}

const DEFAULT_META = {
  status: 'DRAFT',
  moduleNumber: 1,
  moduleCount: 1,
  moduleTitle: 'Module 1',
  moduleSubtitle:
    'Start building your first module — add lessons, shape your voice, export when ready.',
};

const DEFAULT_OVERVIEW = {
  subtitle: '',
  coverImage: null,
  description: '',
  audience: '',
  value: '',
  learningOutcomes: [],
  pricing: { mode: 'free', price: null },
};

function createDefaultContent() {
  const moduleId = makeModuleId();
  return {
    modules: [{ id: moduleId, title: 'Module 1', subtitle: '' }],
    lessons: [],
    overview: { ...DEFAULT_OVERVIEW },
  };
}

const mockLessonTemplates = [
  {
    title: 'Applying the lifting lotion',
    duration: '10 MIN',
    summary:
      'Timing, thickness, and the gentle brushstroke that coaxes every lash into a clean, uniform curl.',
    script: '"Thin, even coats — we\'re sculpting, not painting. Let the lotion do the work."',
    demoSteps: '4 steps · apply, spread, set timer, monitor',
    commonMistakes: 'Over-saturating the base and lifting too aggressively',
    proTip: 'Warm the lotion briefly between gloved fingers for smoother flow',
  },
  {
    title: 'Neutralizing & locking the curl',
    duration: '7 MIN',
    summary:
      'How the neutralizer resets the disulfide bonds — and why patience in these four minutes defines the final look.',
    script: '"This is where the lift becomes permanent. No rushing, no peeking."',
    demoSteps: '3 steps · apply neutralizer, wait, remove cleanly',
    commonMistakes: 'Wiping before the full setting time has elapsed',
    proTip: 'Use a dry micro-swab to check tackiness at the 3-minute mark',
  },
  {
    title: 'The final reveal & aftercare',
    duration: '6 MIN',
    summary:
      'Removing the rod, nourishing the lash, and the aftercare script that keeps the lift gorgeous for weeks.',
    script: '"Now — we lift the veil. Your client sees herself differently for the next six weeks."',
    demoSteps: '3 steps · release rod, nourish, brief client',
    commonMistakes: 'Skipping the nourishing serum to save time',
    proTip: 'Send aftercare instructions by text before the client leaves',
  },
];

function buildLessonFromTemplate(template, number) {
  return normalizeLesson({
    id: makeId(),
    number,
    title: template.title,
    duration: template.duration,
    summary: template.summary,
    subBlocks: [
      { label: 'Script', content: template.script },
      { label: 'Demo steps', content: template.demoSteps },
      { label: 'Common mistakes', content: template.commonMistakes },
      { label: 'Pro tip', content: template.proTip },
    ],
  });
}

function buildEmptyLesson(number, moduleId = '') {
  return {
    id: makeId(),
    number,
    moduleId,
    title: '',
    duration: '',
    summary: '',
    // No canonical pre-filled blocks. A fresh lesson is a blank canvas —
    // users compose it via "+ Add section". AI-generated lessons still
    // arrive pre-populated with role-tagged blocks (see handleGenerateLesson
    // and onboarding) so Match Style / Refine can still target them.
    subBlocks: [],
    cards: [],
  };
}

const STYLE_VARIANTS = [
  {
    key: 'warm',
    label: 'Warm & mentor-like',
    transforms: {
      title: (t) => (t.includes('— a gentle walkthrough') ? t : `${t} — a gentle walkthrough`),
      summary: (t) => `Take a breath. ${t} You're building something beautiful.`,
      Script: (t) => `Gently: ${t}`,
      'Demo steps': (t) => `${t} · move with care`,
      'Common mistakes': (t) => `${t} — we've all been there.`,
      'Pro tip': (t) => `From the heart: ${t}`,
    },
  },
  {
    key: 'professional',
    label: 'Crisp & professional',
    transforms: {
      title: (t) => (t.includes(': Technique') ? t : `${t}: Technique & Application`),
      summary: (t) => `Objective: ${t} Outcome-driven delivery.`,
      Script: (t) => `State clearly: ${t}`,
      'Demo steps': (t) => `Procedure — ${t}`,
      'Common mistakes': (t) => `Critical: ${t}. Mitigate with deliberate practice.`,
      'Pro tip': (t) => `Industry note: ${t}.`,
    },
  },
  {
    key: 'detailed',
    label: 'Rich & detailed',
    transforms: {
      title: (t) => (t.includes('(step-by-step)') ? t : `${t} (step-by-step)`),
      summary: (t) =>
        `${t} In this expanded walkthrough we'll also cover timing, tools, and adaptation for different lash types.`,
      Script: (t) => `${t} Pause — confirm comfort before continuing.`,
      'Demo steps': (t) => `${t} · each step: breathe, observe, adjust`,
      'Common mistakes': (t) =>
        `${t}. Also watch for: rushed technique, poor lighting, inconsistent pressure.`,
      'Pro tip': (t) => `${t}. Practice on a mannequin head twice before your next client.`,
    },
  },
];

function weaveVocab(text, word, template) {
  if (!text || !word) return text;
  if (text.toLowerCase().includes(word)) return text;
  return template(text.replace(/[.!?]\s*$/, ''), word);
}

function stepify(text) {
  if (!text) return text;
  if (/^\s*\d+\s*[.)]/.test(text)) return text;
  const header = text.match(/^(\d+\s+steps?\s*[·:\-–—]\s*)(.+)$/i);
  const body = header ? header[2] : text;
  const prefix = header ? header[1] : '';
  const parts = body.split(/[·;,]\s*/).map((s) => s.trim()).filter(Boolean);
  if (parts.length < 2) return text;
  return prefix + parts.map((p, i) => `${i + 1}. ${p}`).join('  ·  ');
}

function applyStyleToLesson(lesson, variant, profile) {
  const t = variant.transforms;
  const tx = (fn, value) => (value && value.trim() ? fn(value) : value);
  const vocab = profile?.vocabulary || [];
  const [vocab1, vocab2] = vocab;
  const signature = profile?.signature;
  const structure = profile?.structure;

  return {
    ...lesson,
    title: tx(t.title, lesson.title),
    summary: weaveVocab(
      tx(t.summary, lesson.summary),
      vocab1,
      (s, w) => `${s} — with an emphasis on ${w}.`,
    ),
    subBlocks: lesson.subBlocks.map((sb) => {
      // The local mock variants only understand plain text blocks. Steps/visual/
      // comparison blocks are left untouched — users still get the full AI
      // transform when the network path succeeds.
      if (sb.type !== 'text' && sb.type !== 'tips' && sb.type !== 'custom') return sb;
      const lookupLabel = sb.role ? ROLE_TO_LEGACY_LABEL[sb.role] : sb.label;
      const fn = t[lookupLabel];
      if (!fn) return sb;
      let content = tx(fn, sb.content);
      if (sb.role === 'script' && content && signature && !content.includes(signature)) {
        content = `${content} ${signature}`;
      }
      if (sb.role === 'demoSteps' && content && structure === 'Step-by-step teaching') {
        content = stepify(content);
      }
      if (sb.role === 'tip' && content) {
        content = weaveVocab(content, vocab2, (s, w) => `${s} — keep your ${w} sharp.`);
      }
      if (sb.role === 'mistakes' && content) {
        content = weaveVocab(content, vocab1, (s, w) => `${s}. Watch the ${w} carefully.`);
      }
      return { ...sb, content };
    }),
  };
}

const STOPWORDS = new Set([
  'about', 'again', 'after', 'against', 'along', 'around', 'because', 'before',
  'being', 'between', 'both', 'could', 'during', 'every', 'going', 'makes',
  'might', 'other', 'shall', 'should', 'since', 'still', 'taken', 'taking',
  'their', 'there', 'these', 'those', 'through', 'under', 'until', 'where',
  'which', 'while', 'would', 'yours',
]);

const TONE_MARKERS = {
  warm: ['love', 'beautiful', 'gentle', 'heart', 'darling', 'take your time', 'breathe', "you're", 'trust', 'together', 'listen'],
  professional: ['technique', 'procedure', 'clinical', 'protocol', 'industry', 'practice', 'application', 'critical', 'objective', 'precision', 'standard'],
  detailed: ['specifically', 'precisely', 'in addition', 'furthermore', 'for example', 'walkthrough', 'step-by-step', 'step by step', 'note that'],
};

const TONE_LABELS = {
  warm: 'Warm & mentor-like',
  professional: 'Crisp & professional',
  detailed: 'Rich & detailed',
};

function detectStructure(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const bulletLines = lines.filter((l) => /^(\d+[.)]|[-*•])\s/.test(l)).length;
  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  const questionShare = (text.match(/\?/g) || []).length / Math.max(sentences.length, 1);
  const avgWords =
    sentences.reduce((n, s) => n + s.split(/\s+/).length, 0) / Math.max(sentences.length, 1);
  if (bulletLines >= 3 || bulletLines / Math.max(lines.length, 1) > 0.25) {
    return 'Step-by-step teaching';
  }
  if (questionShare > 0.15) return 'Conversational Q&A';
  if (avgWords > 22) return 'Narrative storytelling';
  return 'Direct & concise';
}

function analyzeStyle(text) {
  const clean = text.trim();
  if (!clean) return null;
  const lower = clean.toLowerCase();
  const score = (markers) => markers.reduce((n, m) => n + (lower.includes(m) ? 1 : 0), 0);
  const warmS = score(TONE_MARKERS.warm);
  const profS = score(TONE_MARKERS.professional);
  const detS = score(TONE_MARKERS.detailed);
  let toneKey = 'warm';
  if (profS > warmS && profS >= detS) toneKey = 'professional';
  else if (detS > warmS && detS > profS) toneKey = 'detailed';
  const sentences = clean
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && s.length < 120);
  return {
    toneKey,
    sampleText: clean,
    wordCount: clean.split(/\s+/).filter(Boolean).length,
    signature: sentences[0] || '',
    structure: detectStructure(clean),
    strength: 'medium',
  };
}

function migrateStyleProfile(profile) {
  if (!profile) return null;
  const toArr = (tagsField, legacyField) => {
    if (Array.isArray(profile[tagsField])) return profile[tagsField];
    if (typeof profile[legacyField] === 'string' && profile[legacyField].trim()) {
      return profile[legacyField]
        .split(/[,;·]/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 6);
    }
    return [];
  };
  return {
    ...profile,
    summary: typeof profile.summary === 'string' ? profile.summary : '',
    toneTags: toArr('toneTags', 'tone'),
    teachingStyleTags: toArr('teachingStyleTags', 'teachingStyle'),
    personalityTags: toArr('personalityTags', 'personality'),
    signaturePhrases: Array.isArray(profile.signaturePhrases) ? profile.signaturePhrases : [],
    strength: profile.strength || 'medium',
    sampleText: typeof profile.sampleText === 'string' ? profile.sampleText : '',
    wordCount: typeof profile.wordCount === 'number' ? profile.wordCount : 0,
  };
}

const STRUCTURE_OPTIONS = [
  'Step-by-step teaching',
  'Conversational Q&A',
  'Narrative storytelling',
  'Direct & concise',
];

const TONE_OPTIONS = Object.entries(TONE_LABELS).map(([key, label]) => ({ key, label }));

export default function App() {
  // Routing
  const [view, setView] = useState('home');

  // Dashboard state
  const [courses, setCourses] = useState([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [coursesError, setCoursesError] = useState(null);

  // Loaded course state
  const [currentCourseId, setCurrentCourseId] = useState(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [courseOverview, setCourseOverview] = useState(DEFAULT_OVERVIEW);

  // Derived legacy meta (first module) for views that haven't been migrated.
  const moduleMeta = modules[0]
    ? {
        status: 'DRAFT',
        moduleNumber: 1,
        moduleCount: modules.length,
        moduleTitle: modules[0].title || 'Untitled module',
        moduleSubtitle: modules[0].subtitle || '',
      }
    : DEFAULT_META;

  // Builder UI state
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [styleIndex, setStyleIndex] = useState(0);
  const [styleProfile, setStyleProfile] = useState(() =>
    migrateStyleProfile(loadFromStorage(STORAGE_KEYS.styleProfile, null)),
  );
  const [styleSampleText, setStyleSampleText] = useState(() =>
    loadFromStorage(STORAGE_KEYS.styleSampleText, ''),
  );
  const [saveStatus, setSaveStatus] = useState('idle');
  const [activeScreen, setActiveScreen] = useState('modules');
  const [canvasMode, setCanvasMode] = useState('editor');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingCardsForId, setGeneratingCardsForId] = useState(null);
  const [isMatchingStyle, setIsMatchingStyle] = useState(false);
  const [isStructuring, setIsStructuring] = useState(false);
  const [structuredOutline, setStructuredOutline] = useState(null);
  const [isOutlineModalOpen, setIsOutlineModalOpen] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [pendingExpansion, setPendingExpansion] = useState(null);
  const [isAnalyzingStyle, setIsAnalyzingStyle] = useState(false);
  const [pendingStyleMatch, setPendingStyleMatch] = useState(null);
  const [styleMatchDialogOpen, setStyleMatchDialogOpen] = useState(false);
  const [refiningSections, setRefiningSections] = useState(() => new Set());
  const [inFlightAIActions, setInFlightAIActions] = useState(() => new Set());
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [lastChange, setLastChange] = useState(null);
  const [showOnboardingIntro, setShowOnboardingIntro] = useState(false);

  const recordChange = useCallback((action, lessonTitle = '') => {
    setLastChange({ action, lessonTitle, timestamp: Date.now() });
  }, []);

  const saveTimerRef = useRef(null);
  const skipNextSaveRef = useRef(false);

  // ——— Style profile / sample text persistence (local, user-level) ———
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.styleProfile, styleProfile);
  }, [styleProfile]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.styleSampleText, styleSampleText);
  }, [styleSampleText]);

  // ——— Course list (dashboard) ———
  const loadCourses = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setIsLoadingCourses(true);
    setCoursesError(null);
    try {
      const list = await coursesApi.listCourses();
      setCourses(list);
    } catch (err) {
      console.error('Failed to load courses:', err);
      setCoursesError(err.message || 'Could not load courses.');
    } finally {
      setIsLoadingCourses(false);
    }
  }, []);

  useEffect(() => {
    if (isSupabaseConfigured && view === 'dashboard') loadCourses();
  }, [view, loadCourses]);

  // ——— Course load / open / create ———
  const openCourseFromRow = (course) => {
    skipNextSaveRef.current = true;
    const migrated = migrateCourseContent(course.content);
    const nextLessons = migrated.lessons.map(normalizeLesson);
    setCurrentCourseId(course.id);
    setCourseTitle(course.title || 'Untitled course');
    setModules(migrated.modules);
    setLessons(nextLessons);
    setCourseOverview({ ...DEFAULT_OVERVIEW, ...(migrated.overview || {}) });
    setSelectedLessonId(nextLessons[0]?.id ?? null);
    setActiveScreen('modules');
    setSaveStatus('saved');
    setLastChange(null);
    setView('builder');
  };

  const handleOpenCourse = async (id) => {
    try {
      const course = await coursesApi.getCourse(id);
      openCourseFromRow(course);
    } catch (err) {
      console.error('Failed to open course:', err);
      setCoursesError(err.message || 'Could not open course.');
    }
  };

  const handleStartOnboarding = () => {
    setView('onboarding');
  };

  const handleCancelOnboarding = () => {
    setView('dashboard');
  };

  const buildProfileFromAnalyzeResponse = (data, sampleText) => ({
    summary: typeof data.summary === 'string' ? data.summary : '',
    toneTags: Array.isArray(data.toneTags) ? data.toneTags : [],
    teachingStyleTags: Array.isArray(data.teachingStyleTags) ? data.teachingStyleTags : [],
    personalityTags: Array.isArray(data.personalityTags) ? data.personalityTags : [],
    signaturePhrases: Array.isArray(data.signaturePhrases) ? data.signaturePhrases : [],
    strength: 'medium',
    sampleText,
    wordCount: sampleText.split(/\s+/).filter(Boolean).length,
  });

  const handleOnboardingComplete = async (onboardingData) => {
    const idea = (onboardingData.idea || '').trim();
    if (!idea) throw new Error('Course idea is required.');

    const audience = onboardingData.audience || 'beginner';
    const struggle = (onboardingData.struggle || '').trim();
    const goal = (onboardingData.goal || '').trim();
    const sample = (onboardingData.voiceSample || '').trim();
    const toneKeywords = (onboardingData.toneKeywords || '').trim();

    // 1. Analyze voice if a sample was provided
    let profile = null;
    if (sample) {
      try {
        const resp = await fetch('/api/analyzeStyle', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sampleText: sample }),
        });
        if (resp.ok) {
          const data = await resp.json();
          profile = buildProfileFromAnalyzeResponse(data, sample);
        }
      } catch (err) {
        console.warn('Style analysis skipped:', err);
      }
    } else if (toneKeywords) {
      const tags = toneKeywords
        .split(/[,;]/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      const summaryFragments = tags.length
        ? tags.slice(0, 4).map((t) => t[0].toUpperCase() + t.slice(1)).join('. ') + '.'
        : '';
      profile = {
        summary: summaryFragments,
        toneTags: tags,
        teachingStyleTags: [],
        personalityTags: [],
        signaturePhrases: [],
        strength: 'medium',
        sampleText: '',
        wordCount: 0,
      };
    }
    if (profile) {
      setStyleProfile(profile);
      setStyleSampleText(profile.sampleText || '');
    }

    // 2. Derive titles and generate the first lesson
    const title = idea.length > 72 ? `${idea.slice(0, 72).trim()}…` : idea;
    const moduleTitle = 'Module 1: Foundations';
    const courseTopicEnhanced = [
      idea,
      `Students are ${audience}-level.`,
      struggle ? `They struggle with ${struggle}.` : null,
      goal ? `They want to be able to ${goal}.` : null,
    ]
      .filter(Boolean)
      .join(' ');

    let lessonPayload = null;
    try {
      const resp = await fetch('/api/generateLesson', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          courseTopic: courseTopicEnhanced,
          moduleTitle,
          lessonContext: [],
          styleProfile: profile,
        }),
      });
      if (resp.ok) lessonPayload = await resp.json();
    } catch (err) {
      console.warn('First-lesson generation skipped:', err);
    }

    const firstModuleId = makeModuleId();
    const firstLesson = lessonPayload
      ? normalizeLesson({
          id: makeId(),
          number: 1,
          moduleId: firstModuleId,
          title: lessonPayload.title || '',
          duration: lessonPayload.duration || '',
          summary: lessonPayload.summary || '',
          subBlocks: [
            { label: 'Script', content: lessonPayload.script || '' },
            { label: 'Demo steps', content: lessonPayload.demoSteps || '' },
            { label: 'Common mistakes', content: lessonPayload.commonMistakes || '' },
            { label: 'Pro tip', content: lessonPayload.proTip || '' },
          ],
        })
      : buildEmptyLesson(1, firstModuleId);

    const content = {
      modules: [
        {
          id: firstModuleId,
          title: moduleTitle,
          subtitle: struggle
            ? `Designed for ${audience} students who struggle with ${struggle}.`
            : `A ${audience}-level introduction.`,
        },
      ],
      lessons: [firstLesson],
      overview: { ...DEFAULT_OVERVIEW },
    };

    // 3. Create course in Supabase
    const course = await coursesApi.createCourse({ title, content });
    await loadCourses();

    // 4. Open the course and show the welcome overlay
    openCourseFromRow(course);
    clearOnboardingDraft();
    setShowOnboardingIntro(true);
  };

  const handleDeleteCourse = async (id) => {
    try {
      await coursesApi.deleteCourse(id);
      await loadCourses();
    } catch (err) {
      console.error('Failed to delete course:', err);
      setCoursesError(err.message || 'Could not delete course.');
    }
  };

  const handleRenameCourse = async (id, title) => {
    const trimmed = (title || '').trim() || 'Untitled course';
    // Optimistic update so the dashboard doesn't flicker.
    setCourses((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, title: trimmed, updated_at: new Date().toISOString() } : c,
      ),
    );
    try {
      await coursesApi.renameCourse(id, trimmed);
    } catch (err) {
      console.error('Rename failed:', err);
      setCoursesError(err.message || 'Could not rename course.');
      await loadCourses();
    }
  };

  const handleDuplicateCourse = async (id) => {
    try {
      await coursesApi.duplicateCourse(id);
      await loadCourses();
    } catch (err) {
      console.error('Duplicate failed:', err);
      setCoursesError(err.message || 'Could not duplicate course.');
    }
  };

  const flushPendingSave = async () => {
    if (!currentCourseId) return;
    clearTimeout(saveTimerRef.current);
    try {
      setSaveStatus('saving');
      await coursesApi.updateCourse(currentCourseId, {
        title: courseTitle,
        content: { modules, lessons, overview: courseOverview },
      });
      setSaveStatus('saved');
    } catch (err) {
      console.error('Flush save failed:', err);
    }
  };

  const handleBackToDashboard = async () => {
    await flushPendingSave();
    setView('dashboard');
    setCurrentCourseId(null);
    setCourseTitle('');
    setModules([]);
    setLessons([]);
    setCourseOverview(DEFAULT_OVERVIEW);
    setSelectedLessonId(null);
    setPendingStyleMatch(null);
    setIsExportOpen(false);
    setShowOnboardingIntro(false);
    setActiveScreen('modules');
  };

  // ——— Debounced Supabase save whenever course data changes ———
  useEffect(() => {
    if (!currentCourseId || !isSupabaseConfigured) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    setSaveStatus('saving');
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await coursesApi.updateCourse(currentCourseId, {
          title: courseTitle,
          content: { modules, lessons, overview: courseOverview },
        });
        setSaveStatus('saved');
      } catch (err) {
        console.error('Save failed:', err);
        setSaveStatus('error');
      }
    }, 900);
    return () => clearTimeout(saveTimerRef.current);
  }, [currentCourseId, courseTitle, modules, lessons, courseOverview]);

  useEffect(() => () => clearTimeout(saveTimerRef.current), []);

  // Keep selected lesson pointing at something valid
  useEffect(() => {
    if (lessons.length === 0) {
      if (selectedLessonId !== null) setSelectedLessonId(null);
      return;
    }
    if (!lessons.some((l) => l.id === selectedLessonId)) {
      setSelectedLessonId(lessons[0].id);
    }
  }, [lessons, selectedLessonId]);

  // ——— Lesson mutations ———
  const appendGeneratedLesson = (data) => {
    const targetModuleId = modules[modules.length - 1]?.id || '';
    setLessons((prev) => {
      const nextNumber = prev.length + 1;
      const lesson = normalizeLesson({
        id: makeId(),
        number: nextNumber,
        moduleId: targetModuleId,
        title: data.title || '',
        duration: data.duration || '',
        summary: data.summary || '',
        subBlocks: [
          { label: 'Script', content: data.script || '' },
          { label: 'Demo steps', content: data.demoSteps || '' },
          { label: 'Common mistakes', content: data.commonMistakes || '' },
          { label: 'Pro tip', content: data.proTip || '' },
        ],
      });
      return [...prev, lesson];
    });
  };

  const handleGenerateLesson = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const resp = await fetch('/api/generateLesson', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          courseTopic: courseTitle,
          moduleTitle: moduleMeta.moduleTitle,
          lessonContext: lessons.map((l) => ({ number: l.number, title: l.title })),
          styleProfile,
        }),
      });
      if (!resp.ok) {
        const { error } = await resp.json().catch(() => ({}));
        throw new Error(error || `Request failed: ${resp.status}`);
      }
      const data = await resp.json();
      appendGeneratedLesson(data);
      recordChange('Generated a new lesson', data?.title || '');
    } catch (err) {
      console.error('Generate lesson failed, falling back to mock:', err);
      const fallbackModuleId = modules[modules.length - 1]?.id || '';
      setLessons((prev) => {
        const template = mockLessonTemplates[prev.length % mockLessonTemplates.length];
        const fromTemplate = buildLessonFromTemplate(template, prev.length + 1);
        return [...prev, { ...fromTemplate, moduleId: fallbackModuleId }];
      });
      recordChange('Generated a new lesson', '');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStructureLesson = async () => {
    if (isStructuring) return;
    const lesson = lessons.find((l) => l.id === selectedLessonId);
    if (!lesson) return;
    setIsStructuring(true);
    try {
      const resp = await fetch('/api/structureLesson', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          topic: lesson.title || '',
          notes: lesson.summary || '',
        }),
      });
      if (!resp.ok) {
        const { error } = await resp.json().catch(() => ({}));
        throw new Error(error || `Request failed: ${resp.status}`);
      }
      const data = await resp.json();
      setStructuredOutline({
        outline: data,
        lessonTitle: lesson.title || '',
        lessonId: lesson.id,
      });
      setIsOutlineModalOpen(true);
      recordChange('Structured lesson outline', lesson.title || '');
    } catch (err) {
      console.error('Structure lesson failed:', err);
      alert(`Could not structure lesson: ${err.message}`);
    } finally {
      setIsStructuring(false);
    }
  };

  // After appending blocks, scroll the first one into view so the user can
  // see that something actually happened.
  const scrollToBlock = (blockId) => {
    if (!blockId) return;
    setTimeout(() => {
      const el = document.querySelector(`[data-block-id="${blockId}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  };

  const handleInsertOutlineSection = (section) => {
    const targetLessonId = structuredOutline?.lessonId || selectedLessonId;
    if (!targetLessonId) return;
    const block = outlineSectionToBlock(section);
    setLessons((prev) =>
      prev.map((l) =>
        l.id === targetLessonId ? { ...l, subBlocks: [...l.subBlocks, block] } : l,
      ),
    );
    scrollToBlock(block.id);
    recordChange('Inserted outline section', section?.title || '');
  };

  const handleInsertEntireOutline = () => {
    const targetLessonId = structuredOutline?.lessonId || selectedLessonId;
    const sections = structuredOutline?.outline?.sections;
    if (!targetLessonId || !Array.isArray(sections) || sections.length === 0) return;
    const blocks = sections.map(outlineSectionToBlock);
    setLessons((prev) =>
      prev.map((l) =>
        l.id === targetLessonId ? { ...l, subBlocks: [...l.subBlocks, ...blocks] } : l,
      ),
    );
    scrollToBlock(blocks[0]?.id);
    recordChange('Inserted full outline', structuredOutline.lessonTitle || '');
    setIsOutlineModalOpen(false);
  };

  const handleReplaceWithOutline = () => {
    const targetLessonId = structuredOutline?.lessonId || selectedLessonId;
    const sections = structuredOutline?.outline?.sections;
    if (!targetLessonId || !Array.isArray(sections) || sections.length === 0) return;
    const confirmed = window.confirm(
      'Replace this lesson\'s content with the structured outline? Existing sections will be removed.',
    );
    if (!confirmed) return;
    const blocks = sections.map(outlineSectionToBlock);
    setLessons((prev) =>
      prev.map((l) => (l.id === targetLessonId ? { ...l, subBlocks: blocks } : l)),
    );
    scrollToBlock(blocks[0]?.id);
    recordChange('Replaced lesson with outline', structuredOutline.lessonTitle || '');
    setIsOutlineModalOpen(false);
  };

  const handleExpandLesson = async () => {
    if (isExpanding) return;
    const lesson = lessons.find((l) => l.id === selectedLessonId);
    if (!lesson) return;

    // Only steps blocks carry bullet lists — serialize those for the API.
    const sections = lesson.subBlocks
      .filter((sb) => sb.type === 'steps')
      .map((sb) => ({
        title: sb.label || 'Section',
        items: (sb.items || [])
          .map((it) => (typeof it?.text === 'string' ? it.text.trim() : ''))
          .filter(Boolean),
      }))
      .filter((s) => s.items.length > 0);

    if (sections.length === 0) {
      alert(
        'This lesson has no bullet-style sections to expand. Use "Structure lesson" first, or add a Demo steps block.',
      );
      return;
    }

    setIsExpanding(true);
    try {
      const resp = await fetch('/api/expandLesson', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sections }),
      });
      if (!resp.ok) {
        const { error } = await resp.json().catch(() => ({}));
        throw new Error(error || `Request failed: ${resp.status}`);
      }
      const data = await resp.json();
      setPendingExpansion({
        expansion: data,
        lessonId: lesson.id,
        lessonTitle: lesson.title || '',
      });
    } catch (err) {
      console.error('Expand lesson failed:', err);
      alert(`Could not expand lesson: ${err.message}`);
    } finally {
      setIsExpanding(false);
    }
  };

  const handleApplyExpansion = () => {
    if (!pendingExpansion) return;
    const { expansion, lessonId } = pendingExpansion;
    const expSections = Array.isArray(expansion?.sections) ? expansion.sections : [];
    if (expSections.length === 0) {
      setPendingExpansion(null);
      return;
    }

    // For each expanded section, build a text block and slot it in right
    // after the matching steps block (matched by label, case-insensitive).
    const newBlocks = expSections.map((s) => {
      const items = Array.isArray(s?.items) ? s.items : [];
      const content = items
        .filter((i) => i && (i.bullet || i.expanded))
        .map((i) => `${(i.bullet || '').trim()}\n${(i.expanded || '').trim()}`.trim())
        .join('\n\n');
      return {
        block: {
          id: makeBlockId(),
          type: 'text',
          label: `${(s.title || 'Section').trim()} — expanded`,
          tint: BLOCK_TYPES.text.tint,
          content,
        },
        sectionTitle: (s.title || '').trim().toLowerCase(),
      };
    });

    let firstInsertedId = null;
    setLessons((prev) =>
      prev.map((l) => {
        if (l.id !== lessonId) return l;
        const next = [];
        l.subBlocks.forEach((sb) => {
          next.push(sb);
          if (sb.type !== 'steps') return;
          const match = newBlocks.find(
            (nb) => nb.sectionTitle && nb.sectionTitle === (sb.label || '').trim().toLowerCase(),
          );
          if (match) {
            next.push(match.block);
            if (!firstInsertedId) firstInsertedId = match.block.id;
          }
        });
        // Any expanded sections that didn't match a steps-block label get
        // appended at the end so nothing is silently dropped.
        const placedIds = new Set(next.map((b) => b.id));
        newBlocks.forEach((nb) => {
          if (!placedIds.has(nb.block.id)) {
            next.push(nb.block);
            if (!firstInsertedId) firstInsertedId = nb.block.id;
          }
        });
        return { ...l, subBlocks: next };
      }),
    );
    scrollToBlock(firstInsertedId);
    recordChange('Expanded lesson to teach', pendingExpansion.lessonTitle || '');
    setPendingExpansion(null);
  };

  const handleCancelExpansion = () => setPendingExpansion(null);

  const canExpandSelected = (() => {
    const l = lessons.find((x) => x.id === selectedLessonId);
    if (!l) return false;
    return l.subBlocks.some(
      (sb) => sb.type === 'steps' && Array.isArray(sb.items) && sb.items.some((i) => i?.text?.trim()),
    );
  })();

  const handleGenerateCards = async (lessonId) => {
    if (generatingCardsForId) return;
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson) return;

    const byRole = Object.fromEntries(
      lesson.subBlocks
        .filter((sb) => sb.role)
        .map((sb) => [sb.role, serializeBlockForAI(sb)]),
    );
    setGeneratingCardsForId(lessonId);

    try {
      const resp = await fetch('/api/generateCards', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          lesson: {
            title: lesson.title,
            summary: lesson.summary,
            script: byRole.script || '',
            demoSteps: byRole.demoSteps || '',
            commonMistakes: byRole.mistakes || '',
            proTip: byRole.tip || '',
          },
          styleProfile,
        }),
      });
      if (!resp.ok) {
        const { error } = await resp.json().catch(() => ({}));
        throw new Error(error || `Request failed: ${resp.status}`);
      }
      const data = await resp.json();
      const cards = Array.isArray(data.cards)
        ? data.cards
            .filter(
              (c) =>
                c &&
                typeof c.title === 'string' &&
                c.title.trim() &&
                Array.isArray(c.keyPoints),
            )
            .map((c) => ({
              title: c.title.trim(),
              keyPoints: c.keyPoints.filter(
                (p) => typeof p === 'string' && p.trim(),
              ),
              sayLikeThis:
                typeof c.sayLikeThis === 'string' ? c.sayLikeThis.trim() : '',
              watchFor: typeof c.watchFor === 'string' ? c.watchFor.trim() : '',
            }))
        : [];

      setLessons((prev) =>
        prev.map((l) => (l.id === lessonId ? { ...l, cards } : l)),
      );
      recordChange(
        cards.length > 0 ? 'Built teaching flow' : 'Cleared teaching flow',
        lesson.title || '',
      );
    } catch (err) {
      console.error('Generate cards failed:', err);
    } finally {
      setGeneratingCardsForId(null);
    }
  };

  const handleAddCard = (lessonId, afterIndex) => {
    const blank = {
      title: 'New step',
      keyPoints: [''],
      sayLikeThis: '',
      watchFor: '',
      image: null,
    };
    setLessons((prev) =>
      prev.map((l) => {
        if (l.id !== lessonId) return l;
        const cards = Array.isArray(l.cards) ? [...l.cards] : [];
        const idx =
          typeof afterIndex === 'number'
            ? Math.min(afterIndex + 1, cards.length)
            : cards.length;
        cards.splice(idx, 0, blank);
        return { ...l, cards };
      }),
    );
    recordChange('Added a teaching step');
  };

  const handleDuplicateCard = (lessonId, cardIndex) => {
    setLessons((prev) =>
      prev.map((l) => {
        if (l.id !== lessonId) return l;
        const cards = Array.isArray(l.cards) ? [...l.cards] : [];
        const src = cards[cardIndex];
        if (!src) return l;
        const copy = {
          title: src.title,
          keyPoints: Array.isArray(src.keyPoints) ? [...src.keyPoints] : [],
          sayLikeThis: src.sayLikeThis || '',
          watchFor: src.watchFor || '',
          image: src.image ? { ...src.image } : null,
        };
        cards.splice(cardIndex + 1, 0, copy);
        return { ...l, cards };
      }),
    );
    recordChange('Duplicated a teaching step');
  };

  const handleReorderCard = (lessonId, fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    setLessons((prev) =>
      prev.map((l) => {
        if (l.id !== lessonId) return l;
        const cards = Array.isArray(l.cards) ? [...l.cards] : [];
        if (fromIndex < 0 || fromIndex >= cards.length) return l;
        const [moved] = cards.splice(fromIndex, 1);
        const clampedTo = Math.max(0, Math.min(toIndex, cards.length));
        cards.splice(clampedTo, 0, moved);
        return { ...l, cards };
      }),
    );
  };

  const handleMoveCard = (lessonId, cardIndex, direction) => {
    setLessons((prev) =>
      prev.map((l) => {
        if (l.id !== lessonId) return l;
        const cards = Array.isArray(l.cards) ? [...l.cards] : [];
        const target = cardIndex + direction;
        if (target < 0 || target >= cards.length) return l;
        [cards[cardIndex], cards[target]] = [cards[target], cards[cardIndex]];
        return { ...l, cards };
      }),
    );
  };

  const handleUpdateCard = (lessonId, cardIndex, patch) => {
    setLessons((prev) =>
      prev.map((l) =>
        l.id === lessonId
          ? {
              ...l,
              cards: (l.cards || []).map((c, i) =>
                i === cardIndex ? { ...c, ...patch } : c,
              ),
            }
          : l,
      ),
    );
  };

  const handleDeleteCard = (lessonId, cardIndex) => {
    setLessons((prev) =>
      prev.map((l) =>
        l.id === lessonId
          ? { ...l, cards: (l.cards || []).filter((_, i) => i !== cardIndex) }
          : l,
      ),
    );
    recordChange('Removed a teaching step');
  };

  const handleOpenTeachMode = (lessonId) => {
    if (lessonId) setSelectedLessonId(lessonId);
    setActiveScreen('teach');
  };

  const handleStartTeaching = () => {
    setView('teaching');
  };

  const handleAddLesson = (moduleId) => {
    const targetModuleId = moduleId || modules[modules.length - 1]?.id || '';
    const lesson = buildEmptyLesson(lessons.length + 1, targetModuleId);
    setLessons((prev) => [...prev, lesson]);
    setSelectedLessonId(lesson.id);
    recordChange('Added a lesson');
    setTimeout(() => {
      const el = document.querySelector(`[data-lesson-id="${lesson.id}"]`);
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  };

  const handleUpdateLesson = (id, field, value) => {
    setLessons((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  const handleRemoveLesson = (id) => {
    const removed = lessons.find((l) => l.id === id);
    setLessons((prev) =>
      prev.filter((l) => l.id !== id).map((l, idx) => ({ ...l, number: idx + 1 })),
    );
    recordChange('Removed a lesson', removed?.title || '');
  };

  const handleUpdateSubBlock = (lessonId, blockId, value) => {
    setLessons((prev) =>
      prev.map((l) =>
        l.id === lessonId
          ? {
              ...l,
              subBlocks: l.subBlocks.map((sb) =>
                sb.id === blockId ? { ...sb, content: value } : sb,
              ),
            }
          : l,
      ),
    );
  };

  const handleRenameBlock = (lessonId, blockId, label) => {
    setLessons((prev) =>
      prev.map((l) =>
        l.id === lessonId
          ? {
              ...l,
              subBlocks: l.subBlocks.map((sb) =>
                sb.id === blockId ? { ...sb, label } : sb,
              ),
            }
          : l,
      ),
    );
  };

  const handleDuplicateBlock = (lessonId, blockId) => {
    setLessons((prev) =>
      prev.map((l) => {
        if (l.id !== lessonId) return l;
        const idx = l.subBlocks.findIndex((sb) => sb.id === blockId);
        if (idx === -1) return l;
        const original = l.subBlocks[idx];
        const copy = {
          id: makeBlockId(),
          type: original.type,
          label: `${original.label} copy`,
          content: original.content,
          tint: original.tint,
          // Duplicates drop the canonical role so AI match-style doesn't
          // overwrite both blocks with the same content.
        };
        const next = [...l.subBlocks];
        next.splice(idx + 1, 0, copy);
        return { ...l, subBlocks: next };
      }),
    );
    recordChange('Duplicated a section');
  };

  const handleDeleteBlock = (lessonId, blockId) => {
    const lesson = lessons.find((l) => l.id === lessonId);
    const removed = lesson?.subBlocks.find((sb) => sb.id === blockId);
    setLessons((prev) =>
      prev.map((l) =>
        l.id === lessonId
          ? { ...l, subBlocks: l.subBlocks.filter((sb) => sb.id !== blockId) }
          : l,
      ),
    );
    recordChange('Removed a section', removed?.label || '');
  };

  const handleAddBlock = (lessonId, type) => {
    const def = BLOCK_TYPES[type] || BLOCK_TYPES.text;
    const block = {
      id: makeBlockId(),
      type,
      label: def.defaultLabel,
      tint: def.tint,
      ...blockTypeDefaults(type),
    };
    setLessons((prev) =>
      prev.map((l) =>
        l.id === lessonId ? { ...l, subBlocks: [...l.subBlocks, block] } : l,
      ),
    );
    recordChange(`Added ${def.label.toLowerCase()} section`);
  };

  const handleReorderBlock = (lessonId, fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    setLessons((prev) =>
      prev.map((l) => {
        if (l.id !== lessonId) return l;
        const next = [...l.subBlocks];
        if (fromIndex < 0 || fromIndex >= next.length) return l;
        const [moved] = next.splice(fromIndex, 1);
        const clampedTo = Math.max(0, Math.min(toIndex, next.length));
        next.splice(clampedTo, 0, moved);
        return { ...l, subBlocks: next };
      }),
    );
  };

  const handleUpdateBlock = (lessonId, blockId, patch) => {
    setLessons((prev) =>
      prev.map((l) =>
        l.id === lessonId
          ? {
              ...l,
              subBlocks: l.subBlocks.map((sb) =>
                sb.id === blockId ? { ...sb, ...patch } : sb,
              ),
            }
          : l,
      ),
    );
  };

  const serializeBlockForAI = (sb) => {
    // Rich-text blocks may store HTML (bold/lists/spans) — AI endpoints want
    // clean plain text. Use the DOM parser via a temporary element.
    const stripHtml = (html) => {
      if (typeof html !== 'string' || !html) return '';
      const el = document.createElement('div');
      el.innerHTML = html;
      return el.textContent || '';
    };
    if (sb.type === 'steps') {
      return (sb.items || [])
        .map((it, i) => {
          const text = stripHtml(it.text).trim();
          return text ? `${i + 1}. ${text}` : '';
        })
        .filter(Boolean)
        .join('\n');
    }
    return stripHtml(sb.content);
  };

  const parseAIStringIntoBlock = (sb, value) => {
    if (sb.type !== 'steps') return { ...sb, content: value };
    const lines = value
      .split(/\n+/)
      .map((s) => s.replace(/^\s*\d+\s*[.)]\s*/, '').trim())
      .filter(Boolean);
    if (lines.length === 0) {
      return { ...sb, items: value.trim() ? [{ id: makeItemId(), text: value.trim(), image: null }] : [] };
    }
    return { ...sb, items: lines.map((text) => ({ id: makeItemId(), text, image: null })) };
  };

  const buildMatchStylePayload = (lesson) => {
    const byRole = Object.fromEntries(
      lesson.subBlocks
        .filter((sb) => sb.role)
        .map((sb) => [sb.role, serializeBlockForAI(sb)]),
    );
    return {
      title: lesson.title,
      duration: lesson.duration,
      summary: lesson.summary,
      script: byRole.script || '',
      demoSteps: byRole.demoSteps || '',
      commonMistakes: byRole.mistakes || '',
      proTip: byRole.tip || '',
    };
  };

  const mergeAIResponseIntoLesson = (lesson, data) => ({
    ...lesson,
    title: typeof data.title === 'string' ? data.title : lesson.title,
    duration: typeof data.duration === 'string' ? data.duration : lesson.duration,
    summary: typeof data.summary === 'string' ? data.summary : lesson.summary,
    subBlocks: lesson.subBlocks.map((sb) => {
      const apiKey = sb.role ? ROLE_TO_API_KEY[sb.role] : null;
      if (!apiKey || typeof data[apiKey] !== 'string') return sb;
      return parseAIStringIntoBlock(sb, data[apiKey]);
    }),
  });

  const stageMockMatchStyle = () => {
    const current = lessons.find((l) => l.id === selectedLessonId);
    if (!current) return;
    let variant;
    let advance = false;
    if (styleProfile) {
      variant =
        STYLE_VARIANTS.find((v) => v.key === inferToneKey(styleProfile)) ?? STYLE_VARIANTS[0];
    } else {
      variant = STYLE_VARIANTS[styleIndex % STYLE_VARIANTS.length];
      advance = true;
    }
    const after = applyStyleToLesson(current, variant, styleProfile);
    setPendingStyleMatch({
      lessonId: current.id,
      before: current,
      after,
      styleLabel: variant.label,
      advanceStyleIndex: advance,
    });
  };

  const handleMatchStyle = () => {
    if (!selectedLessonId || isMatchingStyle || pendingStyleMatch) return;
    setStyleMatchDialogOpen(true);
  };

  const handleCancelMatchStyleDialog = () => setStyleMatchDialogOpen(false);

  const handleConfirmMatchStyle = async ({ keywords, useSavedProfile, strength }) => {
    setStyleMatchDialogOpen(false);

    const lesson = lessons.find((l) => l.id === selectedLessonId);
    if (!lesson) return;

    const effectiveProfile =
      useSavedProfile && styleProfile ? { ...styleProfile, strength } : null;

    // If the user gave nothing to work with, fall straight to the mock cycle.
    if (!keywords && !effectiveProfile) {
      stageMockMatchStyle();
      return;
    }

    setIsMatchingStyle(true);
    try {
      const resp = await fetch('/api/matchStyle', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          lesson: buildMatchStylePayload(lesson),
          styleKeywords: keywords || '',
          styleProfile: effectiveProfile,
          strength,
        }),
      });
      if (!resp.ok) {
        const { error } = await resp.json().catch(() => ({}));
        throw new Error(error || `Request failed: ${resp.status}`);
      }
      const data = await resp.json();
      const after = mergeAIResponseIntoLesson(lesson, data);

      const label =
        keywords && keywords.length > 0
          ? keywords.length > 60
            ? `${keywords.slice(0, 60).trim()}…`
            : keywords
          : effectiveProfile?.tone || 'Your voice';

      setPendingStyleMatch({
        lessonId: lesson.id,
        before: lesson,
        after,
        styleLabel: label,
        advanceStyleIndex: false,
      });
    } catch (err) {
      console.error('Match style failed, falling back to mock:', err);
      stageMockMatchStyle();
    } finally {
      setIsMatchingStyle(false);
    }
  };

  const handleApplyPendingStyle = () => {
    if (!pendingStyleMatch) return;
    const appliedTitle = pendingStyleMatch.after?.title || pendingStyleMatch.before?.title || '';
    setLessons((prev) =>
      prev.map((l) => (l.id === pendingStyleMatch.lessonId ? pendingStyleMatch.after : l)),
    );
    if (pendingStyleMatch.advanceStyleIndex) {
      setStyleIndex((i) => (i + 1) % STYLE_VARIANTS.length);
    }
    setPendingStyleMatch(null);
    recordChange('Applied Match my style', appliedTitle);
  };

  const handleCancelPendingStyle = () => setPendingStyleMatch(null);

  const handleAIAction = async (mode) => {
    if (!selectedLessonId || inFlightAIActions.has(mode)) return;
    const lesson = lessons.find((l) => l.id === selectedLessonId);
    if (!lesson) return;

    setInFlightAIActions((prev) => new Set(prev).add(mode));
    try {
      const resp = await fetch('/api/aiAction', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mode,
          lesson: buildMatchStylePayload(lesson),
          styleProfile,
        }),
      });
      if (!resp.ok) {
        const { error } = await resp.json().catch(() => ({}));
        throw new Error(error || `Request failed: ${resp.status}`);
      }
      const data = await resp.json();

      if (mode === 'demoSteps') {
        setLessons((prev) =>
          prev.map((l) =>
            l.id === selectedLessonId
              ? {
                  ...l,
                  subBlocks: l.subBlocks.map((sb) =>
                    sb.role === 'demoSteps' && typeof data.demoSteps === 'string'
                      ? parseAIStringIntoBlock(sb, data.demoSteps)
                      : sb,
                  ),
                }
              : l,
          ),
        );
      } else {
        setLessons((prev) =>
          prev.map((l) =>
            l.id === selectedLessonId ? mergeAIResponseIntoLesson(l, data) : l,
          ),
        );
      }
      const actionLabel = {
        demoSteps: 'Regenerated demo steps',
        improve: 'Improved content',
        rewrite: 'Rewrote in tone',
        simplify: 'Simplified language',
      }[mode] || 'Updated content';
      recordChange(actionLabel, lesson.title);
    } catch (err) {
      console.error(`AI action "${mode}" failed:`, err);
    } finally {
      setInFlightAIActions((prev) => {
        const next = new Set(prev);
        next.delete(mode);
        return next;
      });
    }
  };

  const handleRefineSection = async (lessonId, blockId) => {
    const key = `${lessonId}:${blockId}`;
    if (refiningSections.has(key)) return;
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson) return;
    const subBlock = lesson.subBlocks.find((sb) => sb.id === blockId);
    if (!subBlock) return;

    setRefiningSections((prev) => new Set(prev).add(key));

    const priorText = serializeBlockForAI(subBlock);
    try {
      const resp = await fetch('/api/refineSection', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sectionLabel: subBlock.label,
          currentContent: priorText,
          lessonTitle: lesson.title,
          lessonSummary: lesson.summary,
          styleProfile,
        }),
      });
      if (!resp.ok) {
        const { error } = await resp.json().catch(() => ({}));
        throw new Error(error || `Request failed: ${resp.status}`);
      }
      const data = await resp.json();
      const hadPrior = Boolean(priorText && priorText.trim());
      if (typeof data.content === 'string' && data.content.trim()) {
        setLessons((prev) =>
          prev.map((l) =>
            l.id === lessonId
              ? {
                  ...l,
                  subBlocks: l.subBlocks.map((sb) =>
                    sb.id === blockId ? parseAIStringIntoBlock(sb, data.content) : sb,
                  ),
                }
              : l,
          ),
        );
        recordChange(
          `${hadPrior ? 'Improved' : 'Generated'} ${subBlock.label.toLowerCase()}`,
          lesson.title,
        );
      }
    } catch (err) {
      console.error(`Refine section failed (${subBlock.label}):`, err);
    } finally {
      setRefiningSections((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  // ——— Style profile handlers ———
  const buildLocalFallbackProfile = (sampleText) => {
    const heuristic = analyzeStyle(sampleText);
    if (!heuristic) return null;
    const toneLabel = TONE_LABELS[heuristic.toneKey] || 'Warm & mentor-like';
    const words = toneLabel.split(/[\s&]+/).filter(Boolean).slice(0, 2);
    return {
      summary: `${words.map((w) => w[0].toUpperCase() + w.slice(1)).join('. ')}.`,
      toneTags: [heuristic.toneKey].filter(Boolean),
      teachingStyleTags: [heuristic.structure.toLowerCase()],
      personalityTags: [],
      signaturePhrases: heuristic.signature ? [heuristic.signature] : [],
      strength: styleProfile?.strength || 'medium',
      sampleText: heuristic.sampleText,
      wordCount: heuristic.wordCount,
    };
  };

  const handleAnalyzeStyle = async () => {
    const sampleText = (styleSampleText || '').trim();
    if (!sampleText || isAnalyzingStyle) return;

    setIsAnalyzingStyle(true);
    try {
      const resp = await fetch('/api/analyzeStyle', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sampleText }),
      });
      if (!resp.ok) {
        const { error } = await resp.json().catch(() => ({}));
        throw new Error(error || `Request failed: ${resp.status}`);
      }
      const data = await resp.json();
      setStyleProfile({
        summary: typeof data.summary === 'string' ? data.summary : '',
        toneTags: Array.isArray(data.toneTags) ? data.toneTags : [],
        teachingStyleTags: Array.isArray(data.teachingStyleTags) ? data.teachingStyleTags : [],
        personalityTags: Array.isArray(data.personalityTags) ? data.personalityTags : [],
        signaturePhrases: Array.isArray(data.signaturePhrases) ? data.signaturePhrases : [],
        strength: styleProfile?.strength || 'medium',
        sampleText,
        wordCount: sampleText.split(/\s+/).filter(Boolean).length,
      });
    } catch (err) {
      console.error('Analyze style failed, falling back to heuristic:', err);
      const fallback = buildLocalFallbackProfile(sampleText);
      if (fallback) setStyleProfile(fallback);
    } finally {
      setIsAnalyzingStyle(false);
    }
  };

  const handleClearStyle = () => {
    setStyleProfile(null);
    setStyleSampleText('');
  };

  const handleUpdateStyleProfile = (patch) => {
    setStyleProfile((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const handleAddSignaturePhrase = (phrase) => {
    const clean = phrase.trim();
    if (!clean) return;
    setStyleProfile((prev) => {
      if (!prev) return prev;
      const existing = prev.signaturePhrases || [];
      if (existing.includes(clean)) return prev;
      return { ...prev, signaturePhrases: [...existing, clean] };
    });
  };

  const handleRemoveSignaturePhrase = (phrase) => {
    setStyleProfile((prev) =>
      prev
        ? { ...prev, signaturePhrases: (prev.signaturePhrases || []).filter((p) => p !== phrase) }
        : prev,
    );
  };

  // Legacy — matchStyle fallback still uses the mock variants when the API fails.
  // With the new profile shape we no longer track toneKey, so pick the closest
  // match from the tone description or default to warm.
  const inferToneKey = (profile) => {
    const t = (profile?.tone || '').toLowerCase();
    if (/crisp|professional|clinical|objective/.test(t)) return 'professional';
    if (/detailed|rich|specific|precise/.test(t)) return 'detailed';
    return 'warm';
  };

  const handleUpdateCourseOverview = (patch) => {
    setCourseOverview((prev) => ({ ...prev, ...patch }));
  };

  const handleAddModule = () => {
    const newModule = {
      id: makeModuleId(),
      title: `Module ${modules.length + 1}`,
      subtitle: '',
    };
    const seedLesson = buildEmptyLesson(lessons.length + 1, newModule.id);
    setModules((prev) => [...prev, newModule]);
    setLessons((prev) => [...prev, seedLesson]);
    setSelectedLessonId(seedLesson.id);
    recordChange('Added a module', newModule.title);
  };

  const handleUpdateModule = (id, patch) => {
    setModules((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const handleRemoveModule = (id) => {
    if (modules.length <= 1) return; // keep at least one module
    const removed = modules.find((m) => m.id === id);
    setModules((prev) => prev.filter((m) => m.id !== id));
    setLessons((prev) =>
      prev.filter((l) => l.moduleId !== id).map((l, i) => ({ ...l, number: i + 1 })),
    );
    recordChange('Removed a module', removed?.title || '');
  };


  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  const handleGenerateDescription = async () => {
    if (isGeneratingDescription) return;
    setIsGeneratingDescription(true);
    try {
      const resp = await fetch('/api/generateDescription', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          courseTitle,
          moduleTitle: moduleMeta.moduleTitle,
          lessonContext: lessons.map((l) => ({ number: l.number, title: l.title })),
          styleProfile,
        }),
      });
      if (!resp.ok) {
        const { error } = await resp.json().catch(() => ({}));
        throw new Error(error || `Request failed: ${resp.status}`);
      }
      const data = await resp.json();
      setCourseOverview((prev) => ({
        ...prev,
        description:
          typeof data.description === 'string' ? data.description : prev.description,
        audience: typeof data.audience === 'string' ? data.audience : prev.audience,
        value: typeof data.value === 'string' ? data.value : prev.value,
        learningOutcomes: Array.isArray(data.outcomes)
          ? data.outcomes.filter((o) => typeof o === 'string' && o.trim())
          : prev.learningOutcomes,
      }));
      recordChange('Generated course description');
    } catch (err) {
      console.error('Generate description failed:', err);
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const isStyleKit = activeScreen === 'style';
  const isOverview = activeScreen === 'overview';
  const isTeachScreen = activeScreen === 'teach';
  const selectedLessonHasCards = Boolean(
    lessons.find((l) => l.id === selectedLessonId)?.cards?.length,
  );

  // ——— Render ———
  if (view === 'home') {
    return <Homepage onEnterWorkspace={() => setView('dashboard')} />;
  }

  if (view === 'dashboard') {
    return (
      <div className="flex h-screen w-full flex-col bg-canvas text-ink">
        <Dashboard
          courses={courses}
          isLoading={isLoadingCourses}
          error={coursesError}
          onOpenCourse={handleOpenCourse}
          onCreateCourse={handleStartOnboarding}
          onDeleteCourse={handleDeleteCourse}
          onRenameCourse={handleRenameCourse}
          onDuplicateCourse={handleDuplicateCourse}
          onGoHome={() => setView('home')}
          isConfigured={isSupabaseConfigured}
        />
      </div>
    );
  }

  if (view === 'preview') {
    return (
      <StudentPreview
        courseTitle={courseTitle}
        moduleMeta={moduleMeta}
        lessons={lessons}
        onExit={() => setView('builder')}
      />
    );
  }

  if (view === 'teaching') {
    const teachingLesson =
      lessons.find((l) => l.id === selectedLessonId) || lessons[0] || null;
    return (
      <TeachMode
        lesson={teachingLesson}
        lessons={lessons}
        selectedLessonId={selectedLessonId}
        onSelectLesson={setSelectedLessonId}
        onExit={() => setView('builder')}
      />
    );
  }

  if (view === 'onboarding') {
    return (
      <Onboarding
        onComplete={handleOnboardingComplete}
        onCancel={handleCancelOnboarding}
      />
    );
  }

  const exportCourseMeta = {
    title: courseTitle,
    status: moduleMeta.status,
    moduleNumber: moduleMeta.moduleNumber,
    moduleCount: moduleMeta.moduleCount,
    moduleTitle: moduleMeta.moduleTitle,
    moduleSubtitle: moduleMeta.moduleSubtitle,
  };

  return (
    <div className="flex h-screen w-full flex-col bg-canvas text-ink">
      <Topbar
        saveStatus={saveStatus}
        onExport={() => setIsExportOpen(true)}
        onPreview={() => setView('preview')}
        onPresent={handleStartTeaching}
        canPresent={selectedLessonHasCards}
        mode={isTeachScreen ? 'teach' : 'write'}
        onChangeMode={(mode) =>
          setActiveScreen(mode === 'teach' ? 'teach' : 'modules')
        }
        courseTitle={courseTitle}
        courseStatus={moduleMeta.status}
        onChangeCourseTitle={setCourseTitle}
        onBackToDashboard={handleBackToDashboard}
      />
      <div className="flex flex-1 overflow-hidden">
        {!isTeachScreen && <Sidebar active={activeScreen} onSelect={setActiveScreen} />}
        {isTeachScreen ? (
          <Teach
            lessons={lessons}
            modules={modules}
            selectedLessonId={selectedLessonId}
            onSelectLesson={setSelectedLessonId}
            onUpdateCard={handleUpdateCard}
            onDeleteCard={handleDeleteCard}
            onDuplicateCard={handleDuplicateCard}
            onAddCard={handleAddCard}
            onMoveCard={handleMoveCard}
            onReorderCard={handleReorderCard}
            onGenerateCards={handleGenerateCards}
            generatingCardsForId={generatingCardsForId}
            onStartTeaching={handleStartTeaching}
            onReturnToWrite={() => setActiveScreen('modules')}
          />
        ) : isOverview ? (
          <CourseOverview
            courseTitle={courseTitle}
            onChangeCourseTitle={setCourseTitle}
            overview={courseOverview}
            onUpdateOverview={handleUpdateCourseOverview}
            moduleMeta={moduleMeta}
            lessons={lessons}
            onPreview={() => setView('preview')}
            onGenerateDescription={handleGenerateDescription}
            isGeneratingDescription={isGeneratingDescription}
          />
        ) : isStyleKit ? (
          <StyleKit
            sampleText={styleSampleText}
            onChangeSample={setStyleSampleText}
            profile={styleProfile}
            onAnalyze={handleAnalyzeStyle}
            onClear={handleClearStyle}
            onUpdateProfile={handleUpdateStyleProfile}
            onSetStrength={(strength) => handleUpdateStyleProfile({ strength })}
            onAddSignaturePhrase={handleAddSignaturePhrase}
            onRemoveSignaturePhrase={handleRemoveSignaturePhrase}
            isAnalyzing={isAnalyzingStyle}
          />
        ) : (
          <>
            <Canvas
              lessons={lessons}
              modules={modules}
              courseTitle={courseTitle}
              selectedLessonId={selectedLessonId}
              onSelectLesson={setSelectedLessonId}
              onAddLesson={handleAddLesson}
              onRemoveLesson={handleRemoveLesson}
              onUpdateLesson={handleUpdateLesson}
              onUpdateSubBlock={handleUpdateSubBlock}
              onRenameBlock={handleRenameBlock}
              onDuplicateBlock={handleDuplicateBlock}
              onDeleteBlock={handleDeleteBlock}
              onAddBlock={handleAddBlock}
              onUpdateBlock={handleUpdateBlock}
              onReorderBlock={handleReorderBlock}
              onRefineSection={handleRefineSection}
              refiningSections={refiningSections}
              onAddModule={handleAddModule}
              onUpdateModule={handleUpdateModule}
              onRemoveModule={handleRemoveModule}
              showWelcomeBanner={showOnboardingIntro}
              canvasMode={canvasMode}
              onChangeCanvasMode={setCanvasMode}
              onGenerateCards={handleGenerateCards}
              generatingCardsForId={generatingCardsForId}
              onOpenTeachMode={handleOpenTeachMode}
            />
            <AIPanel
              onGenerateLesson={handleGenerateLesson}
              onMatchStyle={handleMatchStyle}
              onAIAction={handleAIAction}
              onStructureLesson={handleStructureLesson}
              onExpandLesson={handleExpandLesson}
              styleProfile={styleProfile}
              canMatchStyle={selectedLessonId !== null}
              canExpand={canExpandSelected}
              isGenerating={isGenerating}
              isMatchingStyle={isMatchingStyle}
              isStructuring={isStructuring}
              isExpanding={isExpanding}
              inFlightAIActions={inFlightAIActions}
              lastChange={lastChange}
            />
          </>
        )}
      </div>
      {styleMatchDialogOpen && (
        <StyleMatchDialog
          hasSavedProfile={Boolean(styleProfile)}
          defaultStrength={styleProfile?.strength || 'medium'}
          onApply={handleConfirmMatchStyle}
          onCancel={handleCancelMatchStyleDialog}
        />
      )}
      {pendingStyleMatch && (
        <StyleComparison
          before={pendingStyleMatch.before}
          after={pendingStyleMatch.after}
          styleLabel={pendingStyleMatch.styleLabel}
          onApply={handleApplyPendingStyle}
          onCancel={handleCancelPendingStyle}
        />
      )}
      {isExportOpen && (
        <ExportModal
          courseMeta={exportCourseMeta}
          lessons={lessons}
          onClose={() => setIsExportOpen(false)}
        />
      )}
      {isOutlineModalOpen && structuredOutline && (
        <StructuredOutlineModal
          outline={structuredOutline.outline}
          lessonTitle={structuredOutline.lessonTitle}
          canApply={Boolean(
            lessons.some((l) => l.id === (structuredOutline.lessonId || selectedLessonId)),
          )}
          onInsertSection={handleInsertOutlineSection}
          onInsertAll={handleInsertEntireOutline}
          onReplace={handleReplaceWithOutline}
          onClose={() => setIsOutlineModalOpen(false)}
        />
      )}
      {pendingExpansion && (
        <ExpansionPreviewModal
          expansion={pendingExpansion.expansion}
          lessonTitle={pendingExpansion.lessonTitle}
          onApply={handleApplyExpansion}
          onCancel={handleCancelExpansion}
        />
      )}
      {showOnboardingIntro && (
        <OnboardingIntro onDismiss={() => setShowOnboardingIntro(false)} />
      )}
    </div>
  );
}
