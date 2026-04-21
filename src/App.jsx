// Unconditional boot logs — run as soon as App.jsx is evaluated, before any
// component renders. Placed at the file top so they emit even if a later
// import throws. Do NOT wrap in any DEV/MODE guard.
console.log('APP STARTED');
console.log('ENV URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('ENV KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('ENV MODE:', import.meta.env.MODE);

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
import * as styleKitApi from './lib/styleKit';
import {
  makeBlock,
  makeBlockId,
  normalizeBlock,
  cloneBlock,
  blockToPlainText,
} from './lib/blockTypes';
import {
  migrateLessonToBlocks,
  buildBlocksFromLessonPayload,
  buildBlocksFromStructureResponse,
  buildBlocksFromExpandResponse,
  buildExpandSectionsFromBlocks,
} from './lib/migrateLesson';
import { applyTheme, DEFAULT_THEME_ID, THEMES } from './themes';

// Temporary: surface env + Supabase wiring so prod misconfig is visible.
if (typeof window !== 'undefined') {
  console.log('[env] MODE:', import.meta.env.MODE);
  console.log('[env] VITE_SUPABASE_URL set:', Boolean(import.meta.env.VITE_SUPABASE_URL));
  console.log('[env] VITE_SUPABASE_ANON_KEY set:', Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY));
  console.log('[env] isSupabaseConfigured:', isSupabaseConfigured);
  if (!isSupabaseConfigured) {
    console.error(
      '[env] Supabase env vars are missing. Data will NOT persist. ' +
        'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env (local) ' +
        'and in Vercel → Project Settings → Environment Variables (prod).',
    );
  }
}

// Role → AI payload key. Blocks that AI generated carry a `role` so that
// Match-Style / Improve / Rewrite / Refine can merge updates back into the
// right block even after the user renames headings.
const ROLE_TO_API_KEY = {
  script: 'script',
  demoSteps: 'demoSteps',
  mistakes: 'commonMistakes',
  tip: 'proTip',
};

