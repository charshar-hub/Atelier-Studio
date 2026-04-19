export default function ExpansionPreviewModal({
  expansion,
  lessonTitle,
  onApply,
  onCancel,
}) {
  const sections = Array.isArray(expansion?.sections) ? expansion.sections : [];
  const hasSections = sections.some(
    (s) => Array.isArray(s?.items) && s.items.some((i) => i?.expanded),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 p-6 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-[min(720px,95vw)] flex-col overflow-hidden rounded-[14px] border border-whisper bg-paper shadow-2xl">
        <header className="border-b border-whisper px-6 py-5">
          <div className="mb-1 text-[10px] tracking-[0.25em] text-accent">EXPAND TO TEACH</div>
          <h2 className="font-serif text-[24px] leading-[1.2] tracking-tight text-ink">
            {lessonTitle ? `Preview expansion — "${lessonTitle}"` : 'Preview expansion'}
          </h2>
          <p className="mt-1.5 text-[13px] leading-[1.6] text-ink-soft">
            Your existing bullets stay untouched. A new teaching text block will be added after each
            section when you apply.
          </p>
        </header>

        <div className="overflow-y-auto px-6 py-5">
          {!hasSections ? (
            <p className="text-[13px] italic text-ink-soft">
              No expansion returned. Try again, or make sure the lesson has bullet-style sections.
            </p>
          ) : (
            sections.map((section, i) => <SectionPreview key={i} section={section} />)
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-whisper bg-canvas/40 px-6 py-4">
          <button
            onClick={onCancel}
            className="h-9 rounded-md border border-whisper bg-transparent px-4 text-[13px] tracking-wide text-ink transition hover:bg-paper"
          >
            Cancel
          </button>
          <button
            onClick={onApply}
            disabled={!hasSections}
            className="h-9 rounded-md bg-ink px-5 text-[13px] tracking-wide text-canvas transition hover:bg-[#2A1F18] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Apply expansion
          </button>
        </footer>
      </div>
    </div>
  );
}

function SectionPreview({ section }) {
  const title = typeof section?.title === 'string' ? section.title : '';
  const items = Array.isArray(section?.items) ? section.items : [];
  return (
    <div className="mb-6 rounded-[10px] border border-whisper bg-canvas/30 p-4">
      {title && (
        <h3 className="mb-3 font-serif text-[17px] leading-[1.3] tracking-tight text-ink">
          {title}
        </h3>
      )}
      <div className="space-y-4">
        {items.map((item, i) => {
          const bullet = typeof item?.bullet === 'string' ? item.bullet : '';
          const expanded = typeof item?.expanded === 'string' ? item.expanded : '';
          return (
            <div key={i}>
              <div className="mb-1 flex gap-2.5">
                <span className="mt-[9px] inline-block h-1 w-1 flex-shrink-0 rounded-full bg-accent" />
                <span className="text-[14px] font-medium leading-[1.5] text-ink">{bullet}</span>
              </div>
              <p className="pl-5 text-[13.5px] leading-[1.6] text-ink-soft">{expanded}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
