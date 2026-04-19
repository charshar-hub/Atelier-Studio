import { useState } from 'react';

const STRENGTH_OPTIONS = [
  { key: 'low', label: 'Subtle' },
  { key: 'medium', label: 'Balanced' },
  { key: 'high', label: 'Strong' },
];

export default function StyleMatchDialog({ hasSavedProfile, defaultStrength, onApply, onCancel }) {
  const [keywords, setKeywords] = useState('');
  const [useSavedProfile, setUseSavedProfile] = useState(Boolean(hasSavedProfile));
  const [strength, setStrength] = useState(defaultStrength || 'medium');

  const canApply =
    keywords.trim().length > 0 || (hasSavedProfile && useSavedProfile);

  const handleApply = () => {
    if (!canApply) return;
    onApply({
      keywords: keywords.trim(),
      useSavedProfile: Boolean(hasSavedProfile && useSavedProfile),
      strength,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 p-6 backdrop-blur-sm">
      <div className="flex w-[min(580px,95vw)] flex-col overflow-hidden rounded-[14px] border border-whisper bg-paper shadow-2xl">
        <header className="border-b border-whisper px-6 py-5">
          <div className="mb-1 text-[10px] tracking-[0.25em] text-accent">MATCH MY STYLE</div>
          <h2 className="font-serif text-[24px] leading-[1.2] tracking-tight text-ink">
            Describe the style you want
          </h2>
          <p className="mt-1.5 text-[13px] leading-[1.6] text-ink-soft">
            Type a quick direction, pull from your captured voice, or both. Adjust how strongly to
            apply it.
          </p>
        </header>

        <div className="px-6 py-5">
          <Row
            label="Describe your style"
            hint="Free-form — one line is enough. Leave blank to use just your saved profile."
          >
            <textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="elegant, clear, mentor-like, premium, etc."
              rows={2}
              className="w-full resize-none rounded-md border border-whisper bg-white px-3 py-2 text-[14px] leading-[1.5] text-ink transition-colors placeholder:italic placeholder:text-ink-faint hover:border-[#D4C5B0] focus:border-accent/60 focus:outline-none"
            />
          </Row>

          <Row label="Saved Style Kit profile">
            <label
              className={`flex items-center gap-2 rounded-md border border-whisper bg-white px-3 py-2 transition ${
                hasSavedProfile
                  ? 'cursor-pointer hover:border-[#D4C5B0]'
                  : 'cursor-not-allowed opacity-60'
              }`}
            >
              <input
                type="checkbox"
                checked={hasSavedProfile && useSavedProfile}
                onChange={(e) => setUseSavedProfile(e.target.checked)}
                disabled={!hasSavedProfile}
                className="h-4 w-4 accent-ink"
              />
              <span className="text-[13px] text-ink">
                {hasSavedProfile
                  ? 'Use saved Style Kit profile'
                  : 'No profile captured yet — analyze one in Style Kit to enable.'}
              </span>
            </label>
          </Row>

          <Row label="Style strength">
            <div className="inline-flex rounded-full border border-whisper bg-white p-0.5">
              {STRENGTH_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setStrength(opt.key)}
                  className={`rounded-full px-3.5 py-1 text-[11px] uppercase tracking-[0.18em] transition ${
                    strength === opt.key
                      ? 'bg-ink text-canvas'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Row>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-whisper bg-canvas/40 px-6 py-4">
          <button
            onClick={onCancel}
            className="h-9 rounded-md border border-whisper bg-transparent px-4 text-[13px] tracking-wide text-ink transition hover:bg-paper"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!canApply}
            className="h-9 rounded-md bg-ink px-5 text-[13px] tracking-wide text-canvas transition hover:bg-[#2A1F18] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Apply style
          </button>
        </footer>
      </div>
    </div>
  );
}

function Row({ label, hint, children }) {
  return (
    <div className="mb-4">
      <div className="mb-1 text-[10px] uppercase tracking-[0.18em] text-ink-muted">{label}</div>
      {hint && <div className="mb-2 text-[12px] leading-[1.5] text-ink-soft">{hint}</div>}
      {children}
    </div>
  );
}
