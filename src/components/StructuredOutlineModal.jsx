export default function StructuredOutlineModal({ outline, lessonTitle, onClose }) {
  const sections = Array.isArray(outline?.sections) ? outline.sections : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 p-6 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-[min(640px,95vw)] flex-col overflow-hidden rounded-[14px] border border-whisper bg-paper shadow-2xl">
        <header className="border-b border-whisper px-6 py-5">
          <div className="mb-1 text-[10px] tracking-[0.25em] text-accent">STRUCTURED OUTLINE</div>
          <h2 className="font-serif text-[24px] leading-[1.2] tracking-tight text-ink">
            {lessonTitle ? `How to teach "${lessonTitle}"` : 'Teaching outline'}
          </h2>
          <p className="mt-1.5 text-[13px] leading-[1.6] text-ink-soft">
            A structured breakdown for the educator — not replacement lesson copy.
          </p>
        </header>

        <div className="overflow-y-auto px-6 py-5">
          {sections.length === 0 ? (
            <p className="text-[13px] italic text-ink-soft">
              No sections returned. Try again with more context in the lesson summary.
            </p>
          ) : (
            sections.map((section, idx) => (
              <Section key={idx} section={section} />
            ))
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-whisper bg-canvas/40 px-6 py-4">
          <button
            onClick={onClose}
            className="h-9 rounded-md bg-ink px-5 text-[13px] tracking-wide text-canvas transition hover:bg-[#2A1F18]"
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}

function Section({ section }) {
  const title = typeof section?.title === 'string' ? section.title : '';
  const type = section?.type;

  if (type === 'expand') {
    const notes = typeof section?.notes === 'string' ? section.notes : '';
    return (
      <div className="mb-5 rounded-[10px] border border-rose bg-canvas/60 p-4">
        <div className="mb-1.5 text-[10px] uppercase tracking-[0.2em] text-accent">
          Deeper Understanding
        </div>
        {title && (
          <h3 className="mb-2 font-serif text-[17px] leading-[1.3] text-ink">{title}</h3>
        )}
        <p className="text-[14px] leading-[1.6] text-ink">{notes}</p>
      </div>
    );
  }

  const items = Array.isArray(section?.items) ? section.items.filter(Boolean) : [];
  return (
    <div className="mb-5">
      {title && (
        <h3 className="mb-2 font-serif text-[17px] leading-[1.3] tracking-tight text-ink">
          {title}
        </h3>
      )}
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex gap-2.5 text-[14px] leading-[1.55] text-ink"
          >
            <span className="mt-[9px] inline-block h-1 w-1 flex-shrink-0 rounded-full bg-accent" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
