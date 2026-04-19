import { useState } from 'react';

export default function StructuredOutlineModal({
  outline,
  lessonTitle,
  canApply,
  onInsertSection,
  onInsertAll,
  onReplace,
  onCopy,
  onClose,
}) {
  const [copied, setCopied] = useState(false);
  const sections = Array.isArray(outline?.sections) ? outline.sections : [];
  const hasSections = sections.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 p-6 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-[min(640px,95vw)] flex-col overflow-hidden rounded-[14px] border border-whisper bg-paper shadow-2xl">
        <header className="border-b border-whisper px-6 py-5">
          <div className="mb-1 text-[10px] tracking-[0.25em] text-accent">STRUCTURED OUTLINE</div>
          <h2 className="font-serif text-[24px] leading-[1.2] tracking-tight text-ink">
            {lessonTitle ? `How to teach "${lessonTitle}"` : 'Teaching outline'}
          </h2>
          <p className="mt-1.5 text-[13px] leading-[1.6] text-ink-soft">
            Add individual sections, insert the whole outline, or replace the lesson with it.
          </p>
        </header>

        <div className="overflow-y-auto px-6 py-5">
          {!hasSections ? (
            <p className="text-[13px] italic text-ink-soft">
              No sections returned. Try again with more context in the lesson summary.
            </p>
          ) : (
            sections.map((section, idx) => (
              <Section
                key={idx}
                section={section}
                canApply={canApply}
                onAdd={() => onInsertSection && onInsertSection(section)}
              />
            ))
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-whisper bg-canvas/40 px-6 py-4">
          <button
            onClick={onClose}
            className="h-9 rounded-md border border-whisper bg-transparent px-4 text-[13px] tracking-wide text-ink transition hover:bg-paper"
          >
            Close
          </button>
          <button
            onClick={async () => {
              if (!onCopy) return;
              await onCopy();
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            disabled={!hasSections}
            className="h-9 rounded-md border border-whisper bg-transparent px-4 text-[13px] tracking-wide text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copied ? 'Copied ✓' : 'Copy only'}
          </button>
          <button
            onClick={onReplace}
            disabled={!canApply || !hasSections}
            className="h-9 rounded-md border border-rose bg-canvas px-4 text-[13px] tracking-wide text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Replace lesson
          </button>
          <button
            onClick={onInsertAll}
            disabled={!canApply || !hasSections}
            className="h-9 rounded-md bg-ink px-5 text-[13px] tracking-wide text-canvas transition hover:bg-[#2A1F18] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Insert into lesson
          </button>
        </footer>
      </div>
    </div>
  );
}

function Section({ section, canApply, onAdd }) {
  const title = typeof section?.title === 'string' ? section.title : '';
  const type = section?.type;
  const isExpand = type === 'expand';
  const items = Array.isArray(section?.items) ? section.items.filter(Boolean) : [];
  const notes = typeof section?.notes === 'string' ? section.notes : '';

  return (
    <div
      className={`group mb-5 rounded-[10px] p-4 transition ${
        isExpand ? 'border border-rose bg-canvas/60' : 'border border-whisper bg-canvas/30'
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {isExpand && (
            <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-accent">
              Deeper Understanding
            </div>
          )}
          {title && (
            <h3 className="font-serif text-[17px] leading-[1.3] tracking-tight text-ink">
              {title}
            </h3>
          )}
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={!canApply}
          className="shrink-0 rounded-full border border-whisper bg-paper px-3 py-1 text-[11px] uppercase tracking-[0.15em] text-ink-muted opacity-0 transition hover:border-accent/40 hover:bg-white hover:text-ink focus:opacity-100 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Add to lesson
        </button>
      </div>

      {isExpand ? (
        <p className="text-[14px] leading-[1.6] text-ink">{notes}</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item, i) => {
            const bulletText =
              typeof item === 'string'
                ? item
                : typeof item?.title === 'string'
                  ? item.title
                  : typeof item?.text === 'string'
                    ? item.text
                    : '';
            const nested =
              item && typeof item === 'object' && Array.isArray(item.blocks)
                ? item.blocks
                : [];
            return (
              <li key={i} className="text-[14px] leading-[1.55] text-ink">
                <div className="flex gap-2.5">
                  <span className="mt-[9px] inline-block h-1 w-1 flex-shrink-0 rounded-full bg-accent" />
                  <span>{bulletText}</span>
                </div>
                {nested.length > 0 && (
                  <div className="mt-1.5 ml-[14px] space-y-1 border-l border-whisper pl-3">
                    {nested.map((nb, ni) => {
                      if (!nb || typeof nb !== 'object') return null;
                      const content =
                        typeof nb.content === 'string' ? nb.content : '';
                      if (!content) return null;
                      const tone =
                        nb.type === 'tip'
                          ? 'text-ink'
                          : nb.type === 'note'
                            ? 'text-ink-soft italic'
                            : 'text-ink-soft';
                      return (
                        <p key={ni} className={`text-[13px] leading-[1.55] ${tone}`}>
                          {content}
                        </p>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
