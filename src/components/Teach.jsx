import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import ImageUploader from './ImageUploader';
import { blockHasContent } from '../lib/blockTypes';

export default function Teach({
  lessons,
  modules,
  selectedLessonId,
  onSelectLesson,
  onUpdateCard,
  onDeleteCard,
  onDuplicateCard,
  onAddCard,
  onMoveCard,
  onReorderCard,
  onGenerateCards,
  generatingCardsForId,
  onStartTeaching,
  onReturnToWrite,
}) {
  const [cardIndex, setCardIndex] = useState(0);
  const [showGeneratedToast, setShowGeneratedToast] = useState(false);
  const wasGeneratingRef = useRef(false);

  const selectedLesson = useMemo(
    () => lessons.find((l) => l.id === selectedLessonId) || lessons[0] || null,
    [lessons, selectedLessonId],
  );
  const cards = selectedLesson?.cards || [];
  const isGeneratingSelected = generatingCardsForId === selectedLesson?.id;

  useEffect(() => {
    if (cardIndex >= cards.length) {
      setCardIndex(Math.max(0, cards.length - 1));
    }
  }, [cards.length, cardIndex]);

  useEffect(() => {
    setCardIndex(0);
  }, [selectedLesson?.id]);

  useEffect(() => {
    const wasGenerating = wasGeneratingRef.current;
    wasGeneratingRef.current = isGeneratingSelected;
    if (wasGenerating && !isGeneratingSelected && cards.length > 0) {
      setShowGeneratedToast(true);
      const t = setTimeout(() => setShowGeneratedToast(false), 4000);
      return () => clearTimeout(t);
    }
  }, [isGeneratingSelected, cards.length]);

  const currentCard = cards[cardIndex];

  return (
    <div className="flex flex-1 overflow-hidden bg-canvas">
      <FlowColumn
        modules={modules}
        lessons={lessons}
        selectedLessonId={selectedLesson?.id}
        onSelectLesson={(id) => {
          if (id !== selectedLesson?.id) onSelectLesson(id);
        }}
        cards={cards}
        cardIndex={cardIndex}
        onSelectCard={setCardIndex}
        onAddCard={(afterIndex) => {
          if (!selectedLesson) return;
          onAddCard(selectedLesson.id, afterIndex);
          const nextIdx =
            typeof afterIndex === 'number' ? afterIndex + 1 : cards.length;
          setCardIndex(Math.max(0, nextIdx));
        }}
        onDuplicateCard={(idx) => {
          if (!selectedLesson) return;
          onDuplicateCard(selectedLesson.id, idx);
          setCardIndex(idx + 1);
        }}
        onDeleteCard={(idx) => {
          if (!selectedLesson) return;
          onDeleteCard(selectedLesson.id, idx);
          if (idx <= cardIndex) setCardIndex((i) => Math.max(0, i - 1));
        }}
        onReorderCard={(fromIndex, toIndex) => {
          if (!selectedLesson || fromIndex === toIndex) return;
          onReorderCard(selectedLesson.id, fromIndex, toIndex);
          if (cardIndex === fromIndex) setCardIndex(toIndex);
          else if (fromIndex < cardIndex && toIndex >= cardIndex)
            setCardIndex((i) => i - 1);
          else if (fromIndex > cardIndex && toIndex <= cardIndex)
            setCardIndex((i) => i + 1);
        }}
        onReturnToWrite={onReturnToWrite}
      />

      <CardStage
        lesson={selectedLesson}
        card={currentCard}
        cardIndex={cardIndex}
        totalCards={cards.length}
        onUpdateCard={(patch) =>
          selectedLesson && onUpdateCard(selectedLesson.id, cardIndex, patch)
        }
        onPrev={() => setCardIndex((i) => Math.max(0, i - 1))}
        onNext={() => setCardIndex((i) => Math.min(cards.length - 1, i + 1))}
        onGenerateCards={() =>
          selectedLesson && onGenerateCards(selectedLesson.id)
        }
        onStartBlank={() => {
          if (!selectedLesson) return;
          onAddCard(selectedLesson.id, -1);
          setCardIndex(0);
        }}
        onStartTeaching={onStartTeaching}
        isGenerating={isGeneratingSelected}
        showGeneratedToast={showGeneratedToast}
      />

      {currentCard && <LivePreview card={currentCard} />}
    </div>
  );
}

