import { useRef, useState } from 'react';

const STRENGTH_LEVELS = ['low', 'medium', 'high'];

const TONE_PRESETS = [
  'soft',
  'warm',
  'direct',
  'elegant',
  'confident',
  'reflective',
  'precise',
  'bold',
  'playful',
];

const TEACHING_STYLE_PRESETS = [
  'step-by-step',
  'story-based',
  'conversational',
  'example-first',
  'hands-on',
  'principle-first',
];

const PERSONALITY_PRESETS = [
  'calm mentor',
  'confident expert',
  'approachable friend',
  'patient guide',
  'straight shooter',
];

export default function StyleKit({
  sampleText,
  onChangeSample,
  profile,
  onAnalyze,
  onClear,
  onUpdateProfile,
  onSetStrength,
  onAddSignaturePhrase,
  onRemoveSignaturePhrase,
  isAnalyzing,
}) {
  const canAnalyze = sampleText.trim().length > 0 && !isAnalyzing;
  const fileInputRef = useRef(null);
  const [extractStatus, setExtractStatus] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsExtracting(true);
    setExtractStatus(null);
    try {
      const { extractTextFromFile } = await import('../lib/extractText');
      const text = await extractTextFromFile(file);
      if (!text || !text.trim()) {
        throw new Error('No readable text found in that file.');
      }
      onChangeSample(text);
      setExtractStatus({ tone: 'ok', message: `Text extracted from ${file.name}` });
    } catch (err) {
      console.error('File extraction failed:', err);
      setExtractStatus({
        tone: 'error',
        message: err?.message || 'Could not read that file.',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const toggleTag = (category, tag) => {
    const current = profile?.[category] || [];
    const next = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    onUpdateProfile({ [category]: next });
  };

  const addCustomTag = (category, tag) => {
    const clean = tag.trim().toLowerCase();
    if (!clean) return;
    const current = profile?.[category] || [];
    if (current.includes(clean)) return;
    onUpdateProfile({ [category]: [...current, clean] });
  };

  return (
    <main className="flex-1 overflow-y-auto px-14 py-12">
      <div className="mb-10">
        <div className="mb-2 text-[10px] tracking-[0.25em] text-accent">YOUR VOICE</div>
        <h1 className="mb-3 font-serif text-[36px] leading-[1.1] tracking-tight text-ink">
          Your Voice
        </h1>
        <p className="max-w-[640px] text-[15px] leading-[1.7] text-ink-soft">
          Shape how you sound. AYUAI learns from something you've written and carries that
          voice into every lesson.
        </p>
      </div>

      {/* Sample content (always visible) */}
      <div className="mb-8 rounded-[14px] border border-whisper/70 bg-white p-7 shadow-[0_1px_3px_rgba(58,46,38,0.03)]">
        <div className="mb-2.5 flex items-center justify-between px-1">
          <label className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">
            Something you've written
          </label>
          <label
            className={`flex cursor-pointer items-center gap-1.5 rounded-full border border-whisper px-3 py-1 text-[11px] tracking-wide transition ${
              isExtracting
                ? 'bg-canvas text-ink-muted'
                : 'bg-canvas text-ink-soft hover:bg-paper hover:text-ink'
            }`}
          >
            {isExtracting ? (
              <>
                <span className="h-2.5 w-2.5 animate-spin rounded-full border-[1.5px] border-ink-muted/30 border-t-ink-muted" />
                <span>Extracting…</span>
              </>
            ) : (
              <>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M12 3L8 7m0 0L4 3m4 4v7M3 13h10"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Upload PDF or DOCX</span>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              disabled={isExtracting}
              className="hidden"
            />
          </label>
        </div>
        <textarea
          value={sampleText}
          onChange={(e) => onChangeSample(e.target.value)}
          placeholder="Paste a script, caption, or anything you've written recently."
          rows={10}
          className="w-full resize-y rounded-md bg-transparent px-1 py-1 text-[15px] leading-[1.75] text-ink transition-colors duration-150 placeholder:italic placeholder:text-ink-faint hover:bg-paper/30 focus:bg-paper/50 focus:outline-none"
        />
        {extractStatus && (
          <div
            className={`mt-3 flex items-center gap-2 rounded-md border px-3 py-2 text-[12px] ${
              extractStatus.tone === 'ok'
                ? 'border-accent/30 bg-paper/50 text-ink'
                : 'border-rose bg-white text-ink'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                extractStatus.tone === 'ok' ? 'bg-accent' : 'bg-rose'
              }`}
            />
            <span>{extractStatus.message}</span>
          </div>
        )}
        <div className="mt-4 flex items-center justify-between border-t border-whisper pt-4">
          <span className="text-[12px] text-ink-soft">
            {sampleText.length.toLocaleString()} characters
            {sampleText.trim() && ` · ${sampleText.trim().split(/\s+/).length} words`}
          </span>
          <div className="flex items-center gap-2">
            {profile && (
              <button
                onClick={onClear}
                className="h-8 rounded-md border border-whisper bg-transparent px-3 text-xs tracking-wide text-ink-soft transition hover:bg-paper"
              >
                Clear
              </button>
            )}
            <button
              onClick={onAnalyze}
              disabled={!canAnalyze}
              className="flex h-8 items-center gap-2 rounded-md bg-ink px-4 text-xs tracking-wide text-canvas transition hover:bg-[#2A1F18] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isAnalyzing && (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-canvas/40 border-t-canvas" />
              )}
              {isAnalyzing ? 'Listening…' : profile ? 'Refresh voice' : 'Capture my voice'}
            </button>
          </div>
        </div>
      </div>

      {profile && (
        <>
          <VoiceSummaryCard
            profile={profile}
            onRefine={onAnalyze}
            isRefining={isAnalyzing}
            canRefine={canAnalyze}
          />
          <VoiceControlsCard
            profile={profile}
            onToggleTag={toggleTag}
            onAddCustomTag={addCustomTag}
            onSetStrength={onSetStrength}
          />
          <SignatureVoiceCard
            phrases={profile.signaturePhrases || []}
            onAdd={onAddSignaturePhrase}
            onRemove={onRemoveSignaturePhrase}
          />
        </>
      )}
    </main>
  );
}

function VoiceSummaryCard({ profile, onRefine, isRefining, canRefine }) {
  return (
    <section className="mb-8 rounded-[14px] border border-accent/30 bg-white p-9 shadow-[0_0_0_4px_rgba(184,147,106,0.05),0_4px_16px_-8px_rgba(58,46,38,0.08)]">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="text-[10px] tracking-[0.25em] text-accent">YOUR SIGNATURE</span>
        </div>
        <button
          type="button"
          onClick={onRefine}
          disabled={!canRefine}
          className="flex items-center gap-1.5 rounded-full border border-whisper bg-canvas px-3.5 py-1.5 text-[11px] tracking-wide text-ink-soft transition hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRefining ? (
            <>
              <span className="h-2.5 w-2.5 animate-spin rounded-full border-[1.5px] border-ink-muted/30 border-t-ink-muted" />
              <span>Refining…</span>
            </>
          ) : (
            <>
              <span>Refine</span>
              <span aria-hidden="true">→</span>
            </>
          )}
        </button>
      </div>

      <p className="font-serif text-[34px] italic leading-[1.2] tracking-tight text-ink">
        {profile.summary || 'Voice captured.'}
      </p>
      <p className="mt-4 text-[14px] leading-[1.7] text-ink-soft">
        This is how your course will sound to your students.
      </p>
    </section>
  );
}

function VoiceControlsCard({ profile, onToggleTag, onAddCustomTag, onSetStrength }) {
  return (
    <section className="mb-8 rounded-[14px] border border-whisper/70 bg-white p-8 shadow-[0_1px_3px_rgba(58,46,38,0.03)]">
      <div className="mb-5 flex items-center">
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
        <span className="text-[10px] tracking-[0.2em] text-ink-muted">SHAPE YOUR VOICE</span>
      </div>

      <TagSection
        label="How it feels"
        hint="The emotional quality your students pick up."
        selected={profile.toneTags || []}
        presets={TONE_PRESETS}
        onToggle={(tag) => onToggleTag('toneTags', tag)}
        onAddCustom={(tag) => onAddCustomTag('toneTags', tag)}
        placeholder="+ add your own"
      />

      <TagSection
        label="How you teach"
        hint="The way you shape explanations."
        selected={profile.teachingStyleTags || []}
        presets={TEACHING_STYLE_PRESETS}
        onToggle={(tag) => onToggleTag('teachingStyleTags', tag)}
        onAddCustom={(tag) => onAddCustomTag('teachingStyleTags', tag)}
        placeholder="+ add your own"
      />

      <TagSection
        label="Who you sound like"
        hint="The voice behind the words."
        selected={profile.personalityTags || []}
        presets={PERSONALITY_PRESETS}
        onToggle={(tag) => onToggleTag('personalityTags', tag)}
        onAddCustom={(tag) => onAddCustomTag('personalityTags', tag)}
        placeholder="+ add your own"
      />

      <div>
        <div className="mb-1 text-[10px] uppercase tracking-[0.18em] text-ink-muted">
          How strongly it comes through
        </div>
        <div className="mb-3 text-[12px] leading-[1.5] text-ink-soft">
          How much of your voice shows up when AI rewrites.
        </div>
        <div className="inline-flex rounded-full border border-whisper bg-white p-0.5">
          {STRENGTH_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => onSetStrength(level)}
              className={`rounded-full px-3.5 py-1 text-[11px] uppercase tracking-[0.18em] transition ${
                (profile.strength || 'medium') === level
                  ? 'bg-ink text-canvas'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function TagSection({ label, hint, selected, presets, onToggle, onAddCustom, placeholder }) {
  const [customInput, setCustomInput] = useState('');
  const unusedPresets = presets.filter((p) => !selected.includes(p));

  const submitCustom = () => {
    const clean = customInput.trim();
    if (clean) onAddCustom(clean);
    setCustomInput('');
  };

  return (
    <div className="mb-8">
      <div className="mb-1 text-[10px] uppercase tracking-[0.18em] text-ink-muted">{label}</div>
      {hint && <div className="mb-3 text-[12px] leading-[1.5] text-ink-soft">{hint}</div>}
      <div className="flex flex-wrap items-center gap-2">
        {selected.map((tag) => (
          <button
            key={`sel-${tag}`}
            type="button"
            onClick={() => onToggle(tag)}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-[12px] text-canvas transition hover:bg-[#2A1F18]"
            title="Click to remove"
          >
            <span>{tag}</span>
            <span className="text-[13px] leading-none opacity-70">×</span>
          </button>
        ))}
        {unusedPresets.map((tag) => (
          <button
            key={`pre-${tag}`}
            type="button"
            onClick={() => onToggle(tag)}
            className="rounded-full bg-paper/60 px-3.5 py-1.5 text-[12px] text-ink-soft transition hover:bg-paper hover:text-ink"
          >
            {tag}
          </button>
        ))}
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submitCustom();
            }
          }}
          onBlur={submitCustom}
          placeholder={placeholder || '+ add your own'}
          className="min-w-[140px] flex-1 rounded-full bg-transparent px-3.5 py-1.5 text-[12px] text-ink transition-colors placeholder:italic placeholder:text-ink-faint focus:bg-paper/40 focus:outline-none"
        />
      </div>
    </div>
  );
}

function SignatureVoiceCard({ phrases, onAdd, onRemove }) {
  const [input, setInput] = useState('');

  const submit = () => {
    const clean = input.trim();
    if (clean) onAdd(clean);
    setInput('');
  };

  return (
    <section className="rounded-[14px] border border-whisper/70 bg-white p-8 shadow-[0_1px_3px_rgba(58,46,38,0.03)]">
      <div className="mb-5 flex items-center">
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
        <span className="text-[10px] tracking-[0.2em] text-ink-muted">YOUR PHRASES</span>
      </div>
      <p className="mb-6 max-w-[560px] text-[13px] leading-[1.65] text-ink-soft">
        The phrases you naturally reach for. AYUAI weaves them back into every lesson.
      </p>

      <div className="flex flex-wrap items-center gap-2.5">
        {phrases.length === 0 && (
          <p className="text-[13px] italic text-ink-faint">
            Nothing yet — add a phrase, or capture your voice from a sample.
          </p>
        )}
        {phrases.map((phrase) => (
          <span
            key={phrase}
            className="inline-flex items-center gap-1.5 rounded-full bg-paper/70 px-3.5 py-1.5 font-serif text-[13px] italic leading-[1.4] text-ink"
          >
            <span>"{phrase}"</span>
            <button
              type="button"
              onClick={() => onRemove(phrase)}
              aria-label="Remove phrase"
              className="flex h-4 w-4 items-center justify-center rounded-full text-ink-muted transition hover:bg-whisper hover:text-ink"
            >
              <span className="text-[13px] leading-none">×</span>
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
          onBlur={submit}
          placeholder="+ add a phrase you say often"
          className="min-w-[220px] flex-1 rounded-full bg-transparent px-3.5 py-1.5 font-serif text-[13px] italic text-ink transition-colors placeholder:not-italic placeholder:font-sans placeholder:text-ink-faint hover:bg-paper/40 focus:bg-paper/50 focus:outline-none"
        />
      </div>
    </section>
  );
}
