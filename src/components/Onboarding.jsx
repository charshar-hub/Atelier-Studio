import { useEffect, useState } from 'react';

const DRAFT_KEY = 'atelier.onboardingDraft';

const DEFAULT_DATA = {
  idea: '',
  audience: 'beginner',
  struggle: '',
  goal: '',
  voiceSample: '',
  toneKeywords: '',
};

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return DEFAULT_DATA;
    return { ...DEFAULT_DATA, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_DATA;
  }
}

function saveDraft(data) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function clearOnboardingDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

export default function Onboarding({ onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState(loadDraft);
  const [error, setError] = useState(null);

  useEffect(() => {
    saveDraft(data);
  }, [data]);

  const update = (patch) => setData((prev) => ({ ...prev, ...patch }));

  const handleFinalize = async () => {
    setError(null);
    setStep(4);
    // Minimum dwell time on the transition screen so the 3-stage fade
    // always completes, regardless of API speed.
    const minDelay = new Promise((r) => setTimeout(r, 3200));
    try {
      await Promise.all([onComplete(data), minDelay]);
      // success: App will navigate away; clear draft after a tick
      clearOnboardingDraft();
    } catch (err) {
      console.error('Onboarding finalize failed:', err);
      setError(err?.message || 'Something went wrong. Please try again.');
      setStep(3);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <Header onCancel={onCancel} />
      <div className="flex flex-1 items-center justify-center px-8 py-12">
        {step === 1 && <Step1 data={data} update={update} onNext={() => setStep(2)} />}
        {step === 2 && (
          <Step2
            data={data}
            update={update}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <Step3
            data={data}
            update={update}
            onBack={() => setStep(2)}
            onSubmit={handleFinalize}
            error={error}
          />
        )}
        {step === 4 && <Step4Loading />}
      </div>
    </div>
  );
}

function Header({ onCancel }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-whisper bg-canvas px-6">
      <div className="flex items-center">
        <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-accent">
          <span className="font-serif italic text-base leading-none text-canvas">a</span>
        </div>
        <span className="ml-2 font-serif text-[17px] leading-none tracking-wide">AYUAI</span>
        <span className="ml-2 text-[10px] leading-none tracking-[0.2em] text-accent">STUDIO</span>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="text-[12px] text-ink-muted transition hover:text-ink"
      >
        Exit setup
      </button>
    </header>
  );
}

function StepKicker({ step, total = 3 }) {
  return (
    <div className="mb-3 text-[10px] tracking-[0.25em] text-accent">
      STEP {step} OF {total}
    </div>
  );
}

function Step1({ data, update, onNext }) {
  const canProceed = data.idea.trim().length > 0;
  return (
    <div className="w-full max-w-[620px] text-center">
      <StepKicker step={1} />
      <h1 className="mb-4 font-serif text-[44px] leading-[1.1] tracking-tight text-ink">
        What are you creating?
      </h1>
      <p className="mb-10 text-[15px] leading-[1.7] text-ink-soft">
        Start with a simple idea — we'll shape it into a course.
      </p>
      <input
        type="text"
        value={data.idea}
        onChange={(e) => update({ idea: e.target.value })}
        placeholder="e.g., Korean lash lift technique for new lash artists"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter' && canProceed) onNext();
        }}
        className="mb-10 w-full border-b-2 border-whisper bg-transparent pb-3 text-center font-serif text-[22px] leading-[1.3] text-ink transition-colors placeholder:italic placeholder:text-ink-faint focus:border-accent focus:outline-none"
      />
      <button
        type="button"
        onClick={onNext}
        disabled={!canProceed}
        className="h-11 rounded-md bg-ink px-6 text-[13px] tracking-wide text-canvas transition hover:bg-[#2A1F18] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Continue →
      </button>
    </div>
  );
}

