import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import ImageUploader from './ImageUploader';
import RichText from './RichText';
import { blockHasContent } from '../lib/blocks';
import { blockWidthClass } from '../lib/images';

export default function Canvas({
  lessons,
  modules,
  selectedLessonId,
  onSelectLesson,
  onAddLesson,
  onRemoveLesson,
  onUpdateLesson,
  onUpdateSubBlock,
  onRenameBlock,
  onDuplicateBlock,
  onConvertToBulletList,
  onDeleteBlock,
  expandedBulletIds,
  onToggleBullet,
  onAddBlock,
  onUpdateBlock,
  onReorderBlock,
  onRefineSection,
  refiningSections,
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

  // If we land on Modules with a specific lesson selected (e.g. from onboarding),
  // bring that lesson into view.
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
    <main className="flex-1 overflow-y-auto px-14 py-10">
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
          selectedLessonId={selectedLessonId}
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
                onUpdateSubBlock={onUpdateSubBlock}
                onRenameBlock={onRenameBlock}
                onDuplicateBlock={onDuplicateBlock}
                onConvertToBulletList={onConvertToBulletList}
                onDeleteBlock={onDeleteBlock}
                expandedBulletIds={expandedBulletIds}
                onToggleBullet={onToggleBullet}
                onAddBlock={onAddBlock}
                onUpdateBlock={onUpdateBlock}
                onReorderBlock={onReorderBlock}
                onRefineSection={onRefineSection}
                refiningSections={refiningSections}
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

function StructureView({
  modules,
  lessons,
  selectedLessonId,
  onOpenLesson,
  onAddLesson,
  onAddModule,
}) {
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
              <div className="mb-3 flex items-baseline justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-1 text-[10px] tracking-[0.25em] text-ink-muted">
                    MODULE {idx + 1}
                  </div>
                  <h3 className="truncate font-serif text-[22px] leading-[1.25] tracking-tight text-ink">
                    {module.title || 'Untitled module'}
                  </h3>
                </div>
                <div className="shrink-0 text-[11px] tracking-wide text-ink-muted">
                  {moduleLessons.length}{' '}
                  {moduleLessons.length === 1 ? 'lesson' : 'lessons'}
                </div>
              </div>

              {moduleLessons.length > 0 ? (
                <ol className="mt-3 space-y-0.5">
                  {moduleLessons.map((lesson, i) => {
                    const isSelected = lesson.id === selectedLessonId;
                    return (
                      <li key={lesson.id}>
                        <button
                          type="button"
                          onClick={() => onOpenLesson(lesson.id)}
                          className={`group flex w-full items-center gap-4 rounded-md px-3 py-2.5 text-left transition ${
                            isSelected
                              ? 'bg-paper/60'
                              : 'hover:bg-paper/40'
                          }`}
                        >
                          <span className="w-6 shrink-0 font-serif italic text-[13px] text-ink-faint">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span
                            className={`min-w-0 flex-1 truncate text-[15px] leading-[1.4] transition ${
                              isSelected ? 'text-ink' : 'text-ink-soft group-hover:text-ink'
                            }`}
                          >
                            {lesson.title || 'Untitled lesson'}
                          </span>
                          <span
                            className="shrink-0 text-[11px] text-ink-faint opacity-0 transition group-hover:opacity-100"
                            aria-hidden="true"
                          >
                            Open →
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="mt-2 px-3 font-serif text-[15px] italic text-ink-soft">
                  No lessons yet.
                </p>
              )}

              {onAddLesson && (
                <button
                  type="button"
                  onClick={() => onAddLesson(module.id)}
                  className="mt-2 flex items-center gap-2 rounded-md px-3 py-1.5 text-[12px] tracking-wide text-ink-muted transition hover:text-ink"
                >
                  <span className="text-sm leading-none">+</span> Add lesson
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
  onUpdateSubBlock,
  onRenameBlock,
  onDuplicateBlock,
  onConvertToBulletList,
  onDeleteBlock,
  expandedBulletIds,
  onToggleBullet,
  onAddBlock,
  onUpdateBlock,
  onReorderBlock,
  onRefineSection,
  refiningSections,
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
          onUpdateSubBlock={onUpdateSubBlock}
          onRenameBlock={onRenameBlock}
          onDuplicateBlock={onDuplicateBlock}
          onConvertToBulletList={onConvertToBulletList}
          onDeleteBlock={onDeleteBlock}
          expandedBulletIds={expandedBulletIds}
          onToggleBullet={onToggleBullet}
          onAddBlock={onAddBlock}
          onUpdateBlock={onUpdateBlock}
          onReorderBlock={onReorderBlock}
          onRefineSection={onRefineSection}
          refiningSections={refiningSections}
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
  onUpdateSubBlock,
  onRenameBlock,
  onDuplicateBlock,
  onConvertToBulletList,
  onDeleteBlock,
  expandedBulletIds,
  onToggleBullet,
  onAddBlock,
  onUpdateBlock,
  onReorderBlock,
  onRefineSection,
  refiningSections,
  onGenerateCards,
  isGeneratingCards,
  anyGeneratingCards,
  onOpenTeachMode,
}) {
  const hasCards = Array.isArray(lesson.cards) && lesson.cards.length > 0;
  const number = displayNumber ?? lesson.number;
  const titleReady = Boolean(lesson.title && lesson.title.trim());
  const bodyReady =
    Boolean(lesson.summary && lesson.summary.trim()) ||
    lesson.subBlocks.some((sb) => blockHasContent(sb));
  const isWritten = titleReady && bodyReady;

  const [drag, setDrag] = useState({ fromIndex: -1, overIndex: -1 });
  const handleDragStart = (index) => () => {
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

          <div className="space-y-2.5">
            {lesson.subBlocks.length === 0 && (
              <EmptyBlocksHint />
            )}
            {lesson.subBlocks.map((sb, index) => (
              <LessonBlock
                key={sb.id}
                block={sb}
                index={index}
                isDragging={drag.fromIndex === index}
                isDropTarget={
                  drag.overIndex === index && drag.fromIndex !== index && drag.fromIndex >= 0
                }
                onDragStart={handleDragStart(index)}
                onDragOver={handleBlockDragOver(index)}
                onDrop={handleBlockDrop(index)}
                onDragEnd={handleDragEnd}
                onChange={(value) => onUpdateSubBlock(lesson.id, sb.id, value)}
                onUpdate={
                  onUpdateBlock
                    ? (patch) => onUpdateBlock(lesson.id, sb.id, patch)
                    : undefined
                }
                onRename={
                  onRenameBlock
                    ? (label) => onRenameBlock(lesson.id, sb.id, label)
                    : undefined
                }
                onDuplicate={
                  onDuplicateBlock ? () => onDuplicateBlock(lesson.id, sb.id) : undefined
                }
                onConvertToBulletList={
                  onConvertToBulletList && sb.type === 'steps'
                    ? () => onConvertToBulletList(lesson.id, sb.id)
                    : undefined
                }
                onDelete={
                  onDeleteBlock ? () => onDeleteBlock(lesson.id, sb.id) : undefined
                }
                expandedBulletIds={expandedBulletIds}
                onToggleBullet={onToggleBullet}
                onRefine={
                  onRefineSection ? () => onRefineSection(lesson.id, sb.id) : undefined
                }
                isRefining={refiningSections?.has(`${lesson.id}:${sb.id}`) ?? false}
              />
            ))}
          </div>

          {onAddBlock && (
            <AddSectionButton onAdd={(type) => onAddBlock(lesson.id, type)} />
          )}

          {hasCards && (
            <TeachFlowIndicator
              cardCount={lesson.cards.length}
              onOpen={onOpenTeachMode}
            />
          )}

          {onGenerateCards && isWritten && !hasCards && (
            <TeachFlowCTA
              onOpen={onOpenTeachMode}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TeachFlowCTA({ onOpen }) {
  return (
    <div className="mt-6 rounded-[12px] border border-dashed border-whisper bg-canvas/40 px-5 py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1 text-[10px] uppercase tracking-[0.25em] text-ink-muted">
            Ready to teach?
          </div>
          <p className="font-serif text-[17px] leading-[1.35] tracking-tight text-ink">
            Build a teaching flow for this lesson.
          </p>
          <p className="mt-1 text-[12.5px] leading-[1.55] text-ink-soft">
            Open Teach Mode to turn this lesson into live cues — cards you glance at while teaching.
          </p>
        </div>
        {onOpen && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="shrink-0 rounded-md bg-ink px-4 py-2 text-[12px] tracking-wide text-canvas transition hover:bg-[#2A1F18]"
          >
            Open Teach Mode
          </button>
        )}
      </div>
    </div>
  );
}

function TeachFlowIndicator({ cardCount, onOpen }) {
  return (
    <div className="mt-6 flex items-center justify-between gap-4 rounded-[12px] border border-whisper bg-paper/30 px-5 py-3.5">
      <div className="flex items-center gap-3 text-[12px] text-ink-soft">
        <span
          className="h-1.5 w-1.5 rounded-full bg-accent"
          aria-hidden="true"
        />
        <span className="tracking-wide">
          Teaching flow — {cardCount} {cardCount === 1 ? 'step' : 'steps'}
        </span>
      </div>
      {onOpen && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className="rounded-md bg-ink px-3.5 py-1.5 text-[11px] uppercase tracking-[0.15em] text-canvas transition hover:bg-[#2A1F18]"
        >
          Open Teach Mode
        </button>
      )}
    </div>
  );
}

function DurationField({ value, onChange }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Duration"
      aria-label="Lesson duration"
      className="w-[96px] rounded-full bg-transparent px-2.5 py-1 text-right text-[10px] uppercase tracking-[0.18em] text-ink-soft transition-colors duration-150 placeholder:normal-case placeholder:tracking-wide placeholder:italic placeholder:text-ink-faint hover:bg-whisper/50 focus:bg-whisper focus:text-ink focus:outline-none"
    />
  );
}

function EmptyBlocksHint() {
  return (
    <div className="rounded-lg border border-dashed border-whisper/70 bg-canvas/30 px-5 py-6 text-center">
      <p className="font-serif text-[16px] italic leading-[1.5] text-ink-soft">
        A blank lesson. Build it section by section —{' '}
        <span className="text-ink">add a text block, demo steps, a visual, or a comparison</span>.
      </p>
    </div>
  );
}

function LessonBlock({
  block,
  index,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onChange,
  onUpdate,
  onRename,
  onDuplicate,
  onConvertToBulletList,
  onDelete,
  onRefine,
  isRefining,
  expandedBulletIds,
  onToggleBullet,
}) {
  const isPlainText = block.type === 'text' || block.type === 'tips' || block.type === 'custom';
  const hasContent = isPlainText && Boolean(block.content && block.content.trim());
  const actionLabel = hasContent ? 'Improve' : 'Generate';
  const showRefineAction = isPlainText && onRefine;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const labelInputRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const focusLabel = () => {
    const el = labelInputRef.current;
    if (!el) return;
    el.focus();
    el.select();
  };

  const isDeepDive = block.type === 'deep_dive';

  return (
    <div
      data-block-id={block.id}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`group/sb relative rounded-lg px-4 py-3 transition ${
        isDeepDive ? 'border border-rose/40 bg-canvas/70' : 'bg-canvas'
      } ${isDragging ? 'opacity-40' : ''} ${
        isDropTarget ? 'ring-2 ring-accent/50' : ''
      }`}
      style={isDeepDive ? undefined : { borderLeft: `2px solid ${block.tint}` }}
    >
      {onDragStart && (
        <span
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            e.dataTransfer.effectAllowed = 'move';
            // Some browsers require a payload to start the drag.
            e.dataTransfer.setData('text/plain', String(index));
            onDragStart(e);
          }}
          role="button"
          aria-label="Drag to reorder"
          title="Drag to reorder"
          className="absolute left-[-18px] top-1/2 flex h-6 w-5 -translate-y-1/2 cursor-grab items-center justify-center rounded text-ink-faint opacity-0 transition group-hover/sb:opacity-100 hover:text-ink active:cursor-grabbing"
        >
          <span className="text-[13px] leading-none" aria-hidden="true">
            ⋮⋮
          </span>
        </span>
      )}
      <div className="mb-1 flex items-start justify-between gap-2">
        <input
          ref={labelInputRef}
          type="text"
          value={block.label}
          onChange={(e) => onRename && onRename(e.target.value)}
          placeholder="Section"
          className="min-w-0 flex-1 -mx-1 rounded bg-transparent px-1 py-0.5 text-[10px] uppercase tracking-[0.18em] text-ink-muted transition-colors duration-150 placeholder:normal-case placeholder:tracking-wide placeholder:italic placeholder:text-ink-faint hover:bg-white/60 focus:bg-white focus:text-ink focus:outline-none"
        />
        <div className="flex items-center gap-1">
          {showRefineAction && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRefine();
              }}
              disabled={isRefining}
              aria-label={`${actionLabel} ${block.label.toLowerCase()}`}
              className={`flex h-5 items-center gap-1 rounded-full border px-2 text-[9px] uppercase tracking-[0.18em] transition disabled:cursor-not-allowed ${
                isRefining
                  ? 'border-accent/40 bg-white text-accent opacity-100'
                  : 'border-transparent text-ink-muted opacity-0 hover:border-whisper hover:bg-white hover:text-ink focus:opacity-100 group-hover/sb:opacity-100'
              }`}
            >
              {isRefining ? (
                <>
                  <span className="h-2 w-2 animate-spin rounded-full border-[1.5px] border-accent/30 border-t-accent" />
                  <span>Working</span>
                </>
              ) : (
                actionLabel
              )}
            </button>
          )}
          {(onRename || onDuplicate || onConvertToBulletList || onDelete) && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((o) => !o);
                }}
                aria-label="Section options"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className={`flex h-5 w-5 items-center justify-center rounded text-ink-muted transition hover:bg-white hover:text-ink focus:opacity-100 ${
                  menuOpen ? 'opacity-100 bg-white text-ink' : 'opacity-0 group-hover/sb:opacity-100'
                }`}
              >
                <span className="text-sm leading-none">⋯</span>
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[26px] z-10 w-[144px] overflow-hidden rounded-md border border-whisper bg-white py-1 shadow-[0_6px_20px_rgba(42,31,27,0.10)]"
                >
                  {onRename && (
                    <MenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        setTimeout(focusLabel, 0);
                      }}
                    >
                      Rename
                    </MenuItem>
                  )}
                  {onDuplicate && (
                    <MenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onDuplicate();
                      }}
                    >
                      Duplicate
                    </MenuItem>
                  )}
                  {onConvertToBulletList && (
                    <MenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onConvertToBulletList();
                      }}
                    >
                      Convert to bullet list
                    </MenuItem>
                  )}
                  {onDelete && (
                    <MenuItem
                      danger
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onDelete();
                      }}
                    >
                      Delete
                    </MenuItem>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <BlockBody
        block={block}
        onChange={onChange}
        onUpdate={onUpdate}
        expandedBulletIds={expandedBulletIds}
        onToggleBullet={onToggleBullet}
      />
    </div>
  );
}