const ROLE_TO_LABEL = {
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

function normalizeCard(raw) {
  const r = raw || {};
  // Legacy slide shape: {title, points}
  const keyPoints = Array.isArray(r.keyPoints)
    ? r.keyPoints.filter((p) => typeof p === 'string')
    : Array.isArray(r.points)
      ? r.points.filter((p) => typeof p === 'string')
      : [];
  const image =
    r.image && typeof r.image === 'object' && typeof r.image.src === 'string'
      ? { src: r.image.src, width: r.image.width || 'full' }
      : null;
  return {
    title: r.title || '',
    keyPoints,
    sayLikeThis: typeof r.sayLikeThis === 'string' ? r.sayLikeThis : '',
    watchFor: typeof r.watchFor === 'string' ? r.watchFor : '',
    image,
  };
}

// Normalize (and migrate from legacy subBlocks shape if needed) a lesson.
function normalizeLesson(lesson) {
  const base = migrateLessonToBlocks(lesson);
  const rawCards = Array.isArray(base.cards)
    ? base.cards
    : Array.isArray(base.slides)
      ? base.slides
      : [];
  return {
    id: base.id || makeId(),
    number: base.number,
    moduleId: base.moduleId || '',
    title: base.title || '',
    duration: base.duration || '',
    summary: base.summary || '',
    blocks: Array.isArray(base.blocks) ? base.blocks.map(normalizeBlock) : [],
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

function buildEmptyLesson(number, moduleId = '') {
  return {
    id: makeId(),
    number,
    moduleId,
    title: '',
    duration: '',
    summary: '',
    blocks: [],
    cards: [],
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
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);

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
  const [styleProfile, setStyleProfile] = useState(null);
  const [styleSampleText, setStyleSampleText] = useState('');
  const [styleKitLoaded, setStyleKitLoaded] = useState(false);
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
  const styleKitSaveTimerRef = useRef(null);

  // ——— Style Kit: hydrate from Supabase on mount ———
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStyleKitLoaded(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { profile, sampleText } = await styleKitApi.fetchStyleKit();
        console.log('[styleKit] loaded from Supabase:', { hasProfile: Boolean(profile), sampleChars: sampleText.length });
        if (cancelled) return;
        setStyleProfile(migrateStyleProfile(profile));
        setStyleSampleText(sampleText || '');
      } catch (err) {
        console.error('[styleKit] load failed:', err);
      } finally {
        if (!cancelled) setStyleKitLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ——— Style Kit: debounced upsert to Supabase ———
  // Only runs after the initial hydrate so we never overwrite the row with
  // default empty state during the first render.
  useEffect(() => {
    if (!isSupabaseConfigured || !styleKitLoaded) return;
    clearTimeout(styleKitSaveTimerRef.current);
    styleKitSaveTimerRef.current = setTimeout(async () => {
      try {
        await styleKitApi.saveStyleKit({
          profile: styleProfile,
          sampleText: styleSampleText,
        });
      } catch (err) {
        console.error('[styleKit] save failed:', err);
      }
    }, 600);
    return () => clearTimeout(styleKitSaveTimerRef.current);
  }, [styleProfile, styleSampleText, styleKitLoaded]);

  useEffect(() => () => clearTimeout(styleKitSaveTimerRef.current), []);

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
    // Apply the course's saved theme (falls back to default).
    const savedTheme = course.content?.themeId;
    const nextThemeId = savedTheme && THEMES[savedTheme] ? savedTheme : DEFAULT_THEME_ID;
    setThemeId(nextThemeId);
    applyTheme(nextThemeId);
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
          blocks: buildBlocksFromLessonPayload(lessonPayload),
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
        content: { modules, lessons, overview: courseOverview, themeId },
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
    setThemeId(DEFAULT_THEME_ID);
    applyTheme(DEFAULT_THEME_ID);
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
          content: { modules, lessons, overview: courseOverview, themeId },
        });
        setSaveStatus('saved');
      } catch (err) {
        console.error('Save failed:', err);
        setSaveStatus('error');
      }
    }, 900);
    return () => clearTimeout(saveTimerRef.current);
  }, [currentCourseId, courseTitle, modules, lessons, courseOverview, themeId]);

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
        blocks: buildBlocksFromLessonPayload(data),
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
      console.error('Generate lesson failed:', err);
      alert(
        `Could not generate lesson: ${err.message}\n\n` +
          'Check that ANTHROPIC_API_KEY is set in your Vercel project settings.',
      );
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

  // Insert a single structured-outline section into the current lesson.
  const handleInsertOutlineSection = (section) => {
    const targetLessonId = structuredOutline?.lessonId || selectedLessonId;
    if (!targetLessonId) return;
    const newBlocks = buildBlocksFromStructureResponse({ sections: [section] });
    if (newBlocks.length === 0) return;
    setLessons((prev) =>
      prev.map((l) =>
        l.id === targetLessonId ? { ...l, blocks: [...l.blocks, ...newBlocks] } : l,
      ),
    );
    scrollToBlock(newBlocks[0].id);
    recordChange('Inserted outline section', section?.title || '');
  };

  const handleInsertEntireOutline = () => {
    const targetLessonId = structuredOutline?.lessonId || selectedLessonId;
    const sections = structuredOutline?.outline?.sections;
    if (!targetLessonId || !Array.isArray(sections) || sections.length === 0) return;
    const newBlocks = buildBlocksFromStructureResponse({ sections });
    if (newBlocks.length === 0) return;
    setLessons((prev) =>
      prev.map((l) =>
        l.id === targetLessonId ? { ...l, blocks: [...l.blocks, ...newBlocks] } : l,
      ),
    );
    scrollToBlock(newBlocks[0]?.id);
    recordChange('Inserted full outline', structuredOutline.lessonTitle || '');
    setIsOutlineModalOpen(false);
  };

  const handleReplaceWithOutline = () => {
    const targetLessonId = structuredOutline?.lessonId || selectedLessonId;
    const sections = structuredOutline?.outline?.sections;
    if (!targetLessonId || !Array.isArray(sections) || sections.length === 0) return;
    const confirmed = window.confirm(
      "Replace this lesson's content with the structured outline? Existing blocks will be removed.",
    );
    if (!confirmed) return;
    const newBlocks = buildBlocksFromStructureResponse({ sections });
    setLessons((prev) =>
      prev.map((l) => (l.id === targetLessonId ? { ...l, blocks: newBlocks } : l)),
    );
    scrollToBlock(newBlocks[0]?.id);
    recordChange('Replaced lesson with outline', structuredOutline.lessonTitle || '');
    setIsOutlineModalOpen(false);
  };

  const handleCopyOutlineToClipboard = async () => {
    const sections = structuredOutline?.outline?.sections;
    if (!Array.isArray(sections)) return;
    const text = sections
      .map((s) => {
        const title = typeof s?.title === 'string' ? s.title.trim() : '';
        if (s?.type === 'expand') {
          const notes = typeof s?.notes === 'string' ? s.notes.trim() : '';
          return `${title}\n${notes}`;
        }
        const items = Array.isArray(s?.items) ? s.items : [];
        const lines = items
          .map((it) => {
            if (typeof it === 'string') return `• ${it.trim()}`;
            const bTitle = typeof it?.title === 'string' ? it.title.trim() : '';
            const sub = Array.isArray(it?.blocks)
              ? it.blocks
                  .map((b) => (typeof b?.content === 'string' ? `    ${b.content.trim()}` : ''))
                  .filter(Boolean)
                  .join('\n')
              : '';
            return sub ? `• ${bTitle}\n${sub}` : `• ${bTitle}`;
          })
          .filter(Boolean)
          .join('\n');
        return `${title}\n${lines}`;
      })
      .filter(Boolean)
      .join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Clipboard write failed:', err);
      alert('Could not copy to clipboard. Check browser permissions.');
    }
  };

  // Expand: collect bullet-like content (heading → text/steps/checklist) from
  // the flat block list into section+items payload the backend expects.
  const handleExpandLesson = async () => {
    if (isExpanding) return;
    const lesson = lessons.find((l) => l.id === selectedLessonId);
    if (!lesson) return;

    const sections = buildExpandSectionsFromBlocks(lesson.blocks);
    if (sections.length === 0) {
      alert(
        'This lesson has no heading + bullet-like content to expand. Add a heading with a steps or checklist block below it, then try again.',
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
    const newBlocks = buildBlocksFromExpandResponse(expansion);
    if (newBlocks.length === 0) {
      setPendingExpansion(null);
      return;
    }
    setLessons((prev) =>
      prev.map((l) => (l.id === lessonId ? { ...l, blocks: [...l.blocks, ...newBlocks] } : l)),
    );
    scrollToBlock(newBlocks[0]?.id);
    recordChange('Expanded lesson to teach', pendingExpansion.lessonTitle || '');
    setPendingExpansion(null);
  };

  const handleCancelExpansion = () => setPendingExpansion(null);

  const canExpandSelected = (() => {
    const l = lessons.find((x) => x.id === selectedLessonId);
    if (!l) return false;
    return buildExpandSectionsFromBlocks(l.blocks).length > 0;
  })();

  const handleGenerateCards = async (lessonId) => {
    if (generatingCardsForId) return;
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson) return;

    const byRole = rolePayloadFromBlocks(lesson.blocks);
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

  const handleDuplicateBlock = (lessonId, blockId) => {
    setLessons((prev) =>
      prev.map((l) => {
        if (l.id !== lessonId) return l;
        const idx = l.blocks.findIndex((b) => b.id === blockId);
        if (idx === -1) return l;
        // Drop role on duplicates so AI merges don't overwrite both with the
        // same content.
        const { role: _drop, ...rest } = l.blocks[idx];
        const copy = cloneBlock(rest);
        const next = [...l.blocks];
        next.splice(idx + 1, 0, copy);
        return { ...l, blocks: next };
      }),
    );
    recordChange('Duplicated a block');
  };

  const handleDeleteBlock = (lessonId, blockId) => {
    setLessons((prev) =>
      prev.map((l) =>
        l.id === lessonId ? { ...l, blocks: l.blocks.filter((b) => b.id !== blockId) } : l,
      ),
    );
    recordChange('Removed a block');
  };

  // Insert a fresh block of `type` at a specific index in the lesson's block
  // list. Replaces the old `handleAddBlock` which only appended.
  const handleInsertBlock = (lessonId, index, type) => {
    const block = makeBlock(type);
    setLessons((prev) =>
      prev.map((l) => {
        if (l.id !== lessonId) return l;
        const next = [...l.blocks];
        const clamped = Math.max(0, Math.min(index, next.length));
        next.splice(clamped, 0, block);
        return { ...l, blocks: next };
      }),
    );
    recordChange(`Added ${type} block`);
  };

  // Merge two adjacent blocks (typically an image + prose pair) into a
  // single 2-column split block. `aId` becomes the left column, `bId` the
  // right, preserving reading order. Surfaced via the "Convert to
  // side-by-side" suggestion in the canvas.
  const handleConvertToSplit = (lessonId, aId, bId) => {
    setLessons((prev) =>
      prev.map((l) => {
        if (l.id !== lessonId) return l;
        const aIdx = l.blocks.findIndex((b) => b.id === aId);
        const bIdx = l.blocks.findIndex((b) => b.id === bId);
        if (aIdx === -1 || bIdx === -1 || bIdx !== aIdx + 1) return l;
        const a = l.blocks[aIdx];
        const b = l.blocks[bIdx];
        const split = makeBlock('split');
        split.content = {
          ...split.content,
          columns: [{ blocks: [a] }, { blocks: [b] }],
        };
        const next = [...l.blocks];
        next.splice(aIdx, 2, split);
        return { ...l, blocks: next };
      }),
    );
    recordChange('Converted to side-by-side');
  };

  const handleReorderBlock = (lessonId, fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    setLessons((prev) =>
      prev.map((l) => {
        if (l.id !== lessonId) return l;
        const next = [...l.blocks];
        if (fromIndex < 0 || fromIndex >= next.length) return l;
        const [moved] = next.splice(fromIndex, 1);
        const clampedTo = Math.max(0, Math.min(toIndex, next.length));
        next.splice(clampedTo, 0, moved);
        return { ...l, blocks: next };
      }),
    );
  };

  const handleUpdateBlock = (lessonId, blockId, patch) => {
    setLessons((prev) =>
      prev.map((l) =>
        l.id === lessonId
          ? {
              ...l,
              blocks: l.blocks.map((b) => (b.id === blockId ? { ...b, ...patch } : b)),
            }
          : l,
      ),
    );
  };

  // Extract role-tagged plain text from the flat blocks list so AI endpoints
  // (generateCards, matchStyle, aiAction) keep receiving the same shape.
  function rolePayloadFromBlocks(blocks) {
    const out = { script: '', demoSteps: '', mistakes: '', tip: '' };
    if (!Array.isArray(blocks)) return out;
    for (const b of blocks) {
      if (!b || !b.role) continue;
      const text = blockToPlainText(b).trim();
      if (!text) continue;
      // Concatenate if multiple blocks share a role (e.g. heading + body).
      out[b.role] = out[b.role] ? `${out[b.role]}\n${text}` : text;
    }
    return out;
  }

  const buildMatchStylePayload = (lesson) => {
    const byRole = rolePayloadFromBlocks(lesson.blocks);
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

  // Merge an AI response ({title, summary, script, demoSteps, commonMistakes,
  // proTip}) back into the lesson's flat blocks. Targets blocks by role. If
  // no block carries the role, a new block is appended (heading + content).
  const mergeAIResponseIntoLesson = (lesson, data) => {
    const next = [...lesson.blocks];
    const seen = new Set();

    const roleOrder = ['script', 'demoSteps', 'mistakes', 'tip'];
    for (const role of roleOrder) {
      const apiKey = ROLE_TO_API_KEY[role];
      const value = typeof data[apiKey] === 'string' ? data[apiKey] : null;
      if (value === null) continue;

      // Update any existing block(s) with this role. For steps-like roles,
      // demoSteps text is converted into a steps block's items if that's the
      // host block type. Otherwise the plain string is stored as HTML text.
      let hit = false;
      for (let i = 0; i < next.length; i += 1) {
        const b = next[i];
        if (!b || b.role !== role) continue;
        hit = true;
        seen.add(role);
        if (b.type === 'heading') continue; // heading text stays stable
        if (b.type === 'steps') {
          const items = value
            .split(/\n+/)
            .map((s) => s.replace(/^\s*\d+\s*[.)]\s*/, '').trim())
            .filter(Boolean);
          next[i] = {
            ...b,
            content: items.length
              ? items.map((t) => ({ id: makeBlockId(), text: t }))
              : [],
          };
        } else {
          next[i] = { ...b, content: value };
        }
      }
      if (!hit && value.trim()) {
        // No existing role-tagged block — append heading + content at end.
        next.push({
          id: makeBlockId(),
          type: 'heading',
          role,
          content: ROLE_TO_LABEL[role] || role,
        });
        if (role === 'demoSteps') {
          const items = value
            .split(/\n+/)
            .map((s) => s.replace(/^\s*\d+\s*[.)]\s*/, '').trim())
            .filter(Boolean);
          next.push({
            id: makeBlockId(),
            type: 'steps',
            role,
            content: items.length
              ? items.map((t) => ({ id: makeBlockId(), text: t }))
              : [],
          });
        } else if (role === 'tip' || role === 'mistakes') {
          next.push({ id: makeBlockId(), type: 'tip', role, content: value });
        } else {
          next.push({ id: makeBlockId(), type: 'text', role, content: value });
        }
      }
    }

    return {
      ...lesson,
      title: typeof data.title === 'string' ? data.title : lesson.title,
      duration: typeof data.duration === 'string' ? data.duration : lesson.duration,
      summary: typeof data.summary === 'string' ? data.summary : lesson.summary,
      blocks: next,
    };
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

    if (!keywords && !effectiveProfile) {
      alert('Add some style keywords or capture your voice first, then try again.');
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
      console.error('Match style failed:', err);
      alert(`Match style failed: ${err.message}`);
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

      setLessons((prev) =>
        prev.map((l) =>
          l.id === selectedLessonId ? mergeAIResponseIntoLesson(l, data) : l,
        ),
      );
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
    const block = lesson.blocks.find((b) => b.id === blockId);
    if (!block) return;

    setRefiningSections((prev) => new Set(prev).add(key));

    const priorText = blockToPlainText(block);
    const sectionLabel = block.role ? ROLE_TO_LABEL[block.role] : block.type;
    try {
      const resp = await fetch('/api/refineSection', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sectionLabel,
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
          prev.map((l) => {
            if (l.id !== lessonId) return l;
            return {
              ...l,
              blocks: l.blocks.map((b) => {
                if (b.id !== blockId) return b;
                if (b.type === 'steps') {
                  const items = data.content
                    .split(/\n+/)
                    .map((s) => s.replace(/^\s*\d+\s*[.)]\s*/, '').trim())
                    .filter(Boolean);
                  return {
                    ...b,
                    content: items.length
                      ? items.map((t) => ({ id: makeBlockId(), text: t }))
                      : [],
                  };
                }
                return { ...b, content: data.content };
              }),
            };
          }),
        );
        recordChange(
          `${hadPrior ? 'Improved' : 'Generated'} ${sectionLabel.toLowerCase()}`,
          lesson.title,
        );
      }
    } catch (err) {
      console.error(`Refine section failed (${sectionLabel}):`, err);
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

  // Instant theme swap: update state + DOM attribute in the same tick.
  // Persistence happens via the existing debounced save (themeId is in the
  // effect's dep array).
  const handleChangeTheme = (nextId) => {
    if (!THEMES[nextId]) return;
    setThemeId(nextId);
    applyTheme(nextId);
    recordChange('Switched theme', THEMES[nextId].name);
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
        themeId={themeId}
        onChangeTheme={handleChangeTheme}
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
              onUpdateBlock={handleUpdateBlock}
              onInsertBlock={handleInsertBlock}
              onDeleteBlock={handleDeleteBlock}
              onDuplicateBlock={handleDuplicateBlock}
              onReorderBlock={handleReorderBlock}
              onConvertToSplit={handleConvertToSplit}
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
          onCopy={handleCopyOutlineToClipboard}
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