function Step2({ data, update, onBack, onNext }) {
  const levels = ['beginner', 'intermediate', 'advanced'];
  return (
    <div className="w-full max-w-[640px] text-center">
      <StepKicker step={2} />
      <h1 className="mb-4 font-serif text-[44px] leading-[1.1] tracking-tight text-ink">
        Who are your students?
      </h1>
      <p className="mb-8 text-[15px] leading-[1.7] text-ink-soft">
        We'll shape every lesson to meet them where they are.
      </p>

      <div className="mb-8 flex flex-wrap justify-center gap-3">
        {levels.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => update({ audience: level })}
            className={`rounded-full border px-5 py-2 text-[13px] tracking-wide capitalize transition ${
              data.audience === level
                ? 'border-accent bg-ink text-canvas'
                : 'border-whisper bg-white text-ink-soft hover:border-accent/40 hover:text-ink'
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      <div className="mx-auto mb-4 max-w-[480px] text-left">
        <label className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-ink-muted">
          What do they struggle with most? (optional)
        </label>
        <input
          type="text"
          value={data.struggle}
          onChange={(e) => update({ struggle: e.target.value })}
          placeholder="e.g., choosing the right rod size"
          className="w-full rounded-md border border-whisper bg-white px-4 py-2.5 text-[14px] text-ink transition-colors placeholder:italic placeholder:text-ink-faint hover:border-[#D4C5B0] focus:border-accent/60 focus:outline-none"
        />
      </div>

      <div className="mx-auto mb-10 max-w-[480px] text-left">
        <label className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-ink-muted">
          What do they want to achieve? (optional)
        </label>
        <input
          type="text"
          value={data.goal}
          onChange={(e) => update({ goal: e.target.value })}
          placeholder="e.g. confidently map brows, improve retention, master symmetry"
          className="w-full rounded-md border border-whisper bg-white px-4 py-2.5 text-[14px] text-ink transition-colors placeholder:italic placeholder:text-ink-faint hover:border-[#D4C5B0] focus:border-accent/60 focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="h-11 rounded-md border border-whisper bg-white px-5 text-[13px] tracking-wide text-ink transition hover:bg-paper"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="h-11 rounded-md bg-ink px-6 text-[13px] tracking-wide text-canvas transition hover:bg-[#2A1F18]"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

function Step3({ data, update, onBack, onSubmit, error }) {
  const hasSample = data.voiceSample.trim().length > 0;
  return (
    <div className="w-full max-w-[640px] text-center">
      <StepKicker step={3} />
      <h1 className="mb-4 font-serif text-[44px] leading-[1.1] tracking-tight text-ink">
        Let's capture your voice
      </h1>
      <p className="mx-auto mb-8 max-w-[560px] text-[15px] leading-[1.7] text-ink-soft">
        Paste something you've written — a script, caption, or explanation. We'll learn how you
        naturally speak, and carry that through every lesson.
      </p>

      <textarea
        value={data.voiceSample}
        onChange={(e) => update({ voiceSample: e.target.value })}
        placeholder={"Paste a script, explanation, or something you've written before…\n\nThe more natural it is, the better your course will sound."}
        rows={7}
        className="mb-4 w-full resize-none rounded-md border border-whisper bg-white px-6 py-5 text-left font-serif text-[15px] leading-[1.75] text-ink transition-colors placeholder:font-serif placeholder:italic placeholder:text-ink-faint hover:border-[#D4C5B0] focus:border-accent/60 focus:outline-none"
      />

      <div className="mx-auto mb-8 max-w-[560px] text-left">
        <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-ink-muted">
          Examples
        </div>
        <ul className="space-y-1 font-serif text-[14px] italic leading-[1.55] text-ink-soft">
          <li>"When mapping brows, don't rush…"</li>
          <li>"A common mistake I see is…"</li>
          <li>"Think of it like this…"</li>
        </ul>
      </div>

      <div className="mx-auto mb-8 max-w-[480px] text-left">
        <label className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-ink-muted">
          How should it feel? (optional)
        </label>
        <input
          type="text"
          value={data.toneKeywords}
          onChange={(e) => update({ toneKeywords: e.target.value })}
          placeholder="e.g., warm, direct, elegant, mentor-like"
          className="w-full rounded-md border border-whisper bg-white px-4 py-2.5 text-[14px] text-ink transition-colors placeholder:italic placeholder:text-ink-faint hover:border-[#D4C5B0] focus:border-accent/60 focus:outline-none"
        />
      </div>

      {error && (
        <div className="mx-auto mb-6 max-w-[520px] rounded-md border border-rose bg-white px-4 py-3 text-[13px] text-ink">
          {error}
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="h-11 rounded-md border border-whisper bg-white px-5 text-[13px] tracking-wide text-ink transition hover:bg-paper"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="h-11 rounded-md bg-ink px-6 text-[13px] tracking-wide text-canvas transition hover:bg-[#2A1F18]"
        >
          {hasSample ? 'Build my course →' : 'Skip and build →'}
        </button>
      </div>

      <p className="mt-4 text-[12px] text-ink-muted">
        You can always add or refine your voice later in Style Kit.
      </p>
    </div>
  );
}

function Step4Loading() {
  const steps = [
    'Understanding your topic',
    'Structuring your first module',
    'Applying your voice',
  ];
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveIdx((i) => (i < steps.length - 1 ? i + 1 : i));
    }, 1100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full max-w-[520px] text-center">
      <h1 className="mb-12 font-serif text-[34px] leading-[1.15] tracking-tight text-ink">
        Shaping your course…
      </h1>
      <ul className="space-y-5">
        {steps.map((step, i) => {
          const isActive = i === activeIdx;
          const isDone = i < activeIdx;
          return (
            <li
              key={step}
              className={`font-serif text-[18px] italic leading-[1.5] transition-all duration-700 ease-out ${
                isActive
                  ? 'text-ink opacity-100'
                  : isDone
                    ? 'text-ink-soft opacity-70'
                    : 'text-ink-muted opacity-25'
              }`}
            >
              {step}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
