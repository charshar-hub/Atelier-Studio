import { useEffect, useMemo, useRef, useState } from 'react';
import { blockHasContent, blockToPlainText } from '../lib/blocks';
import { imageWidthClass, blockWidthClass } from '../lib/images';

export default function StudentPreview({ courseTitle, moduleMeta, lessons, onExit }) {
  const [currentLessonId, setCurrentLessonId] = useState(lessons[0]?.id ?? null);
  const [completed, setCompleted] = useState(() => new Set());
  const contentRef = useRef(null);

  useEffect(() => {
    // Reset the main scroll container on every lesson change so each lesson
    // starts from the top — matches how a real course platform behaves.
    const el = contentRef.current;
    if (!el) return;
    el.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentLessonId]);

  useEffect(() => {
    if (lessons.length === 0) {
      if (currentLessonId !== null) setCurrentLessonId(null);
    } else if (!lessons.some((l) => l.id === currentLessonId)) {
      setCurrentLessonId(lessons[0].id);
    }
  }, [lessons, currentLessonId]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onExit?.();
      } else if (e.key === 'ArrowRight') {
        setCurrentLessonId((curr) => {
          const idx = lessons.findIndex((l) => l.id === curr);
          return idx >= 0 && idx < lessons.length - 1 ? lessons[idx + 1].id : curr;
        });
      } else if (e.key === 'ArrowLeft') {
        setCurrentLessonId((curr) => {
          const idx = lessons.findIndex((l) => l.id === curr);
          return idx > 0 ? lessons[idx - 1].id : curr;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lessons, onExit]);

  const currentIndex = lessons.findIndex((l) => l.id === currentLessonId);
  const current = currentIndex >= 0 ? lessons[currentIndex] : null;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < lessons.length - 1;

  const goPrev = () => hasPrev && setCurrentLessonId(lessons[currentIndex - 1].id);
  const goNext = () => hasNext && setCurrentLessonId(lessons[currentIndex + 1].id);

  const completedCount = useMemo(
    () => lessons.filter((l) => completed.has(l.id)).length,
    [lessons, completed],
  );
  const progressPct = lessons.length
    ? Math.round((completedCount / lessons.length) * 100)
    : 0;

  const toggleComplete = (id) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex h-screen w-full flex-col bg-canvas text-ink">
      <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-whisper bg-canvas px-6">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] text-ink-soft transition hover:bg-paper hover:text-ink"
        >
          <span aria-hidden="true">←</span>
          <span>Exit preview</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="text-[10px] tracking-[0.3em] text-accent">STUDENT PREVIEW</span>
        </div>
        <div className="w-[140px]" aria-hidden="true" />
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="flex w-[320px] flex-shrink-0 flex-col border-r border-whisper bg-paper">
          <CourseHeader
            courseTitle={courseTitle}
            moduleMeta={moduleMeta}
            completedCount={completedCount}
            totalCount={lessons.length}
            progressPct={progressPct}
          />

          <div className="flex-1 overflow-y-auto px-3 py-3">
            {lessons.length === 0 ? (
              <div className="px-3 py-6 text-center text-[13px] italic text-ink-muted">
                No lessons yet.
              </div>
            ) : (
              lessons.map((lesson) => (
                <LessonNavItem
                  key={lesson.id}
                  lesson={lesson}
                  active={lesson.id === currentLessonId}
                  isComplete={completed.has(lesson.id)}
                  onSelect={() => setCurrentLessonId(lesson.id)}
                />
              ))
            )}
          </div>
        </aside>

        <main className="flex flex-1 flex-col overflow-hidden">
          {current ? (
            <>
              <div ref={contentRef} className="flex-1 overflow-y-auto px-16 py-14">
                <article key={current.id} className="mx-auto max-w-[740px] animate-fade-up">
                  <LessonHero lesson={current} totalCount={lessons.length} />
                  <LessonBody lesson={current} />
                  <MarkCompleteButton
                    isComplete={completed.has(current.id)}
                    onToggle={() => toggleComplete(current.id)}
                  />
                </article>
              </div>
              <footer className="flex flex-shrink-0 items-center justify-between border-t border-whisper bg-canvas px-16 py-5">
                <button
                  onClick={goPrev}
                  disabled={!hasPrev}
                  className="flex h-10 items-center gap-2 rounded-md border border-whisper bg-white px-4 text-[13px] tracking-wide text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span aria-hidden="true">←</span>
                  <span>Previous</span>
                </button>
                <span className="text-[12px] tracking-wide text-ink-soft">
                  Lesson {currentIndex + 1} of {lessons.length}
                </span>
                <button
                  onClick={goNext}
                  disabled={!hasNext}
                  className="flex h-10 items-center gap-2 rounded-md bg-ink px-5 text-[13px] tracking-wide text-canvas transition hover:bg-[#2A1F18] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span>Next</span>
                  <span aria-hidden="true">→</span>
                </button>
              </footer>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-10">
              <div className="max-w-[420px] text-center">
                <div className="mb-2 text-[10px] tracking-[0.25em] text-accent">EMPTY COURSE</div>
                <p className="font-serif text-[22px] italic leading-[1.4] text-ink-soft">
                  Add lessons in the builder to see them here.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function CourseHeader({ courseTitle, moduleMeta, completedCount, totalCount, progressPct }) {
  return (
    <div className="border-b border-whisper px-6 py-7">
      <div className="mb-2 text-[10px] tracking-[0.28em] text-accent">COURSE</div>
      <h2 className="mb-5 font-serif text-[24px] leading-[1.15] tracking-tight text-ink">
        {courseTitle || 'Untitled course'}
      </h2>

      <div className="mb-5 border-l-2 border-accent/30 pl-3">
        <div className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">
          Module {moduleMeta?.moduleNumber ?? 1} of {moduleMeta?.moduleCount ?? 1}
        </div>
        {moduleMeta?.moduleTitle && (
          <div className="mt-0.5 font-serif text-[15px] italic leading-[1.3] text-ink-soft">
            {moduleMeta.moduleTitle}
          </div>
        )}
      </div>

      {totalCount > 0 && (
        <>
          <div className="mb-2 flex items-center justify-between text-[11px] text-ink-soft">
            <span>
              {completedCount} of {totalCount} complete
            </span>
            <span className="font-medium text-ink">{progressPct}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-whisper">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}

function LessonNavItem({ lesson, active, isComplete, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`mb-1 flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200 ${
        active
          ? 'border border-accent/40 bg-white shadow-[0_0_0_3px_rgba(184,147,106,0.08)]'
          : 'border border-transparent hover:bg-whisper/50'
      }`}
    >
      <span
        className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[12px] transition-colors ${
          active
            ? 'bg-accent text-canvas'
            : isComplete
              ? 'border border-accent/50 bg-white text-accent'
              : 'bg-paper font-serif italic text-ink-muted'
        }`}
      >
        {isComplete ? <CheckGlyph /> : lesson.number}
      </span>
      <div className="min-w-0 flex-1">
        <div
          className={`truncate font-serif text-[14px] leading-[1.3] ${
            active ? 'font-medium text-ink' : isComplete ? 'text-ink-soft' : 'text-ink-soft'
          }`}
        >
          {lesson.title || 'Untitled lesson'}
        </div>
        {lesson.duration && (
          <div className="mt-0.5 text-[10px] tracking-[0.1em] text-ink-muted">
            {lesson.duration}
          </div>
        )}
      </div>
    </button>
  );
}

function LessonHero({ lesson, totalCount }) {
  return (
    <header className="mb-10">
      <div className="mb-4 text-[10px] tracking-[0.28em] text-accent">
        LESSON {lesson.number} OF {totalCount}
      </div>
      <h1 className="mb-5 font-serif text-[44px] leading-[1.05] tracking-tight text-ink">
        {lesson.title || 'Untitled lesson'}
      </h1>
      <div className="flex flex-wrap items-center gap-2">
        {lesson.duration && (
          <span className="inline-flex items-center rounded-full border border-whisper bg-white px-3 py-1 text-[11px] tracking-wide text-ink-soft">
            {lesson.duration}
          </span>
        )}
      </div>
      {lesson.summary && (
        <p className="mt-7 whitespace-pre-wrap font-serif text-[19px] italic leading-[1.55] text-ink-soft">
          {lesson.summary}
        </p>
      )}
    </header>
  );
}

function LessonBody({ lesson }) {
  const populated = (lesson.subBlocks || []).filter((sb) => blockHasContent(sb));

  if (populated.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-whisper px-5 py-6 text-center text-[13px] italic text-ink-muted">
        This lesson is still empty.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {populated.map((sb) => (
        <SectionCard key={sb.id || sb.label} block={sb} />
      ))}
    </div>
  );
}

function SectionCard({ block }) {
  return (
    <section
      className="rounded-xl bg-white px-7 py-6 shadow-[0_1px_3px_rgba(58,46,38,0.04)]"
      style={{ borderLeft: `3px solid ${block.tint}` }}
    >
      <div className="mb-3 flex items-center gap-2">
        <span
          className="h-1 w-4 rounded-full"
          style={{ backgroundColor: block.tint }}
          aria-hidden="true"
        />
        <span className="text-[10px] uppercase tracking-[0.28em] text-ink-muted">
          {block.label}
        </span>
      </div>
      <SectionBody block={block} />
    </section>
  );
}

function SectionBody({ block }) {
  if (block.type === 'steps') {
    const items = Array.isArray(block.items) ? block.items : [];
    if (items.length === 0) return null;
    return (
      <ol className="space-y-4">
        {items.map((it, i) => (
          <li key={it.id || i} className="flex items-start gap-4">
            <span className="mt-0.5 font-serif italic text-[14px] text-ink-faint">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              {it.text && (
                <div
                  className="rich-text text-[17px] leading-[1.7] text-ink"
                  dangerouslySetInnerHTML={{ __html: it.text }}
                />
              )}
              {it.image?.src && (
                <div className={it.image.width === 'full' ? '' : 'flex justify-center'}>
                  <img
                    src={it.image.src}
                    alt=""
                    className={`rounded-lg ${imageWidthClass(it.image.width)}`}
                  />
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    );
  }
  if (block.type === 'visual') {
    const notes = Array.isArray(block.notes) ? block.notes.filter((n) => n && n.trim()) : [];
    const isSplit = block.layout === 'split';
    const caption = block.caption && (
      <p className="font-serif text-[16px] italic leading-[1.55] text-ink-soft">
        {block.caption}
      </p>
    );
    const notesList = notes.length > 0 && (
      <ul className="space-y-1.5">
        {notes.map((note, i) => (
          <li
            key={i}
            className="flex items-start gap-3 text-[15.5px] leading-[1.7] text-ink"
          >
            <span className="mt-[12px] h-1 w-1.5 shrink-0 rounded-full bg-accent/60" />
            <span className="min-w-0 flex-1">{note}</span>
          </li>
        ))}
      </ul>
    );
    const image = block.image?.src && (
      <div className={isSplit || block.image.width === 'full' ? '' : 'flex justify-center'}>
        <img
          src={block.image.src}
          alt=""
          className={`rounded-lg ${
            isSplit ? 'w-full' : imageWidthClass(block.image.width)
          }`}
        />
      </div>
    );
    if (isSplit) {
      return (
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-5">
          {image || <div />}
          <div className="space-y-4">
            {caption}
            {notesList}
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {image}
        {caption}
        {notesList}
      </div>
    );
  }
  if (block.type === 'comparison') {
    const size = block.size || 'full';
    const widthClass = blockWidthClass(size);
    return (
      <div className={size === 'full' ? 'w-full' : `${widthClass} mx-auto`}>
        <div className="grid grid-cols-2 gap-4">
          {['left', 'right'].map((side) => {
            const s = block[side] || {};
            return (
              <figure key={side}>
                {s.image?.src ? (
                  <img
                    src={s.image.src}
                    alt=""
                    className="w-full rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-whisper bg-paper/40 text-[11px] italic text-ink-faint">
                    No image
                  </div>
                )}
                {s.label && (
                  <figcaption className="mt-2 text-[10.5px] uppercase tracking-[0.22em] text-ink-muted">
                    {s.label}
                  </figcaption>
                )}
              </figure>
            );
          })}
        </div>
      </div>
    );
  }
  // Text/tips/custom blocks render their stored HTML (light formatting from
  // the inline rich-text toolbar: bold, italic, underline, lists, size/color
  // spans, highlight). Content comes from our toolbar only — paste is
  // plain-text — so the surface is safe enough to render directly.
  return (
    <div
      className="rich-text text-[17px] leading-[1.8] text-ink"
      dangerouslySetInnerHTML={{ __html: block.content || '' }}
    />
  );
}

function MarkCompleteButton({ isComplete, onToggle }) {
  return (
    <div className="mt-12 flex items-center justify-center">
      <button
        type="button"
        onClick={onToggle}
        className={`flex items-center gap-2.5 rounded-full px-6 py-3 text-[13px] tracking-wide transition-all duration-200 ${
          isComplete
            ? 'bg-ink text-canvas shadow-[0_2px_10px_rgba(58,46,38,0.18)] hover:bg-[#2A1F18]'
            : 'border border-whisper bg-white text-ink hover:border-accent/50 hover:bg-paper'
        }`}
      >
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full ${
            isComplete
              ? 'bg-canvas/20 text-canvas'
              : 'border border-whisper text-ink-muted'
          }`}
        >
          <CheckGlyph />
        </span>
        <span>{isComplete ? 'Completed' : 'Mark as complete'}</span>
      </button>
    </div>
  );
}

function CheckGlyph() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8.5L6.5 12L13 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
