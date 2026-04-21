import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BlockShell, BlockBody, BlockPicker } from './Blocks';
import { blockHasContent } from '../lib/blockTypes';

// Flat block-based lesson editor. Replaces the old section → bullet → nested
// content model with a single ordered list of blocks per lesson. All block
// types (heading, text, tip, callout, image, video, steps, checklist,
// divider) render vertically with drag-to-reorder and "+ Add block" zones.

export default function Canvas({
  lessons,
  modules,
  selectedLessonId,
  onSelectLesson,
  onAddLesson,
  onRemoveLesson,
  onUpdateLesson,
  onUpdateBlock,
  onInsertBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onReorderBlock,
  onConvertToSplit,
  onAddModule,
  onUpdateModule,
  onRemoveModule,
  showWelcomeBanner,
  canvasMode = 'editor',
  onChangeCanvasMode,
  onGenerateCards,
  generatingCardsForId,
  onOpenTeachMode,
}) {
  const moduleList = Array.isArray(modules) && modules.length > 0 ? modules : [];

  useEffect(() => {
    if (canvasMode !== 'editor') return;
    if (!selectedLessonId) return;
    const el = document.querySelector(`[data-lesson-id="${selectedLessonId}"]`);
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenLessonInEditor = (lessonId) => {
    onSelectLesson(lessonId);
    if (onChangeCanvasMode) onChangeCanvasMode('editor');
    setTimeout(() => {
      const el = document.querySelector(`[data-lesson-id="${lessonId}"]`);
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 40);
  };

  return (
    // data-surface="themed" adopts the active course theme inside the
    // editor canvas. Topbar / Sidebar / AIPanel are siblings outside
    // this element — they remain on the neutral AYUAI app palette.
    <main
      data-surface="themed"
      className="flex-1 overflow-y-auto px-14 py-10"
    >
      {showWelcomeBanner && (
        <div className="mb-10 animate-fade-up">
          <h2 className="font-serif text-[28px] italic leading-[1.25] tracking-tight text-ink">
            Your first lesson, shaped in your voice.
          </h2>
          <p className="mt-2 max-w-[580px] text-[14px] leading-[1.7] text-ink-soft">
            This is your starting point — refine it, shape it, make it yours.
          </p>
          <div className="mt-5 h-px w-16 bg-accent/40" aria-hidden="true" />
        </div>
      )}

      {onChangeCanvasMode && (
        <ModeToggle mode={canvasMode} onChange={onChangeCanvasMode} />
      )}

      {canvasMode === 'structure' ? (
        <StructureView
          modules={moduleList}
          lessons={lessons}
          onOpenLesson={handleOpenLessonInEditor}
          onAddLesson={onAddLesson}
          onAddModule={onAddModule}
        />
      ) : (
        <>
          {moduleList.map((module, idx) => {
            const moduleLessons = lessons.filter((l) => l.moduleId === module.id);
            return (
              <ModuleSection
                key={module.id}
                module={module}
                moduleIndex={idx}
                moduleCount={moduleList.length}
                lessons={moduleLessons}
                selectedLessonId={selectedLessonId}
                onSelectLesson={onSelectLesson}
                onAddLesson={onAddLesson}
                onRemoveLesson={onRemoveLesson}
                onUpdateLesson={onUpdateLesson}
                onUpdateBlock={onUpdateBlock}
                onInsertBlock={onInsertBlock}
                onDeleteBlock={onDeleteBlock}
                onDuplicateBlock={onDuplicateBlock}
                onReorderBlock={onReorderBlock}
                onConvertToSplit={onConvertToSplit}
                onUpdateModule={onUpdateModule}
                onRemoveModule={moduleList.length > 1 ? onRemoveModule : undefined}
                onGenerateCards={onGenerateCards}
                generatingCardsForId={generatingCardsForId}
                onOpenTeachMode={onOpenTeachMode}
              />
            );
          })}

          {onAddModule && (
            <button
              type="button"
              onClick={onAddModule}
              className="flex w-full items-center justify-center rounded-[10px] border border-dashed border-whisper bg-transparent p-4 text-[14px] tracking-wide text-ink-muted transition hover:border-accent/50 hover:bg-paper/40 hover:text-ink"
            >
              <span className="mr-2 text-base leading-none">+</span> Add module
            </button>
          )}
        </>
      )}
    </main>
  );
}

function ModeToggle({ mode, onChange }) {
  const items = [
    { key: 'editor', label: 'Editor' },
    { key: 'structure', label: 'Structure' },
  ];
  return (
    <div className="mb-8 inline-flex items-center rounded-full border border-whisper bg-paper/40 p-0.5">
      {items.map((item) => {
        const active = mode === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={`rounded-full px-4 py-1.5 text-[11px] tracking-[0.12em] transition ${
              active
                ? 'bg-white text-ink shadow-[0_1px_2px_rgba(42,31,27,0.06)]'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {item.label.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

function StructureView({ modules, lessons, onOpenLesson, onAddLesson, onAddModule }) {
  return (
    <div className="max-w-[780px]">
      <div className="mb-8">
        <div className="mb-1.5 text-[10px] tracking-[0.25em] text-accent">
          COURSE STRUCTURE
        </div>
        <h2 className="font-serif text-[26px] leading-[1.2] tracking-tight text-ink">
          {modules.length} {modules.length === 1 ? 'module' : 'modules'} ·{' '}
          {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
        </h2>
      </div>

      <ul className="space-y-8">
        {modules.map((module, idx) => {
          const moduleLessons = lessons.filter((l) => l.moduleId === module.id);
          return (
            <li key={module.id} className="border-t border-whisper pt-6">
              <div className="mb-3">
                <div className="mb-1 text-[10px] tracking-[0.25em] text-ink-muted">
                  MODULE {idx + 1}
                </div>
                <h3 className="font-serif text-[22px] leading-[1.25] tracking-tight text-ink">
                  {module.title || 'Untitled module'}
                </h3>
              </div>
              <ul className="space-y-1">
                {moduleLessons.map((l, li) => (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => onOpenLesson(l.id)}
                      className="flex w-full items-baseline gap-3 rounded-md px-2 py-1.5 text-left text-[14px] text-ink-soft hover:bg-paper/50 hover:text-ink"
                    >
                      <span className="font-serif italic text-[13px] text-ink-muted">
                        {String(li + 1).padStart(2, '0')}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {l.title || 'Untitled lesson'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {onAddLesson && (
                <button
                  type="button"
                  onClick={() => onAddLesson(module.id)}
                  className="mt-2 rounded-md px-2 py-1 text-[12px] text-ink-muted hover:text-ink"
                >
                  + Add lesson
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {onAddModule && (
        <button
          type="button"
          onClick={onAddModule}
          className="mt-8 flex w-full items-center justify-center rounded-[10px] border border-dashed border-whisper bg-transparent p-4 text-[13px] tracking-wide text-ink-muted transition hover:border-accent/50 hover:bg-paper/40 hover:text-ink"
        >
          <span className="mr-2 text-base leading-none">+</span> Add module
        </button>
      )}
    </div>
  );
}

function ModuleSection({
  module,
  moduleIndex,
  moduleCount,
  lessons,
  selectedLessonId,
  onSelectLesson,
  onAddLesson,
  onRemoveLesson,
  onUpdateLesson,
  onUpdateBlock,
  onInsertBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onReorderBlock,
  onConvertToSplit,
  onUpdateModule,
  onRemoveModule,
  onGenerateCards,
  generatingCardsForId,
  onOpenTeachMode,
}) {
  return (
    <section className="mb-14">
      <ModuleHeader
        module={module}
        moduleIndex={moduleIndex}
        moduleCount={moduleCount}
        onUpdateModule={onUpdateModule}
        onRemoveModule={onRemoveModule}
      />

      {lessons.map((lesson, i) => (
        <LessonCard
          key={lesson.id}
          lesson={lesson}
          displayNumber={i + 1}
          isSelected={lesson.id === selectedLessonId}
          onSelect={() => onSelectLesson(lesson.id)}
          onRemoveLesson={onRemoveLesson}
          onUpdateLesson={onUpdateLesson}
          onUpdateBlock={onUpdateBlock}
          onInsertBlock={onInsertBlock}
          onDeleteBlock={onDeleteBlock}
          onDuplicateBlock={onDuplicateBlock}
          onReorderBlock={onReorderBlock}
          onConvertToSplit={onConvertToSplit}
          onGenerateCards={
            onGenerateCards ? () => onGenerateCards(lesson.id) : undefined
          }
          isGeneratingCards={generatingCardsForId === lesson.id}
          anyGeneratingCards={Boolean(generatingCardsForId)}
          onOpenTeachMode={
            onOpenTeachMode ? () => onOpenTeachMode(lesson.id) : undefined
          }
        />
      ))}

      {onAddLesson && (
        <button
          type="button"
          onClick={() => onAddLesson(module.id)}
          className="flex w-full items-center justify-center rounded-[10px] border border-dashed border-whisper bg-transparent px-4 py-3 text-[13px] tracking-wide text-ink-muted transition hover:border-accent/50 hover:bg-paper/40 hover:text-ink"
        >
          <span className="mr-2 text-base leading-none">+</span> Add lesson
        </button>
      )}
    </section>
  );
}

function ModuleHeader({ module, moduleIndex, moduleCount, onUpdateModule, onRemoveModule }) {
  return (
    <header className="group mb-6">
      <div className="mb-2 flex items-center gap-3">
        <div className="text-[10px] tracking-[0.25em] text-accent">
          MODULE {moduleIndex + 1} OF {moduleCount}
        </div>
        {onRemoveModule && (
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  'Delete this module and all its lessons? This cannot be undone.',
                )
              ) {
                onRemoveModule(module.id);
              }
            }}
            aria-label="Remove module"
            className="flex h-5 w-5 items-center justify-center rounded-full text-ink-muted opacity-0 transition hover:bg-whisper hover:text-ink focus:opacity-100 group-hover:opacity-100"
          >
            <span className="text-sm leading-none">×</span>
          </button>
        )}
      </div>
      <input
        type="text"
        value={module.title}
        onChange={(e) => onUpdateModule(module.id, { title: e.target.value })}
        placeholder="Untitled module"
        className="mb-1 w-full -mx-2 rounded-md bg-transparent px-2 py-0.5 font-serif text-[32px] leading-[1.1] tracking-tight text-ink transition-colors duration-150 placeholder:italic placeholder:text-ink-faint hover:bg-paper/50 focus:bg-paper/70 focus:outline-none"
      />
      <input
        type="text"
        value={module.subtitle || ''}
        onChange={(e) => onUpdateModule(module.id, { subtitle: e.target.value })}
        placeholder="Add a short description"
        className="w-full -mx-2 rounded-md bg-transparent px-2 py-0.5 text-[15px] leading-[1.5] text-ink-soft transition-colors duration-150 placeholder:italic placeholder:text-ink-faint hover:bg-paper/40 focus:bg-paper/60 focus:outline-none"
      />
    </header>
  );
}

function LessonCard({
  lesson,
  displayNumber,
  isSelected,
  onSelect,
  onRemoveLesson,
  onUpdateLesson,
  onUpdateBlock,
  onInsertBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onReorderBlock,
  onConvertToSplit,
  onGenerateCards,
  isGeneratingCards,
  anyGeneratingCards,
  onOpenTeachMode,
}) {
  const blocks = Array.isArray(lesson.blocks) ? lesson.blocks : [];
  const hasCards = Array.isArray(lesson.cards) && lesson.cards.length > 0;
  const number = displayNumber ?? lesson.number;

  const [drag, setDrag] = useState({ fromIndex: -1, overIndex: -1 });
  const [pickerAt, setPickerAt] = useState(null); // index to insert AT (0..blocks.length)

  const handleDragStart = (index) => (e) => {
    e.dataTransfer.effectAllowed = 'move';
    setDrag({ fromIndex: index, overIndex: -1 });
  };
  const handleBlockDragOver = (index) => (e) => {
    if (drag.fromIndex < 0) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (drag.overIndex !== index) setDrag((s) => ({ ...s, overIndex: index }));
  };
  const handleBlockDrop = (index) => (e) => {
    if (drag.fromIndex < 0) return;
    e.preventDefault();
    if (drag.fromIndex !== index && onReorderBlock) {
      onReorderBlock(lesson.id, drag.fromIndex, index);
    }
    setDrag({ fromIndex: -1, overIndex: -1 });
  };
  const handleDragEnd = () => setDrag({ fromIndex: -1, overIndex: -1 });

  return (
    <div
      data-lesson-id={lesson.id}
      onMouseDown={onSelect}
      onFocusCapture={onSelect}
      className={`group relative mb-4 rounded-[12px] border bg-white p-6 transition ${
        isSelected
          ? 'border-accent/60 shadow-[0_0_0_3px_rgba(184,147,106,0.08)]'
          : 'border-whisper hover:border-[#D4C5B0]'
      }`}
    >
      <button
        type="button"
        onClick={() => onRemoveLesson(lesson.id)}
        aria-label="Remove lesson"
        className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-ink-muted opacity-0 transition hover:bg-whisper hover:text-ink focus:opacity-100 group-hover:opacity-100"
      >
        <span className="text-sm leading-none">×</span>
      </button>

      <div className="flex items-start">
        <div className="mt-1 mr-4 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-paper">
          <span className="font-serif italic text-[15px] text-ink-muted">{number}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2.5 flex items-center">
            <input
              type="text"
              value={lesson.title}
              onChange={(e) => onUpdateLesson(lesson.id, 'title', e.target.value)}
              placeholder="Untitled lesson"
              className="mr-2.5 -mx-2 min-w-0 flex-1 rounded-md bg-transparent px-2 py-0.5 font-serif text-[23px] font-medium leading-[1.25] text-ink transition-colors duration-150 placeholder:italic placeholder:text-ink-faint hover:bg-paper/50 focus:bg-paper/70 focus:outline-none"
            />
            <DurationField
              value={lesson.duration || ''}
              onChange={(value) => onUpdateLesson(lesson.id, 'duration', value)}
            />
          </div>
          <AutoTextarea
            value={lesson.summary}
            onChange={(value) => onUpdateLesson(lesson.id, 'summary', value)}
            placeholder="Add a short lesson summary..."
            className="mb-4 -mx-2 w-[calc(100%+1rem)] resize-none rounded-md bg-transparent px-2 py-1 text-[15px] leading-[1.7] text-ink-soft transition-colors duration-150 placeholder:italic placeholder:text-ink-faint hover:bg-paper/50 focus:bg-paper/70 focus:outline-none"
          />

          {/* Block list */}
          <div className="space-y-1.5">
            {/* Top inserter */}
            <AddBlockRow
              open={pickerAt === 0}
              onToggle={() => setPickerAt(pickerAt === 0 ? null : 0)}
              onPick={(type) => {
                if (onInsertBlock) onInsertBlock(lesson.id, 0, type);
                setPickerAt(null);
              }}
            />

            {blocks.map((block, index) => (
              <div key={block.id}>
                <BlockShell
                  onDelete={
                    onDeleteBlock ? () => onDeleteBlock(lesson.id, block.id) : undefined
                  }
                  onDuplicate={
                    onDuplicateBlock ? () => onDuplicateBlock(lesson.id, block.id) : undefined
                  }
                  onDragStart={handleDragStart(index)}
                  onDragOver={handleBlockDragOver(index)}
                  onDrop={handleBlockDrop(index)}
                  onDragEnd={handleDragEnd}
                  isDragged={drag.fromIndex === index}
                  isDragTarget={
                    drag.overIndex === index &&
                    drag.fromIndex !== index &&
                    drag.fromIndex >= 0
                  }
                >
                  <BlockBody
                    block={block}
                    onChange={(patch) =>
                      onUpdateBlock && onUpdateBlock(lesson.id, block.id, patch)
                    }
                    onDuplicate={
                      onDuplicateBlock ? () => onDuplicateBlock(lesson.id, block.id) : undefined
                    }
                    onDelete={
                      onDeleteBlock ? () => onDeleteBlock(lesson.id, block.id) : undefined
                    }
                  />
                </BlockShell>
                {/* Smart suggestion: adjacent image+text (or text+image) →
                    offer to merge them into a split block. */}
                <ConvertToSplitSuggestion
                  current={block}
                  next={blocks[index + 1]}
                  onConvert={
                    onConvertToSplit
                      ? () =>
                          onConvertToSplit(
                            lesson.id,
                            block.id,
                            blocks[index + 1].id,
                          )
                      : undefined
                  }
                />
                <AddBlockRow
                  open={pickerAt === index + 1}
                  onToggle={() =>
                    setPickerAt(pickerAt === index + 1 ? null : index + 1)
                  }
                  onPick={(type) => {
                    if (onInsertBlock) onInsertBlock(lesson.id, index + 1, type);
                    setPickerAt(null);
                  }}
                />
              </div>
            ))}

            {blocks.length === 0 && (
              <div className="rounded-md border border-dashed border-whisper bg-paper/20 px-4 py-3 text-center text-[12px] italic text-ink-muted">
                No blocks yet — click{' '}
                <span className="font-mono not-italic text-ink">+</span> above to add one.
              </div>
            )}
          </div>

          {/* Teach-mode actions */}
          <div className="mt-5 flex flex-wrap gap-2">
            {onGenerateCards && (
              <button
                type="button"
                onClick={onGenerateCards}
                disabled={anyGeneratingCards || !blockHasAnyContent(blocks)}
                className="inline-flex h-8 items-center gap-2 rounded-full border border-whisper bg-canvas px-3.5 text-[11px] tracking-wide text-ink-soft transition hover:border-accent/50 hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isGeneratingCards ? (
                  <>
                    <span className="h-2.5 w-2.5 animate-spin rounded-full border-[1.5px] border-ink-muted/30 border-t-ink-muted" />
                    <span>Building flow…</span>
                  </>
                ) : hasCards ? (
                  <span>Rebuild teaching flow</span>
                ) : (
                  <span>Build teaching flow</span>
                )}
              </button>
            )}
            {onOpenTeachMode && hasCards && (
              <button
                type="button"
                onClick={onOpenTeachMode}
                className="inline-flex h-8 items-center gap-2 rounded-full bg-ink px-3.5 text-[11px] tracking-wide text-canvas transition hover:bg-[#2A1F18]"
              >
                <span>Open in Teach Mode</span>
                <span aria-hidden="true">→</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function blockHasAnyContent(blocks) {
  return Array.isArray(blocks) && blocks.some(blockHasContent);
}

function AddBlockRow({ open, onToggle, onPick }) {
  return (
    <div className="relative flex items-center justify-center py-0.5">
      <button
        type="button"
        onClick={onToggle}
        className="flex h-6 w-6 items-center justify-center rounded-full border border-whisper bg-white text-[14px] leading-none text-ink-muted opacity-0 transition hover:border-accent/60 hover:bg-paper hover:text-ink group-hover:opacity-100 focus:opacity-100"
        style={{ opacity: open ? 1 : undefined }}
        aria-label="Add block"
      >
        +
      </button>
      {open && <BlockPicker onPick={onPick} onClose={() => onToggle()} />}
    </div>
  );
}

// Inline lesson-title duration chip and auto-growing textarea, copied
// verbatim from the previous Canvas implementation.

function DurationField({ value, onChange }) {
  const inputRef = useRef(null);
  const measureRef = useRef(null);
  const [width, setWidth] = useState(48);

  useLayoutEffect(() => {
    if (!measureRef.current) return;
    const w = Math.max(48, measureRef.current.offsetWidth + 10);
    setWidth(w);
  }, [value]);

  return (
    <div className="flex flex-shrink-0 items-center">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="— min"
        style={{ width }}
        className="rounded-md bg-transparent py-0.5 text-right text-[11px] tracking-[0.12em] text-ink-muted transition-colors duration-150 placeholder:italic placeholder:text-ink-faint hover:bg-paper/50 focus:bg-paper/70 focus:outline-none focus:text-ink"
      />
      <span
        ref={measureRef}
        aria-hidden="true"
        className="invisible absolute -z-10 whitespace-pre text-[11px] tracking-[0.12em]"
      >
        {value || '— min'}
      </span>
    </div>
  );
}

// Inline suggestion shown between two adjacent blocks when the pair looks
// like it would read better side-by-side (image + prose block). Clicking
// merges them into a single Split block. The suggestion is subtle — only
// renders when the heuristic matches and `onConvert` is provided.
function ConvertToSplitSuggestion({ current, next, onConvert }) {
  if (!current || !next || !onConvert) return null;

  const a = current.type;
  const b = next.type;
  const textish = (t) => t === 'text' || t === 'heading' || t === 'tip' || t === 'callout';

  // Match image + text (either order). Skip when either block is empty so
  // we don't nag on placeholders.
  const matches =
    (a === 'image' && textish(b) && current.content?.src) ||
    (textish(a) && b === 'image' && next.content?.src);
  if (!matches) return null;

  return (
    <div className="flex items-center justify-center py-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
      <button
        type="button"
        onClick={onConvert}
        className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-paper/60 px-3 py-1 text-[11px] tracking-wide text-ink-soft transition hover:border-accent hover:bg-paper hover:text-ink"
        title="Merge these two blocks into a 2-column layout"
      >
        <span aria-hidden="true">↔</span>
        <span>Convert to side-by-side</span>
      </button>
    </div>
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
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      className={className}
    />
  );
}
