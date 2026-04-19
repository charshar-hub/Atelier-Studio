import { useEffect, useMemo, useState } from 'react';

export default function TeachMode({
  lesson,
  lessons,
  selectedLessonId,
  onSelectLesson,
  onExit,
}) {
  const lessonsWithCards = useMemo(
    () => lessons.filter((l) => Array.isArray(l.cards) && l.cards.length > 0),
    [lessons],
  );

  const initial = useMemo(() => {
    const fromSelected = lessonsWithCards.find(
      (l) => l.id === (lesson?.id || selectedLessonId),
    );
    return fromSelected || lessonsWithCards[0] || null;
  }, [lesson, selectedLessonId, lessonsWithCards]);

  const [activeLessonId, setActiveLessonId] = useState(initial?.id || null);
  const [cardIndex, setCardIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [notesOpen, setNotesOpen] = useState(false);

  useEffect(() => {
    if (initial && initial.id !== activeLessonId) {
      setActiveLessonId(initial.id);
      setCardIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeLesson =
    lessonsWithCards.find((l) => l.id === activeLessonId) ||
    lessonsWithCards[0] ||
    null;
  const cards = activeLesson?.cards || [];
  const current = cards[cardIndex];

  const go = (delta) => {
    if (!activeLesson) return;
    // Close teacher notes on step change so the next card starts clean.
    setNotesOpen(false);
    const nextIdx = cardIndex + delta;
    if (nextIdx >= 0 && nextIdx < cards.length) {
      setDirection(delta > 0 ? 1 : -1);
      setCardIndex(nextIdx);
      return;
    }
    const list = lessonsWithCards;
    const pos = list.findIndex((l) => l.id === activeLesson.id);
    if (delta > 0 && pos < list.length - 1) {
      const next = list[pos + 1];
      setActiveLessonId(next.id);
      setDirection(1);
      setCardIndex(0);
      if (onSelectLesson) onSelectLesson(next.id);
    } else if (delta < 0 && pos > 0) {
      const prev = list[pos - 1];
      setActiveLessonId(prev.id);
      setDirection(-1);
      setCardIndex(prev.cards.length - 1);
      if (onSelectLesson) onSelectLesson(prev.id);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        onExit();
        return;
      }
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        go(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        go(-1);
      } else if (e.key === 'Home') {
        setCardIndex(0);
      } else if (e.key === 'End') {
        setCardIndex(Math.max(0, cards.length - 1));
      } else if (e.key === 's' || e.key === 'S' || e.key === 'n' || e.key === 'N') {
        setNotesOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardIndex, activeLessonId, cards.length]);

  if (!activeLesson) {
    return (
      <div className="flex h-screen w-full flex-col bg-canvas text-ink">
        <TeachHeader onExit={onExit} />
        <div className="flex flex-1 items-center justify-center px-10 text-center">
          <div>
            <p className="mb-2 font-serif text-[24px] italic leading-[1.3] text-ink-soft">
              Nothing to teach yet.
            </p>
            <p className="text-[14px] text-ink-muted">
              Build a teaching flow for a lesson, then return here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const animIn =
    direction < 0 ? 'animate-slide-in-left' : 'animate-slide-in-right';

  return (
    <div className="flex h-screen w-full flex-col bg-canvas text-ink">
      <TeachHeader
        onExit={onExit}
        lessonTitle={activeLesson.title}
        cardIndex={cardIndex}
        totalCards={cards.length}
        notesOpen={notesOpen}
        onToggleNotes={() => setNotesOpen((v) => !v)}
        hasNotes={Boolean(current?.sayLikeThis?.trim() || current?.watchFor?.trim())}
      />

      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-16">
        <article
          key={`${activeLesson.id}-${cardIndex}`}
          className={`mx-auto w-full max-w-[1240px] ${animIn}`}
          style={{ willChange: 'opacity, transform' }}
        >
          <LiveCard
            card={current}
            notesOpen={notesOpen}
            onToggleNotes={() => setNotesOpen((v) => !v)}
          />
        </article>
      </div>

      <TeachFooter
        cardIndex={cardIndex}
        totalCards={cards.length}
        hasPrev={
          cardIndex > 0 ||
          lessonsWithCards.findIndex((l) => l.id === activeLesson.id) > 0
        }
        hasNext={
          cardIndex < cards.length - 1 ||
          lessonsWithCards.findIndex((l) => l.id === activeLesson.id) <
            lessonsWithCards.length - 1
        }
        onPrev={() => go(-1)}
        onNext={() => go(1)}
      />
    </div>
  );
}

/* ───────────────────────────── Live card ───────────────────────────── */

function LiveCard({ card, notesOpen, onToggleNotes }) {
  // Present Mode caps visible key points to 3 — extras stay in the builder
  // for reference but shouldn't distract a live presenter.
  const keyPoints = Array.isArray(card?.keyPoints)
    ? card.keyPoints.filter((p) => p && p.trim()).slice(0, 3)
    : [];
  const sayLikeThis = card?.sayLikeThis?.trim();
  const watchFor = card?.watchFor?.trim();
  const hasNotes = Boolean(sayLikeThis || watchFor);
  const hasImage = Boolean(card?.image?.src);

  // Clicking anywhere on the card toggles teacher notes — simple tap target
  // for a hands-on teaching environment. Keyboard users can press S or N.
  const handleToggle = (e) => {
    if (!hasNotes) return;
    e.stopPropagation();
    onToggleNotes?.();
  };

  return (
    <div
      onClick={handleToggle}
      role={hasNotes ? 'button' : undefined}
      aria-pressed={hasNotes ? notesOpen : undefined}
      className={`${hasNotes ? 'cursor-pointer' : ''} ${
        hasImage
          ? 'grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-14'
          : ''
      }`}
    >
      {hasImage && (
        <figure className="overflow-hidden rounded-[18px] border border-whisper/60 bg-paper/30">
          <img
            src={card.image.src}
            alt=""
            className="h-auto w-full object-cover"
            draggable={false}
          />
        </figure>
      )}
      <div>
        <h1
          className={`font-serif leading-[1.05] tracking-tight text-ink ${
            hasImage ? 'mb-10 text-[48px]' : 'mb-12 text-[68px]'
          }`}
        >
          {card?.title || 'Untitled step'}
        </h1>

        {keyPoints.length > 0 && (
          <ul className="mb-10 space-y-5">
            {keyPoints.map((point, i) => (
              <li
                key={i}
                className={`flex items-start gap-5 font-serif leading-[1.45] text-ink-soft ${
                  hasImage ? 'text-[22px]' : 'gap-6 text-[28px]'
                }`}
              >
                <span
                  className="mt-[18px] h-[3px] w-[24px] shrink-0 rounded-full bg-accent/70"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">{point}</span>
              </li>
            ))}
          </ul>
        )}

        {hasNotes && !notesOpen && (
          <div className="mt-8 flex items-center gap-2.5 border-t border-whisper/60 pt-5 text-[11px] uppercase tracking-[0.2em] text-ink-faint">
            <span
              className="h-1 w-1 rounded-full bg-ink-faint"
              aria-hidden="true"
            />
            Tap anywhere for teacher notes
          </div>
        )}

        {hasNotes && notesOpen && (
          <div className="mt-6 animate-fade-up">
            {sayLikeThis && (
              <LiveBand tone="warm" label="Say it like this">
                {sayLikeThis}
              </LiveBand>
            )}
            {watchFor && (
              <LiveBand tone="alert" label="Watch for">
                {watchFor}
              </LiveBand>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LiveBand({ tone, label, children }) {
  const barColor = tone === 'alert' ? 'bg-rose/70' : 'bg-accent/70';
  return (
    <section className="mt-6 border-t border-whisper/70 pt-6">
      <div className="mb-2 flex items-center gap-3">
        <span className={`h-[3px] w-[22px] rounded-full ${barColor}`} aria-hidden="true" />
        <span className="text-[10px] uppercase tracking-[0.28em] text-ink-muted">
          {label}
        </span>
      </div>
      <p className="font-serif text-[22px] italic leading-[1.55] text-ink">
        {children}
      </p>
    </section>
  );
}

/* ───────────────────────────── Chrome ───────────────────────────── */

function TeachHeader({
  onExit,
  lessonTitle,
  cardIndex,
  totalCards,
  notesOpen,
  onToggleNotes,
  hasNotes,
}) {
  return (
    <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-whisper/60 bg-canvas/90 px-8 backdrop-blur-md">
      <button
        type="button"
        onClick={onExit}
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] text-ink-soft transition hover:bg-paper hover:text-ink"
      >
        <span aria-hidden="true">×</span>
        <span>Exit · ESC</span>
      </button>

      <div className="flex min-w-0 flex-1 items-center justify-center gap-3 px-6">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
        <span className="text-[10px] tracking-[0.3em] uppercase text-accent">
          Teaching
        </span>
        {lessonTitle && (
          <span className="truncate font-serif text-[14px] italic text-ink-soft">
            — {lessonTitle}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {hasNotes && typeof onToggleNotes === 'function' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleNotes();
            }}
            aria-pressed={notesOpen}
            title="Tap the card, or press S / N to toggle"
            className={`flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] transition ${
              notesOpen
                ? 'border-accent/50 bg-paper/60 text-ink'
                : 'border-whisper bg-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                notesOpen ? 'bg-accent' : 'bg-ink-faint'
              }`}
              aria-hidden="true"
            />
            Notes
          </button>
        )}
        {typeof cardIndex === 'number' && typeof totalCards === 'number' ? (
          <div className="text-[11px] tracking-wide text-ink-muted">
            {cardIndex + 1} / {totalCards}
          </div>
        ) : (
          <div className="w-[40px]" />
        )}
      </div>
    </header>
  );
}

function TeachFooter({
  cardIndex,
  totalCards,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}) {
  return (
    <footer className="flex h-16 flex-shrink-0 items-center justify-between border-t border-whisper/60 bg-canvas/80 px-8">
      <button
        type="button"
        onClick={onPrev}
        disabled={!hasPrev}
        className="flex h-9 items-center gap-2 rounded-md border border-whisper bg-white px-3.5 text-[12px] text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span aria-hidden="true">←</span>
        <span>Previous</span>
      </button>

      <div className="text-[11px] tracking-[0.18em] uppercase text-ink-muted">
        Step {cardIndex + 1} of {totalCards} · ← → to navigate · Tap / S for teacher notes
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!hasNext}
        className="flex h-9 items-center gap-2 rounded-md border border-whisper bg-white px-3.5 text-[12px] text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span>Next</span>
        <span aria-hidden="true">→</span>
      </button>
    </footer>
  );
}