function BlockBody({ block, onChange, onUpdate, expandedBulletIds, onToggleBullet }) {
  if (block.type === 'steps') {
    return <StepsBody block={block} onUpdate={onUpdate} />;
  }
  if (block.type === 'bullet_list') {
    return (
      <BulletListBody
        block={block}
        onUpdate={onUpdate}
        expandedBulletIds={expandedBulletIds}
        onToggleBullet={onToggleBullet}
      />
    );
  }
  if (block.type === 'visual') {
    return <VisualBody block={block} onUpdate={onUpdate} />;
  }
  if (block.type === 'comparison') {
    return <ComparisonBody block={block} onUpdate={onUpdate} />;
  }
  return (
    <RichText
      value={block.content}
      onChange={onChange}
      placeholder={`Add ${(block.label || 'content').toLowerCase()}…`}
      className="-mx-1.5 w-[calc(100%+0.75rem)] rounded bg-transparent px-1.5 py-1 text-[13.5px] leading-[1.7] text-ink transition-colors duration-150 hover:bg-white/70 focus:bg-white"
    />
  );
}

/* ───────────────────── Bullet list (expandable, nested blocks) ─────────── */

const NESTED_BLOCK_MENU = [
  { key: 'text', label: 'Text' },
  { key: 'image', label: 'Image' },
  { key: 'tip', label: 'Tip' },
  { key: 'comparison', label: 'Comparison' },
  { key: 'divider', label: 'Divider' },
];

