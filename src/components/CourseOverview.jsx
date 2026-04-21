import { useRef } from 'react';

export default function CourseOverview({
  courseTitle,
  onChangeCourseTitle,
  overview,
  onUpdateOverview,
  moduleMeta,
  lessons,
  onPreview,
  onGenerateDescription,
  isGeneratingDescription,
}) {
  const fileInputRef = useRef(null);

  const outcomes = overview.learningOutcomes || [];
  const pricing = overview.pricing || { mode: 'free', price: null };

  const handleAddOutcome = () => {
    onUpdateOverview({ learningOutcomes: [...outcomes, ''] });
  };

  const handleUpdateOutcome = (idx, value) => {
    const next = outcomes.slice();
    next[idx] = value;
    onUpdateOverview({ learningOutcomes: next });
  };

  const handleRemoveOutcome = (idx) => {
    onUpdateOverview({
      learningOutcomes: outcomes.filter((_, i) => i !== idx),
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image is too large. Please use one under 5MB.');
      return;
    }
    try {
      const dataUrl = await readAsDataUrl(file);
      onUpdateOverview({ coverImage: dataUrl });
    } catch (err) {
      console.error('Cover image read failed:', err);
      alert('Could not read that image.');
    }
  };

  const handleRemoveCover = () => onUpdateOverview({ coverImage: null });

  const handleSetPricingMode = (mode) => {
    onUpdateOverview({
      pricing: {
        mode,
        price: mode === 'paid' ? pricing.price ?? '' : null,
      },
    });
  };

  const handleSetPrice = (value) => {
    onUpdateOverview({ pricing: { mode: 'paid', price: value } });
  };

  return (
    <main className="flex-1 overflow-y-auto px-14 py-10">
      <div className="mx-auto max-w-[820px]">
        <header className="mb-8">
          <div className="mb-2 text-[10px] tracking-[0.25em] text-accent">COURSE SETUP</div>
          <h1 className="mb-2 font-serif text-[36px] leading-[1.1] tracking-tight text-ink">
            Course Overview
          </h1>
          <p className="max-w-[620px] text-[15px] leading-[1.7] text-ink-soft">
            Shape how students discover and experience this course. Every field auto-saves as
            you type.
          </p>
        </header>

        <Section label="Course header">
          <div className="space-y-4">
            <FieldRow label="Title">
              <input
                type="text"
                value={courseTitle}
                onChange={(e) => onChangeCourseTitle(e.target.value)}
                placeholder="Untitled course"
                className="w-full -mx-2 rounded-md bg-transparent px-2 py-1.5 font-serif text-[26px] leading-[1.2] tracking-tight text-ink transition-colors duration-150 placeholder:italic placeholder:text-ink-faint hover:bg-paper/50 focus:bg-paper/70 focus:outline-none"
              />
            </FieldRow>

            <FieldRow label="Subtitle">
              <input
                type="text"
                value={overview.subtitle || ''}
                onChange={(e) => onUpdateOverview({ subtitle: e.target.value })}
                placeholder="A tagline that tells students what awaits them"
                className="w-full -mx-2 rounded-md bg-transparent px-2 py-1.5 font-serif text-[17px] italic leading-[1.4] text-ink-soft transition-colors duration-150 placeholder:italic placeholder:text-ink-faint hover:bg-paper/50 focus:bg-paper/70 focus:outline-none"
              />
            </FieldRow>

            <FieldRow label="Cover image">
              {overview.coverImage ? (
                <div className="group relative overflow-hidden rounded-lg border border-whisper">
                  <img
                    src={overview.coverImage}
                    alt="Course cover"
                    className="block h-[200px] w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveCover}
                    className="absolute right-3 top-3 rounded-full bg-ink/70 px-3 py-1 text-[11px] tracking-wide text-canvas opacity-0 backdrop-blur-sm transition group-hover:opacity-100"
                  >
                    Remove
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-3 right-3 rounded-full bg-canvas/85 px-3 py-1 text-[11px] tracking-wide text-ink opacity-0 backdrop-blur-sm transition group-hover:opacity-100"
                  >
                    Replace
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-[160px] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-whisper bg-paper/30 text-center text-ink-soft transition hover:bg-paper/60"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M12 4v12m0 0l-4-4m4 4l4-4M5 20h14"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="font-serif text-[15px] italic text-ink">Upload a cover image</span>
                  <span className="text-[11px] text-ink-muted">PNG, JPG, or WebP — up to 5MB</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </FieldRow>
          </div>
        </Section>

        <section className="mb-5 rounded-[12px] border border-whisper bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-[0.25em] text-ink-muted">
              Description
            </div>
            <button
              type="button"
              onClick={onGenerateDescription}
              disabled={isGeneratingDescription}
              className="flex items-center gap-2 rounded-full bg-ink px-3.5 py-1.5 text-[11px] tracking-wide text-canvas transition hover:bg-[#2A1F18] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGeneratingDescription ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-canvas/40 border-t-canvas" />
                  <span>Writing…</span>
                </>
              ) : (
                <>
                  <SparkleIcon />
                  <span>Generate with AI</span>
                </>
              )}
            </button>
          </div>
          <textarea
            value={overview.description || ''}
            onChange={(e) => onUpdateOverview({ description: e.target.value })}
            placeholder="What will students learn?"
            rows={8}
            className="w-full resize-y rounded-md bg-transparent px-1 py-1 text-[15px] leading-[1.75] text-ink transition-colors duration-150 placeholder:italic placeholder:text-ink-faint hover:bg-paper/30 focus:bg-paper/50 focus:outline-none"
          />
          <p className="mt-3 text-[11px] text-ink-muted">
            AI uses your title, lessons, and captured voice. Description, outcomes, audience, and
            value all populate — edit freely after.
          </p>
        </section>

        <Section label="Positioning" hint="Who this is for and what they walk away with.">
          <div className="space-y-4">
            <FieldRow label="Who this is for">
              <input
                type="text"
                value={overview.audience || ''}
                onChange={(e) => onUpdateOverview({ audience: e.target.value })}
                placeholder="Lash artists transitioning from extensions into lifts"
                className="w-full rounded-md border border-whisper bg-white px-3 py-2 text-[14px] leading-[1.5] text-ink transition-colors placeholder:italic placeholder:text-ink-faint hover:border-[#D4C5B0] focus:border-accent/60 focus:outline-none"
              />
            </FieldRow>
            <FieldRow label="The transformation">
              <input
                type="text"
                value={overview.value || ''}
                onChange={(e) => onUpdateOverview({ value: e.target.value })}
                placeholder="Leave with the rod choice and timing that produces a soft, client-ready lift every time."
                className="w-full rounded-md border border-whisper bg-white px-3 py-2 text-[14px] leading-[1.5] text-ink transition-colors placeholder:italic placeholder:text-ink-faint hover:border-[#D4C5B0] focus:border-accent/60 focus:outline-none"
              />
            </FieldRow>
          </div>
        </Section>

        <Section label="What you'll learn">
          <div className="space-y-2">
            {outcomes.length === 0 && (
              <p className="text-[13px] italic text-ink-muted">
                Add the outcomes students will walk away with — one per bullet.
              </p>
            )}
            {outcomes.map((outcome, idx) => (
              <OutcomeRow
                key={idx}
                value={outcome}
                onChange={(v) => handleUpdateOutcome(idx, v)}
                onRemove={() => handleRemoveOutcome(idx)}
              />
            ))}
            <button
              type="button"
              onClick={handleAddOutcome}
              className="mt-2 flex items-center gap-1.5 rounded-md border border-whisper bg-transparent px-3 py-1.5 text-[12px] tracking-wide text-ink-soft transition hover:bg-paper hover:text-ink"
            >
              <span className="text-base leading-none">+</span> Add another outcome
            </button>
          </div>
        </Section>

        <Section label="Course structure" hint="Generated automatically from your modules and lessons.">
          <div className="border-l-2 border-accent/30 pl-4">
            <div className="mb-0.5 text-[10px] uppercase tracking-[0.2em] text-ink-muted">
              Module {moduleMeta?.moduleNumber ?? 1} of {moduleMeta?.moduleCount ?? 1}
            </div>
            <div className="mb-3 font-serif text-[17px] italic text-ink">
              {moduleMeta?.moduleTitle || 'Untitled module'}
            </div>
            {lessons.length === 0 ? (
              <p className="text-[13px] italic text-ink-muted">
                No lessons yet. Head to Modules to add some.
              </p>
            ) : (
              <ol className="space-y-1.5">
                {lessons.map((lesson) => (
                  <li
                    key={lesson.id}
                    className="flex items-baseline gap-3 text-[14px] leading-[1.6]"
                  >
                    <span className="w-5 flex-shrink-0 font-serif italic text-ink-muted">
                      {lesson.number}.
                    </span>
                    <span className="flex-1 text-ink">
                      {lesson.title || 'Untitled lesson'}
                    </span>
                    {lesson.duration && (
                      <span className="text-[11px] tracking-wide text-ink-muted">
                        {lesson.duration}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Section>

        <Section label="Pricing">
          <div className="space-y-4">
            <div className="inline-flex rounded-full border border-whisper bg-white p-0.5">
              <PricingToggle
                active={pricing.mode !== 'paid'}
                onClick={() => handleSetPricingMode('free')}
              >
                Free
              </PricingToggle>
              <PricingToggle
                active={pricing.mode === 'paid'}
                onClick={() => handleSetPricingMode('paid')}
              >
                Paid
              </PricingToggle>
            </div>
            {pricing.mode === 'paid' && (
              <div className="flex items-center gap-2">
                <span className="text-[15px] text-ink-soft">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricing.price ?? ''}
                  onChange={(e) => handleSetPrice(e.target.value)}
                  placeholder="49.00"
                  className="w-32 rounded-md border border-whisper bg-white px-3 py-2 text-[15px] text-ink transition-colors placeholder:italic placeholder:text-ink-faint hover:border-[#D4C5B0] focus:border-accent/60 focus:outline-none"
                />
                <span className="text-[11px] uppercase tracking-[0.15em] text-ink-muted">USD</span>
              </div>
            )}
          </div>
        </Section>

        <div className="mt-8 flex items-center justify-between rounded-[12px] border border-whisper bg-paper p-5">
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-ink-muted">
              Ready to see it?
            </div>
            <p className="text-[13px] leading-[1.5] text-ink-soft">
              Preview how students will experience your course, end to end.
            </p>
          </div>
          <button
            type="button"
            onClick={onPreview}
            className="h-10 rounded-md bg-ink px-5 text-[13px] tracking-wide text-canvas transition hover:bg-[#2A1F18]"
          >
            Preview course
          </button>
        </div>

        <p className="mt-5 text-center text-[11px] text-ink-muted">
          Changes save automatically.
        </p>
      </div>
    </main>
  );
}

function Section({ label, hint, children }) {
  return (
    <section className="mb-5 rounded-[12px] border border-whisper bg-white p-6">
      <div className="mb-1 text-[10px] uppercase tracking-[0.25em] text-ink-muted">
        {label}
      </div>
      {hint && <div className="mb-4 text-[12px] leading-[1.5] text-ink-soft">{hint}</div>}
      {!hint && <div className="mb-4" />}
      {children}
    </section>
  );
}

function FieldRow({ label, children }) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] uppercase tracking-[0.18em] text-ink-muted">{label}</div>
      {children}
    </div>
  );
}

function OutcomeRow({ value, onChange, onRemove }) {
  return (
    <div className="group flex items-center gap-2">
      <span className="text-[15px] text-ink-muted" aria-hidden="true">
        •
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="A clear, tangible outcome"
        className="flex-1 rounded-md bg-transparent px-2 py-1.5 text-[15px] leading-[1.5] text-ink transition-colors placeholder:italic placeholder:text-ink-faint hover:bg-paper/30 focus:bg-paper/50 focus:outline-none"
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove outcome"
        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-ink-muted opacity-0 transition hover:bg-whisper hover:text-ink focus:opacity-100 group-hover:opacity-100"
      >
        <span className="text-sm leading-none">×</span>
      </button>
    </div>
  );
}

function PricingToggle({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-[12px] uppercase tracking-[0.18em] transition ${
        active ? 'bg-ink text-canvas' : 'text-ink-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

function SparkleIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 1.5l1.4 3.6 3.6 1.4-3.6 1.4L8 11.5 6.6 7.9 3 6.5l3.6-1.4L8 1.5zM13 11l.7 1.8 1.8.7-1.8.7L13 16l-.7-1.8-1.8-.7 1.8-.7L13 11z"
        fill="currentColor"
      />
    </svg>
  );
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