/* ───────────────────────── Left column: flow nav ───────────────────────── */

function FlowColumn({
  modules,
  lessons,
  selectedLessonId,
  onSelectLesson,
  cards,
  cardIndex,
  onSelectCard,
  onAddCard,
  onDuplicateCard,
  onDeleteCard,
  onReorderCard,
  onReturnToWrite,
}) {
  const [drag, setDrag] = useState({ fromIndex: -1, overIndex: -1 });

  const handleDragStart = (index) => (e) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    setDrag({ fromIndex: index, overIndex: -1 });
  };
  const handleDragOver = (index) => (e) => {
    if (drag.fromIndex < 0) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (drag.overIndex !== index) setDrag((s) => ({ ...s, overIndex: index }));
  };
  const handleDrop = (index) => (e) => {
    if (drag.fromIndex < 0) return;
    e.preventDefault();
    if (drag.fromIndex !== index) onReorderCard(drag.fromIndex, index);
    setDrag({ fromIndex: -1, overIndex: -1 });
  };
  const handleDragEnd = () => setDrag({ fromIndex: -1, overIndex: -1 });

  return (
    <aside className="flex w-[280px] flex-col border-r border-whisper bg-paper/50">
      <div className="flex items-center justify-between border-b border-whisper/70 px-5 py-4">
        <div className="text-[10px] tracking-[0.24em] uppercase text-accent">
          Teach Mode
        </div>
        {onReturnToWrite && (
          <button
            type="button"
            onClick={onReturnToWrite}
            className="rounded-md px-2 py-1 text-[11px] tracking-wide text-ink-muted transition hover:bg-whisper/60 hover:text-ink"
          >
            ← Write
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <LessonPicker
          modules={modules}
          lessons={lessons}
          selectedLessonId={selectedLessonId}
          onSelectLesson={onSelectLesson}
        />

        <div className="mt-6 mb-3 flex items-baseline justify-between px-1">
          <div className="text-[10px] tracking-[0.22em] uppercase text-ink-muted">
            Flow
          </div>
          {cards.length > 0 && (
            <div className="text-[10px] tracking-wide text-ink-faint">
              {cards.length} {cards.length === 1 ? 'step' : 'steps'}
            </div>
          )}
        </div>

        {cards.length === 0 && (
          <p className="px-1 text-[13.5px] leading-[1.55] italic text-ink-soft">
            No teaching steps yet — add one to start building the flow.
          </p>
        )}

        <ul className="space-y-1.5">
          {cards.map((card, i) => (
            <FlowStep
              key={i}
              index={i}
              card={card}
              isActive={i === cardIndex}
              isDragging={drag.fromIndex === i}
              isDropTarget={
                drag.overIndex === i && drag.fromIndex !== i && drag.fromIndex >= 0
              }
              onDragStart={handleDragStart(i)}
              onDragOver={handleDragOver(i)}
              onDrop={handleDrop(i)}
              onDragEnd={handleDragEnd}
              onSelect={() => onSelectCard(i)}
              onDuplicate={() => onDuplicateCard(i)}
              onDelete={() => onDeleteCard(i)}
            />
          ))}
        </ul>

        {selectedLessonId && (
          <button
            type="button"
            onClick={() =>
              onAddCard(cards.length === 0 ? -1 : cards.length - 1)
            }
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-whisper px-3 py-2 text-[11px] uppercase tracking-[0.15em] text-ink-muted transition hover:border-accent/50 hover:bg-paper/60 hover:text-ink"
          >
            <span className="text-sm leading-none">+</span>
            {cards.length === 0 ? 'Add first step' : 'Add step'}
          </button>
        )}
      </div>
    </aside>
  );
}

function LessonPicker({ modules, lessons, selectedLessonId, onSelectLesson }) {
  return (
    <div>
      <div className="mb-2 px-1 text-[10px] tracking-[0.22em] uppercase text-ink-muted">
        Lesson
      </div>
      {modules.map((module) => {
        const moduleLessons = lessons.filter((l) => l.moduleId === module.id);
        if (moduleLessons.length === 0) return null;
        return (
          <section key={module.id} className="mb-3 last:mb-0">
            <div className="mb-1 px-2 text-[10px] tracking-[0.18em] uppercase text-ink-faint">
              {module.title || 'Untitled module'}
            </div>
            <ul className="space-y-0.5">
              {moduleLessons.map((lesson) => {
                const isActive = lesson.id === selectedLessonId;
                const count = lesson.cards?.length || 0;
                return (
                  <li key={lesson.id}>
                    <button
                      type="button"
                      onClick={() => onSelectLesson(lesson.id)}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition ${
                        isActive
                          ? 'bg-white text-ink shadow-[0_1px_2px_rgba(42,31,27,0.05)]'
                          : 'text-ink-soft hover:bg-whisper/50 hover:text-ink'
                      }`}
                    >
                      <span className="min-w-0 flex-1 truncate text-[13px] leading-[1.35]">
                        {lesson.title || 'Untitled lesson'}
                      </span>
                      {count > 0 && (
                        <span className="shrink-0 text-[10px] text-ink-faint">
                          {count}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function FlowStep({
  index,
  card,
  isActive,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onSelect,
  onDuplicate,
  onDelete,
}) {
  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`group relative rounded-lg border transition ${
        isDragging ? 'opacity-40' : ''
      } ${
        isDropTarget
          ? 'border-accent/70 ring-2 ring-accent/30'
          : isActive
            ? 'border-accent/60 bg-white shadow-[0_0_0_3px_rgba(184,147,106,0.08)]'
            : 'border-whisper bg-white/60 hover:border-[#D4C5B0] hover:bg-white'
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="block w-full px-3 py-2.5 text-left"
      >
        <div className="mb-1 flex items-center gap-2">
          <span
            className="text-[11px] leading-none text-ink-faint"
            aria-hidden="true"
          >
            ⋮⋮
          </span>
          <span className="font-serif italic text-[11px] text-ink-faint">
            Step {String(index + 1).padStart(2, '0')}
          </span>
        </div>
        <div className="line-clamp-2 font-serif text-[14px] leading-[1.3] tracking-tight text-ink">
          {card.title || 'Untitled step'}
        </div>
      </button>

      <div className="flex items-center justify-end gap-0.5 px-2 pb-2 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
        <StepAction
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          aria-label="Duplicate step"
        >
          ⧉
        </StepAction>
        <StepAction
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete step"
          danger
        >
          ×
        </StepAction>
      </div>
    </li>
  );
}

function StepAction({ children, onClick, danger, ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-6 w-6 items-center justify-center rounded text-[13px] leading-none transition ${
        danger
          ? 'text-ink-muted hover:bg-rose/10 hover:text-rose'
          : 'text-ink-muted hover:bg-whisper hover:text-ink'
      }`}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ────────────────────── Center: step editor ───────────────────── */

function CardStage({
  lesson,
  card,
  cardIndex,
  totalCards,
  onUpdateCard,
  onPrev,
  onNext,
  onGenerateCards,
  onStartBlank,
  onStartTeaching,
  isGenerating,
  showGeneratedToast,
}) {
  if (!lesson) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="font-serif text-[20px] italic text-ink-soft">
          Select a lesson to begin.
        </p>
      </div>
    );
  }

  if (!card) {
    return (
      <EmptyStage
        lesson={lesson}
        onGenerate={onGenerateCards}
        onStartBlank={onStartBlank}
        isGenerating={isGenerating}
      />
    );
  }

  return (
    <div className="relative flex flex-1 flex-col">
      <StageHeader
        lessonTitle={lesson.title}
        cardIndex={cardIndex}
        totalCards={totalCards}
        onStartTeaching={onStartTeaching}
      />

      <div className="flex flex-1 items-start justify-center overflow-y-auto px-10 py-8">
        <div className="w-full max-w-[720px]">
          <CardEditor card={card} onUpdateCard={onUpdateCard} />

          <div className="mt-8 flex items-center justify-between">
            <StageButton onClick={onPrev} disabled={cardIndex === 0}>
              ← Previous step
            </StageButton>
            <span className="text-[11px] tracking-[0.18em] uppercase text-ink-muted">
              Step {cardIndex + 1} of {totalCards}
            </span>
            <StageButton
              onClick={onNext}
              disabled={cardIndex >= totalCards - 1}
            >
              Next step →
            </StageButton>
          </div>
        </div>
      </div>

      {showGeneratedToast && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 animate-fade-up items-center gap-2.5 rounded-full bg-ink px-4 py-2 text-canvas shadow-[0_6px_16px_rgba(42,31,27,0.14)]">
          <span
            className="h-1.5 w-1.5 rounded-full bg-accent"
            aria-hidden="true"
          />
          <span className="text-[11.5px] tracking-wide">
            Teaching flow built — everything is editable
          </span>
        </div>
      )}
    </div>
  );
}

function StageHeader({ lessonTitle, cardIndex, totalCards, onStartTeaching }) {
  return (
    <header className="flex items-center justify-between border-b border-whisper/60 px-10 py-4">
      <div className="min-w-0">
        <div className="text-[10px] tracking-[0.25em] uppercase text-accent">
          {lessonTitle || 'Untitled lesson'}
        </div>
        <div className="mt-0.5 text-[11px] tracking-wide text-ink-muted">
          Step {cardIndex + 1} of {totalCards}
        </div>
      </div>
      <button
        type="button"
        onClick={onStartTeaching}
        className="h-8 rounded-md bg-ink px-3.5 text-[11px] uppercase tracking-[0.15em] text-canvas transition hover:bg-[#2A1F18]"
      >
        Start Teaching
      </button>
    </header>
  );
}

function StageButton({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-8 rounded-md border border-whisper bg-white px-4 text-[11px] uppercase tracking-[0.15em] text-ink-soft transition hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function CardEditor({ card, onUpdateCard }) {
  const keyPoints = Array.isArray(card.keyPoints) ? card.keyPoints : [];
  const atMax = keyPoints.length >= 5;

  const handleTitle = (value) => onUpdateCard({ title: value });
  const handlePoint = (i, value) => {
    const next = [...keyPoints];
    next[i] = value;
    onUpdateCard({ keyPoints: next });
  };
  const handleRemovePoint = (i) => {
    const next = [...keyPoints];
    next.splice(i, 1);
    onUpdateCard({ keyPoints: next });
  };
  const handleAddPoint = () => {
    if (atMax) return;
    onUpdateCard({ keyPoints: [...keyPoints, ''] });
  };

  return (
    <article className="rounded-[18px] border border-whisper bg-paper/30 px-9 py-8">
      <div className="mb-5">
        <ImageUploader
          image={card.image}
          onChange={(image) => onUpdateCard({ image })}
          onRemove={() => onUpdateCard({ image: null })}
          showSizePicker={false}
          placeholder="Add reference image for this step"
        />
      </div>

      <AutoInput
        value={card.title || ''}
        onChange={handleTitle}
        placeholder="Step name"
        className="mb-6 -mx-2 rounded-md bg-transparent px-2 py-1 font-serif text-[32px] leading-[1.15] tracking-tight text-ink transition-colors duration-150 placeholder:italic placeholder:text-ink-faint hover:bg-white/50 focus:bg-white/70 focus:outline-none"
      />

      <section className="mb-6">
        <SectionHeader label="Key points" hint="2–3 shown while teaching" />
        <ul className="space-y-2.5">
          {keyPoints.map((point, i) => (
            <li key={i} className="group/pt flex items-start gap-3.5">
              <span
                className={`mt-[14px] h-[3px] w-[18px] shrink-0 rounded-full ${
                  i < 3 ? 'bg-accent/60' : 'bg-ink-faint/30'
                }`}
                aria-hidden="true"
              />
              <AutoTextarea
                value={point}
                onChange={(value) => handlePoint(i, value)}
                placeholder="A short cue the teacher can glance at…"
                className="min-w-0 flex-1 -mx-2 resize-none rounded-md bg-transparent px-2 py-1 text-[17px] leading-[1.55] text-ink transition-colors duration-150 placeholder:italic placeholder:text-ink-faint hover:bg-white/50 focus:bg-white/70 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleRemovePoint(i)}
                aria-label="Remove key point"
                className="mt-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-ink-muted opacity-0 transition hover:bg-whisper hover:text-ink focus:opacity-100 group-hover/pt:opacity-100"
              >
                <span className="text-sm leading-none">×</span>
              </button>
            </li>
          ))}
        </ul>
        {!atMax && (
          <button
            type="button"
            onClick={handleAddPoint}
            className="mt-2 rounded-md px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-ink-muted transition hover:bg-white/50 hover:text-ink"
          >
            + Add cue
          </button>
        )}
        {keyPoints.length > 3 && (
          <p className="mt-2 text-[12.5px] italic text-ink-soft">
            First 3 show in Present Mode. Extras stay here for reference.
          </p>
        )}
      </section>

      <SupportSection
        label="Say it like this"
        hint="Natural phrasing"
        value={card.sayLikeThis || ''}
        onChange={(v) => onUpdateCard({ sayLikeThis: v })}
        placeholder="A line you could say aloud in your own voice…"
        onClear={
          card.sayLikeThis ? () => onUpdateCard({ sayLikeThis: '' }) : undefined
        }
        tone="warm"
      />

      <SupportSection
        label="Watch for"
        hint="Common mistakes"
        value={card.watchFor || ''}
        onChange={(v) => onUpdateCard({ watchFor: v })}
        placeholder="A mistake, client signal, or cue to notice here…"
        onClear={card.watchFor ? () => onUpdateCard({ watchFor: '' }) : undefined}
        tone="alert"
      />
    </article>
  );
}

function SectionHeader({ label, hint }) {
  return (
    <div className="mb-2 flex items-baseline gap-2">
      <span className="text-[10px] uppercase tracking-[0.22em] text-ink-muted">
        {label}
      </span>
      {hint && (
        <span className="text-[10px] italic text-ink-faint">· {hint}</span>
      )}
    </div>
  );
}

function SupportSection({ label, hint, value, onChange, placeholder, onClear, tone }) {
  const barColor = tone === 'alert' ? 'bg-rose/70' : 'bg-accent/70';
  return (
    <section className="mb-5 last:mb-0 border-t border-whisper/60 pt-5">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className={`h-[3px] w-[18px] rounded-full ${barColor}`}
            aria-hidden="true"
          />
          <span className="text-[10px] uppercase tracking-[0.22em] text-ink-muted">
            {label}
          </span>
          {hint && (
            <span className="text-[10px] italic text-ink-faint">· {hint}</span>
          )}
        </div>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-[10px] tracking-wide text-ink-faint transition hover:text-ink"
          >
            Clear
          </button>
        )}
      </div>
      <AutoTextarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full -mx-2 resize-none rounded-md bg-transparent px-2 py-1 font-serif text-[17px] italic leading-[1.55] text-ink-soft transition-colors duration-150 placeholder:not-italic placeholder:text-ink-faint hover:bg-white/50 focus:bg-white/70 focus:text-ink focus:outline-none"
      />
    </section>
  );
}

/* ────────────────────────── Right: Live Preview ────────────────────────── */

function LivePreview({ card }) {
  const points = (card.keyPoints || [])
    .filter((p) => p && p.trim())
    .slice(0, 3);
  const hasNotes = Boolean(
    (card.sayLikeThis && card.sayLikeThis.trim()) ||
      (card.watchFor && card.watchFor.trim()),
  );

  return (
    <aside className="hidden w-[340px] flex-col overflow-y-auto border-l border-whisper bg-canvas/60 px-6 py-6 lg:flex">
      <div className="mb-3 flex items-center gap-2 text-[10px] tracking-[0.22em] uppercase text-ink-muted">
        <span className="h-1 w-1 rounded-full bg-accent" aria-hidden="true" />
        Live preview
      </div>

      <div className="rounded-[14px] border border-whisper bg-paper/30 px-6 py-6 shadow-[0_1px_3px_rgba(42,31,27,0.04)]">
        {card.image?.src && (
          <figure className="mb-4 overflow-hidden rounded-lg border border-whisper/70 bg-white">
            <img
              src={card.image.src}
              alt=""
              className="h-auto w-full object-cover"
              draggable={false}
            />
          </figure>
        )}

        <h3 className="mb-4 font-serif text-[22px] leading-[1.2] tracking-tight text-ink">
          {card.title || 'Untitled step'}
        </h3>

        {points.length > 0 ? (
          <ul className="space-y-2.5">
            {points.map((p, i) => (
              <li
                key={i}
                className="flex items-start gap-3 font-serif text-[15px] leading-[1.5] text-ink-soft"
              >
                <span
                  className="mt-[10px] h-[2.5px] w-[16px] shrink-0 rounded-full bg-accent/60"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">{p}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-serif text-[15px] italic text-ink-soft">
            Add a few key points to see them here.
          </p>
        )}

        {hasNotes && (
          <div className="mt-5 flex items-center gap-2 border-t border-whisper/60 pt-3 text-[10px] tracking-[0.2em] uppercase text-ink-faint">
            <span className="h-1 w-1 rounded-full bg-ink-faint" aria-hidden="true" />
            Tap in Present Mode for teacher notes
          </div>
        )}
      </div>

      <p className="mt-4 text-[12.5px] italic leading-[1.55] text-ink-soft">
        This is how this step appears while you teach.
      </p>
    </aside>
  );
}

/* ────────────────────────── Empty state ────────────────────────── */

function EmptyStage({ lesson, onGenerate, onStartBlank, isGenerating }) {
  const hasLessonContent = Boolean(
    (lesson.summary && lesson.summary.trim()) ||
      (lesson.blocks || []).some((b) => blockHasContent(b)),
  );

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <header className="flex items-center justify-between border-b border-whisper/60 px-10 py-4">
        <div>
          <div className="text-[10px] tracking-[0.25em] uppercase text-accent">
            {lesson.title || 'Untitled lesson'}
          </div>
          <div className="mt-0.5 text-[11px] tracking-wide text-ink-muted">
            No steps yet
          </div>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-10 py-12">
        <div className="w-full max-w-[520px] rounded-[18px] border border-whisper bg-white px-8 py-8 text-center">
          <h2 className="mb-2 font-serif text-[28px] leading-[1.2] tracking-tight text-ink">
            Build a teaching flow for this lesson.
          </h2>
          <p className="mb-6 text-[14px] leading-[1.65] text-ink-soft">
            A flow is a sequence of teaching steps — short cues, suggested
            phrasing, and things to watch for while you teach. Everything
            stays editable.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onGenerate}
              disabled={isGenerating || !hasLessonContent}
              title={
                hasLessonContent
                  ? 'Generate a teaching flow from this lesson'
                  : 'Write the lesson first'
              }
              className="h-10 rounded-md bg-ink px-5 text-[11.5px] uppercase tracking-[0.16em] text-canvas transition hover:bg-[#2A1F18] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-canvas/30 border-t-canvas" />
                  Building…
                </span>
              ) : (
                'Generate from lesson'
              )}
            </button>
            <button
              type="button"
              onClick={onStartBlank}
              disabled={isGenerating}
              className="h-10 rounded-md border border-whisper bg-white px-5 text-[11.5px] uppercase tracking-[0.16em] text-ink-soft transition hover:border-[#D4C5B0] hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              Start with a blank step
            </button>
          </div>
          {!hasLessonContent && (
            <p className="mt-4 text-[13px] italic text-ink-soft">
              Write a bit of the lesson first to generate from it — or start
              with a blank step.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────── Shared inputs ────────────────────────── */

function AutoInput({ value, onChange, placeholder, className }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
}

function AutoTextarea({ value, onChange, placeholder, className }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      className={className}
    />
  );
}