function makeNestedBlockLocal(type) {
  const base = { id: makeLocalId(), type };
  switch (type) {
    case 'image':
      return { ...base, image: null };
    case 'comparison':
      return { ...base, left: null, right: null, leftLabel: 'Correct', rightLabel: 'Incorrect' };
    case 'divider':
      return base;
    default:
      return { ...base, content: '' };
  }
}

function BulletListBody({ block, onUpdate, expandedBulletIds, onToggleBullet }) {
  const items = Array.isArray(block.items) ? block.items : [];

  const updateItems = (next) => onUpdate?.({ items: next });

  const patchItem = (id, patch) =>
    updateItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const insertItemAt = (index) => {
    const fresh = { id: makeLocalId(), text: '', blocks: [] };
    const next = [...items];
    next.splice(index, 0, fresh);
    updateItems(next);
  };

  const addItem = () => insertItemAt(items.length);

  const removeItem = (id) =>
    updateItems(items.filter((it) => it.id !== id));

  const moveItem = (id, dir) => {
    const idx = items.findIndex((it) => it.id === id);
    const target = idx + dir;
    if (idx === -1 || target < 0 || target >= items.length) return;
    const next = [...items];
    [next[idx], next[target]] = [next[target], next[idx]];
    updateItems(next);
  };

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-whisper bg-white/40 px-4 py-5 text-center">
        <p className="mb-2 font-serif text-[14px] italic text-ink-soft">
          No bullet points yet.
        </p>
        <button
          type="button"
          onClick={addItem}
          className="rounded-md bg-ink px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] text-canvas transition hover:bg-[#2A1F18]"
        >
          + Add first bullet
        </button>
      </div>
    );
  }

  return (
    <div>
      {items.map((item, i) => {
        const expanded = expandedBulletIds?.has(item.id) ?? false;
        return (
          <div key={item.id}>
            <BulletItemRow
              item={item}
              expanded={expanded}
              canMoveUp={i > 0}
              canMoveDown={i < items.length - 1}
              onToggle={() => onToggleBullet?.(item.id)}
              onChangeText={(text) => patchItem(item.id, { text })}
              onChangeBlocks={(blocks) => patchItem(item.id, { blocks })}
              onRemove={() => removeItem(item.id)}
              onMoveUp={() => moveItem(item.id, -1)}
              onMoveDown={() => moveItem(item.id, 1)}
            />
            {i < items.length - 1 && (
              <InsertBulletBetween onInsert={() => insertItemAt(i + 1)} />
            )}
          </div>
        );
      })}
      <button
        type="button"
        onClick={addItem}
        className="mt-1 rounded-md px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-ink-muted transition hover:bg-white/60 hover:text-ink"
      >
        + Add bullet
      </button>
    </div>
  );
}

function InsertBulletBetween({ onInsert }) {
  return (
    <div className="group/gap relative h-1.5">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onInsert();
        }}
        aria-label="Insert bullet here"
        className="absolute left-1/2 top-1/2 z-[1] flex -translate-x-1/2 -translate-y-1/2 items-center rounded-full border border-whisper bg-white px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-ink-muted opacity-0 shadow-[0_1px_2px_rgba(42,31,27,0.06)] transition hover:border-accent/50 hover:text-ink group-hover/gap:opacity-100"
      >
        + Insert
      </button>
      <div className="absolute left-3 right-3 top-1/2 h-px -translate-y-1/2 bg-whisper/60 opacity-0 transition group-hover/gap:opacity-100" />
    </div>
  );
}

function BulletItemRow({
  item,
  expanded,
  canMoveUp,
  canMoveDown,
  onToggle,
  onChangeText,
  onChangeBlocks,
  onRemove,
  onMoveUp,
  onMoveDown,
}) {
  const nestedBlocks = Array.isArray(item.blocks) ? item.blocks : [];
  const hasNested = nestedBlocks.length > 0;

  const updateNested = (next) => onChangeBlocks?.(next);
  const patchNested = (id, patch) =>
    updateNested(nestedBlocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const removeNested = (id) =>
    updateNested(nestedBlocks.filter((b) => b.id !== id));
  const moveNested = (id, dir) => {
    const idx = nestedBlocks.findIndex((b) => b.id === id);
    const target = idx + dir;
    if (idx === -1 || target < 0 || target >= nestedBlocks.length) return;
    const next = [...nestedBlocks];
    [next[idx], next[target]] = [next[target], next[idx]];
    updateNested(next);
  };
  const addNested = (type) => updateNested([...nestedBlocks, makeNestedBlockLocal(type)]);
  const convertNestedToText = (id) => {
    const current = nestedBlocks.find((b) => b.id === id);
    if (!current) return;
    updateNested(
      nestedBlocks.map((b) =>
        b.id === id ? { id: b.id, type: 'text', content: '' } : b,
      ),
    );
  };

  return (
    <div className="group/bi relative rounded-md px-2 py-0.5">
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
          aria-label={expanded ? 'Collapse bullet' : 'Expand bullet'}
          aria-expanded={expanded}
          className="mt-[10px] flex h-4 w-4 flex-shrink-0 items-center justify-center rounded text-ink-muted transition hover:bg-white/60 hover:text-ink"
        >
          <span
            className={`inline-block text-[9px] leading-none transition-transform ${
              expanded ? 'rotate-90' : ''
            }`}
            aria-hidden="true"
          >
            ▸
          </span>
        </button>
        <span
          className="mt-[12px] inline-block h-1 w-1 flex-shrink-0 rounded-full bg-accent"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <RichText
            value={item.text || ''}
            onChange={onChangeText}
            placeholder="Bullet point…"
            className="w-full -mx-1.5 rounded bg-transparent px-1.5 py-0.5 text-[13.5px] leading-[1.6] text-ink transition-colors duration-150 hover:bg-white/70 focus:bg-white"
          />
        </div>
        <div className="flex flex-col gap-0.5 opacity-0 transition group-hover/bi:opacity-100 focus-within:opacity-100">
          <IconBtn onClick={onMoveUp} disabled={!canMoveUp} aria-label="Move bullet up">
            ↑
          </IconBtn>
          <IconBtn onClick={onMoveDown} disabled={!canMoveDown} aria-label="Move bullet down">
            ↓
          </IconBtn>
          <IconBtn onClick={onRemove} aria-label="Remove bullet" danger>
            ×
          </IconBtn>
        </div>
      </div>

      {expanded && (
        <div className="ml-[26px] mt-1 border-l border-[#E5DFD8] pl-3">
          {hasNested && (
            <div className="space-y-1.5 py-1">
              {nestedBlocks.map((nb, ni) => (
                <NestedBlock
                  key={nb.id}
                  block={nb}
                  canMoveUp={ni > 0}
                  canMoveDown={ni < nestedBlocks.length - 1}
                  onChange={(patch) => patchNested(nb.id, patch)}
                  onRemove={() => removeNested(nb.id)}
                  onMoveUp={() => moveNested(nb.id, -1)}
                  onMoveDown={() => moveNested(nb.id, 1)}
                  onConvertToText={() => convertNestedToText(nb.id)}
                />
              ))}
            </div>
          )}
          <AddNestedBlockButton onAdd={addNested} />
        </div>
      )}
    </div>
  );
}

function AddNestedBlockButton({ onAdd }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative my-1" ref={wrapRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        className="rounded-md px-1.5 py-0.5 text-[10.5px] uppercase tracking-[0.14em] text-ink-muted transition hover:bg-white/60 hover:text-ink"
      >
        + Insert block
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-6 z-10 w-[160px] overflow-hidden rounded-md border border-whisper bg-white py-1 shadow-[0_6px_20px_rgba(42,31,27,0.10)]"
        >
          {NESTED_BLOCK_MENU.map((opt) => (
            <button
              key={opt.key}
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onAdd(opt.key);
              }}
              className="block w-full px-3 py-1.5 text-left text-[12.5px] text-ink transition hover:bg-paper/50"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NestedBlock({
  block,
  canMoveUp,
  canMoveDown,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  onConvertToText,
}) {
  const commonControls = (
    <div className="flex flex-col gap-0.5 opacity-0 transition group-hover/nb:opacity-100 focus-within:opacity-100">
      <IconBtn onClick={onMoveUp} disabled={!canMoveUp} aria-label="Move block up">
        ↑
      </IconBtn>
      <IconBtn onClick={onMoveDown} disabled={!canMoveDown} aria-label="Move block down">
        ↓
      </IconBtn>
      {block.type === 'image' && (
        <IconBtn onClick={onConvertToText} aria-label="Convert image to text">
          T
        </IconBtn>
      )}
      <IconBtn onClick={onRemove} aria-label="Remove block" danger>
        ×
      </IconBtn>
    </div>
  );

  if (block.type === 'divider') {
    return (
      <div className="group/nb relative flex items-center gap-2 py-1">
        <hr className="h-px flex-1 border-0 bg-whisper" />
        {commonControls}
      </div>
    );
  }

  if (block.type === 'image') {
    return (
      <div className="group/nb relative flex items-start gap-2 py-1">
        <div className="min-w-0 flex-1">
          <ImageUploader
            image={block.image}
            onChange={(image) => onChange({ image })}
            onRemove={() => onChange({ image: null })}
            compact
            showSizePicker
            placeholder="Add image"
          />
        </div>
        {commonControls}
      </div>
    );
  }

  if (block.type === 'comparison') {
    return (
      <div className="group/nb relative flex items-start gap-2 py-1">
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-[0.15em] text-ink-muted">
              {block.leftLabel || 'Correct'}
            </div>
            <ImageUploader
              image={block.left}
              onChange={(left) => onChange({ left })}
              onRemove={() => onChange({ left: null })}
              compact
              showSizePicker={false}
              placeholder="Left image"
            />
          </div>
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-[0.15em] text-ink-muted">
              {block.rightLabel || 'Incorrect'}
            </div>
            <ImageUploader
              image={block.right}
              onChange={(right) => onChange({ right })}
              onRemove={() => onChange({ right: null })}
              compact
              showSizePicker={false}
              placeholder="Right image"
            />
          </div>
        </div>
        {commonControls}
      </div>
    );
  }

  // text / tip / note — all use RichText with different visual treatment.
  const wrapperClass =
    block.type === 'tip'
      ? 'rounded-md border border-rose/40 bg-canvas/60 px-2.5 py-1.5'
      : block.type === 'note'
        ? 'rounded-md border border-whisper bg-paper/40 px-2.5 py-1.5'
        : '';
  const placeholder =
    block.type === 'tip'
      ? 'Pro tip…'
      : block.type === 'note'
        ? 'Note…'
        : 'Add text…';

  return (
    <div className="group/nb relative flex items-start gap-2 py-0.5">
      <div className={`min-w-0 flex-1 ${wrapperClass}`}>
        <RichText
          value={block.content || ''}
          onChange={(content) => onChange({ content })}
          placeholder={placeholder}
          className="w-full rounded bg-transparent px-0.5 py-0.5 text-[13px] leading-[1.6] text-ink"
        />
      </div>
      {commonControls}
    </div>
  );
}

/* ───────────────────────── Demo steps (items + images) ─────────────────── */

function StepsBody({ block, onUpdate }) {
  const items = Array.isArray(block.items) ? block.items : [];

  const updateItems = (next) => onUpdate?.({ items: next });

  const patchItem = (id, patch) =>
    updateItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const addItem = () =>
    updateItems([...items, { id: makeLocalId(), text: '', image: null }]);

  const removeItem = (id) =>
    updateItems(items.filter((it) => it.id !== id));

  const moveItem = (id, dir) => {
    const idx = items.findIndex((it) => it.id === id);
    const target = idx + dir;
    if (idx === -1 || target < 0 || target >= items.length) return;
    const next = [...items];
    [next[idx], next[target]] = [next[target], next[idx]];
    updateItems(next);
  };

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-whisper bg-white/40 px-4 py-5 text-center">
        <p className="mb-2 font-serif text-[14px] italic text-ink-soft">
          No steps yet.
        </p>
        <button
          type="button"
          onClick={addItem}
          className="rounded-md bg-ink px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] text-canvas transition hover:bg-[#2A1F18]"
        >
          + Add first step
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <StepItemRow
          key={item.id}
          index={i}
          item={item}
          canMoveUp={i > 0}
          canMoveDown={i < items.length - 1}
          onChangeText={(text) => patchItem(item.id, { text })}
          onChangeImage={(image) => patchItem(item.id, { image })}
          onRemoveImage={() => patchItem(item.id, { image: null })}
          onRemove={() => removeItem(item.id)}
          onMoveUp={() => moveItem(item.id, -1)}
          onMoveDown={() => moveItem(item.id, 1)}
        />
      ))}
      <button
        type="button"
        onClick={addItem}
        className="mt-1 rounded-md px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-ink-muted transition hover:bg-white/60 hover:text-ink"
      >
        + Add step
      </button>
    </div>
  );
}

function StepItemRow({
  index,
  item,
  canMoveUp,
  canMoveDown,
  onChangeText,
  onChangeImage,
  onRemoveImage,
  onRemove,
  onMoveUp,
  onMoveDown,
}) {
  return (
    <div className="group/step relative rounded-md bg-white/60 px-3 py-2.5">
      <div className="flex items-start gap-3">
        <span className="mt-1 font-serif italic text-[12px] text-ink-faint">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <RichText
            value={item.text || ''}
            onChange={onChangeText}
            placeholder="Step text…"
            className="w-full -mx-1.5 rounded bg-transparent px-1.5 py-1 text-[13.5px] leading-[1.7] text-ink transition-colors duration-150 hover:bg-white/70 focus:bg-white"
          />
          <ImageUploader
            image={item.image}
            onChange={onChangeImage}
            onRemove={onRemoveImage}
            compact
            placeholder="Add image for this step"
          />
        </div>
        <div className="flex flex-col gap-0.5 opacity-0 transition group-hover/step:opacity-100 focus-within:opacity-100">
          <IconBtn
            onClick={onMoveUp}
            disabled={!canMoveUp}
            aria-label="Move step up"
          >
            ↑
          </IconBtn>
          <IconBtn
            onClick={onMoveDown}
            disabled={!canMoveDown}
            aria-label="Move step down"
          >
            ↓
          </IconBtn>
          <IconBtn onClick={onRemove} aria-label="Remove step" danger>
            ×
          </IconBtn>
        </div>
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, disabled, danger, ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-5 w-5 items-center justify-center rounded text-[12px] leading-none transition disabled:cursor-not-allowed disabled:opacity-30 ${
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

/* ───────────────────────── Visual example ─────────────────────────────── */

function VisualBody({ block, onUpdate }) {
  const notes = Array.isArray(block.notes) ? block.notes : [];
  const layout = block.layout === 'split' ? 'split' : 'standard';

  const updateNotes = (next) => onUpdate?.({ notes: next });
  const addNote = () => updateNotes([...notes, '']);
  const patchNote = (i, value) => {
    const next = [...notes];
    next[i] = value;
    updateNotes(next);
  };
  const removeNote = (i) => {
    const next = [...notes];
    next.splice(i, 1);
    updateNotes(next);
  };

  const captionField = (
    <input
      type="text"
      value={block.caption || ''}
      onChange={(e) => onUpdate?.({ caption: e.target.value })}
      placeholder="Caption — what this image shows"
      className="w-full -mx-1.5 rounded-md bg-transparent px-1.5 py-1 font-serif text-[14.5px] italic leading-[1.5] text-ink-soft transition-colors duration-150 placeholder:not-italic placeholder:text-ink-faint hover:bg-white/70 focus:bg-white focus:text-ink focus:outline-none"
    />
  );

  const notesList = (
    <>
      {notes.length > 0 && (
        <ul className="space-y-1.5">
          {notes.map((note, i) => (
            <li key={i} className="group/n flex items-start gap-3">
              <span className="mt-[14px] h-1 w-1.5 shrink-0 rounded-full bg-accent/60" />
              <input
                type="text"
                value={note}
                onChange={(e) => patchNote(i, e.target.value)}
                placeholder="A note about this image…"
                className="min-w-0 flex-1 -mx-1.5 rounded bg-transparent px-1.5 py-1 text-[13px] leading-[1.55] text-ink transition-colors duration-150 placeholder:italic placeholder:text-ink-faint hover:bg-white/70 focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeNote(i)}
                aria-label="Remove note"
                className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-ink-muted opacity-0 transition hover:bg-whisper hover:text-ink focus:opacity-100 group-hover/n:opacity-100"
              >
                <span className="text-sm leading-none">×</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={addNote}
        className="rounded-md px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-ink-muted transition hover:bg-white/60 hover:text-ink"
      >
        + Add note
      </button>
    </>
  );

  return (
    <div className="space-y-3">
      <LayoutToggle
        value={layout}
        onChange={(next) => onUpdate?.({ layout: next })}
      />

      {layout === 'split' ? (
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-4">
          <ImageUploader
            image={block.image}
            onChange={(image) => onUpdate?.({ image })}
            onRemove={() => onUpdate?.({ image: null })}
            showSizePicker={false}
          />
          <div className="space-y-3">
            {captionField}
            {notesList}
          </div>
        </div>
      ) : (
        <>
          <ImageUploader
            image={block.image}
            onChange={(image) => onUpdate?.({ image })}
            onRemove={() => onUpdate?.({ image: null })}
          />
          {captionField}
          {notesList}
        </>
      )}
    </div>
  );
}

function LayoutToggle({ value, onChange }) {
  const opts = [
    { key: 'standard', label: 'Standard' },
    { key: 'split', label: 'Split' },
  ];
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-[0.18em] text-ink-muted">
        Layout
      </span>
      <div className="inline-flex overflow-hidden rounded-full border border-whisper bg-white">
        {opts.map((o) => {
          const active = value === o.key;
          return (
            <button
              key={o.key}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(o.key);
              }}
              className={`px-3 py-1 text-[10.5px] uppercase tracking-[0.14em] transition ${
                active ? 'bg-ink text-canvas' : 'text-ink-muted hover:bg-paper hover:text-ink'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WidthToggle({ value, onChange, label = 'Width' }) {
  const opts = [
    { key: 'small', label: 'S' },
    { key: 'medium', label: 'M' },
    { key: 'large', label: 'L' },
    { key: 'full', label: 'Full' },
  ];
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-[0.18em] text-ink-muted">
        {label}
      </span>
      <div className="inline-flex overflow-hidden rounded-full border border-whisper bg-white">
        {opts.map((o) => {
          const active = value === o.key;
          return (
            <button
              key={o.key}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(o.key);
              }}
              aria-label={`Width ${o.label}`}
              className={`px-2.5 py-1 text-[10.5px] tracking-[0.12em] transition ${
                active ? 'bg-ink text-canvas' : 'text-ink-muted hover:bg-paper hover:text-ink'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── Comparison block ───────────────────────────── */

function ComparisonBody({ block, onUpdate }) {
  const patchSide = (side, patch) =>
    onUpdate?.({ [side]: { ...(block[side] || {}), ...patch } });

  const size = block.size || 'full';
  const widthClass = blockWidthClass(size);

  return (
    <div className="space-y-3">
      <WidthToggle
        value={size}
        onChange={(next) => onUpdate?.({ size: next })}
        label="Width"
      />

      <div className={`${size === 'full' ? 'w-full' : `${widthClass} mx-auto`}`}>
        <div className="grid grid-cols-2 gap-3">
          {['left', 'right'].map((side) => {
            const data = block[side] || {};
            return (
              <div key={side} className="space-y-2">
                <input
                  type="text"
                  value={data.label || ''}
                  onChange={(e) => patchSide(side, { label: e.target.value })}
                  placeholder={side === 'left' ? 'e.g. Correct' : 'e.g. Incorrect'}
                  className="w-full -mx-1.5 rounded-md bg-transparent px-1.5 py-1 text-[11px] uppercase tracking-[0.18em] text-ink-muted transition-colors duration-150 placeholder:normal-case placeholder:tracking-wide placeholder:italic placeholder:text-ink-faint hover:bg-white/70 focus:bg-white focus:text-ink focus:outline-none"
                />
                <ImageUploader
                  image={data.image}
                  onChange={(image) => patchSide(side, { image })}
                  onRemove={() => patchSide(side, { image: null })}
                  showSizePicker={false}
                  aspectHint="square"
                  placeholder="Upload"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function makeLocalId() {
  return `i-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function MenuItem({ children, onClick, danger }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`block w-full px-3 py-1.5 text-left text-[12px] tracking-wide transition ${
        danger
          ? 'text-rose hover:bg-rose/5 hover:text-rose'
          : 'text-ink-soft hover:bg-paper/60 hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

const SECTION_TYPES = [
  { key: 'text', label: 'Text', desc: 'Prose or notes' },
  { key: 'bullet_list', label: 'Bullet list', desc: 'A clean list of points — no images' },
  { key: 'deep_dive', label: 'Deep dive', desc: 'A highlighted callout for deeper context' },
  { key: 'steps', label: 'Demo steps', desc: 'Numbered steps, each with an optional image' },
  { key: 'tips', label: 'Tips', desc: 'Quick pointers' },
  { key: 'visual', label: 'Visual example', desc: 'An image with caption and notes' },
  { key: 'comparison', label: 'Comparison', desc: 'Two images side by side — e.g. correct vs. incorrect' },
  { key: 'custom', label: 'Custom section', desc: 'Your own heading' },
];

function AddSectionButton({ onAdd }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative mt-3" ref={wrapRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-ink-muted transition hover:bg-paper/60 hover:text-ink"
      >
        <span className="text-sm leading-none">+</span>
        Add section
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-9 z-10 w-[240px] overflow-hidden rounded-lg border border-whisper bg-white py-1 shadow-[0_6px_20px_rgba(42,31,27,0.10)]"
        >
          {SECTION_TYPES.map((opt) => (
            <button
              key={opt.key}
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onAdd(opt.key);
              }}
              className="block w-full px-3 py-2 text-left transition hover:bg-paper/50"
            >
              <div className="text-[13px] font-medium text-ink">{opt.label}</div>
              <div className="text-[11px] text-ink-soft">{opt.desc}</div>
            </button>
          ))}
        </div>
      )}
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
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      className={className}
    />
  );
}
