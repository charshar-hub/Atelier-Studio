export default function Homepage({ onEnterWorkspace }) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-canvas text-ink">
      <NavBar onEnterWorkspace={onEnterWorkspace} />
      <Hero onEnterWorkspace={onEnterWorkspace} />
      <WhyThisExists />
      <ProductPreview />
      <Features />
      <HowItWorks />
      <FinalCTA onEnterWorkspace={onEnterWorkspace} />
      <Footer />
    </div>
  );
}

function NavBar({ onEnterWorkspace }) {
  return (
    <nav className="sticky top-0 z-30 border-b border-whisper/60 bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between px-8">
        {/* Left: logo + primary nav links */}
        <div className="flex items-center gap-10">
          <div className="flex items-center">
            <div className="flex h-[28px] w-[28px] items-center justify-center rounded-full bg-accent">
              <span className="font-serif italic text-base leading-none text-canvas">a</span>
            </div>
            <span className="ml-2.5 font-serif text-[18px] leading-none tracking-wide">
              AYUAI
            </span>
            <span className="ml-2 text-[10px] leading-none tracking-[0.25em] text-accent">
              STUDIO
            </span>
          </div>
          <div className="hidden items-center gap-7 md:flex">
            <a
              href="#features"
              className="text-[13px] leading-none text-ink-soft transition hover:text-ink"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-[13px] leading-none text-ink-soft transition hover:text-ink"
            >
              How it works
            </a>
            <button
              type="button"
              onClick={onEnterWorkspace}
              className="text-[13px] leading-none text-ink-soft transition hover:text-ink"
            >
              Workspace
            </button>
          </div>
        </div>

        {/* Right: CTA */}
        <button
          type="button"
          onClick={onEnterWorkspace}
          className="h-9 rounded-md bg-ink px-4 text-[12px] tracking-wide text-canvas transition hover:bg-[#2A1F18]"
        >
          Start building
        </button>
      </div>
    </nav>
  );
}

function Hero({ onEnterWorkspace }) {
  return (
    <section className="relative px-8 pb-[120px] pt-[120px] text-center">
      <div className="mx-auto max-w-[1100px]">
        <div className="mx-auto max-w-[840px]">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-whisper bg-white px-3.5 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-ink-muted">
              For creators who obsess over craft
            </span>
          </div>
          <h1 className="mb-6 font-serif text-[68px] leading-[1.1] text-ink md:text-[82px]">
            Build a course <span className="italic">in your exact voice</span> — in days, not
            months.
          </h1>
          <p className="mx-auto mb-9 max-w-[620px] text-[18px] leading-[1.6] text-ink-soft">
            Capture how you teach once. AYUAI generates lessons, rewrites sections, and shapes
            every word to sound like you — in seconds, not hours.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onEnterWorkspace}
              className="h-12 rounded-md bg-ink px-6 text-[14px] tracking-wide text-canvas transition hover:bg-[#2A1F18]"
            >
              Start building →
            </button>
            <a
              href="#how-it-works"
              className="flex h-12 items-center rounded-md border border-whisper bg-white px-5 text-[14px] tracking-wide text-ink transition hover:bg-paper"
            >
              See how it works
            </a>
          </div>
          <p className="mt-6 text-[12px] text-ink-muted">
            No templates. No scaffolding. Just your voice, shaped into a course students will pay for.
          </p>
        </div>
      </div>
    </section>
  );
}

function ProductPreview() {
  return (
    <section className="px-8 py-[120px]">
      <div className="mx-auto max-w-[1100px]">
        <div className="relative rounded-[18px] border border-whisper bg-white shadow-[0_20px_60px_-20px_rgba(58,46,38,0.18)]">
          {/* Browser chrome */}
          <div className="flex items-center gap-1.5 border-b border-whisper px-5 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-rose/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-accent/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-ink-muted/40" />
            <span className="ml-4 text-[11px] tracking-widest text-ink-muted">
              ayuai.com · Korean Lash Lift Masterclass
            </span>
          </div>

          <div className="flex bg-canvas">
            {/* Mini sidebar */}
            <div className="hidden w-[160px] flex-shrink-0 border-r border-whisper bg-paper px-3 py-4 sm:block">
              <div className="mb-3 px-2 text-[9px] uppercase tracking-[0.25em] text-ink-muted">
                Workspace
              </div>
              <MiniNav label="Course Overview" />
              <MiniNav label="Modules" active count="4" />
              <MiniNav label="Lessons" count="12" />
              <MiniNav label="Slides" />
              <div className="my-3 mx-1.5 h-px bg-whisper" />
              <div className="mb-3 px-2 text-[9px] uppercase tracking-[0.25em] text-ink-muted">
                Your Voice
              </div>
              <MiniNav label="Style Kit" dot />
            </div>

            {/* Main content */}
            <div className="min-w-0 flex-1 px-7 py-6">
              <div className="mb-1 text-[9px] tracking-[0.25em] text-accent">MODULE 2 OF 4</div>
              <div className="mb-4 font-serif text-[22px] leading-[1.1] tracking-tight text-ink">
                The Lift &amp; Set Technique
              </div>

              <div className="rounded-lg border border-whisper bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-paper">
                    <span className="font-serif italic text-[12px] text-ink-muted">1</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-serif text-[16px] font-medium text-ink">
                        Choosing the right rod size
                      </span>
                      <span className="rounded-full bg-whisper px-2 py-0.5 text-[9px] tracking-wide text-ink-soft">
                        5 MIN
                      </span>
                    </div>
                    <div className="mb-3 text-[11px] leading-[1.5] text-ink-soft">
                      A lash lift lives and dies by the rod. Walk through four sizes and the
                      pinch test that never fails.
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <MiniBlock label="Script" tint="#B8936A" />
                      <MiniBlock label="Demo steps" tint="#D4A89A" />
                      <MiniBlock label="Common mistakes" tint="#C9A876" />
                      <MiniBlock label="Pro tip" tint="#A89178" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mini AI panel */}
            <div className="hidden w-[180px] flex-shrink-0 border-l border-whisper bg-paper px-4 py-4 md:block">
              <div className="mb-1 text-[9px] tracking-[0.25em] text-accent">ASSISTANT</div>
              <div className="mb-4 font-serif text-[16px] tracking-tight text-ink">
                AI Actions
              </div>
              <MiniAction label="Generate full lesson" primary />
              <MiniAction label="Match my style" highlight />
              <MiniAction label="Improve content" />
              <MiniAction label="Simplify language" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniNav({ label, active, count, dot }) {
  return (
    <div
      className={`mb-0.5 flex items-center rounded-md px-2 py-1.5 text-[11px] ${
        active ? 'border border-whisper bg-canvas font-medium text-ink' : 'text-ink-soft'
      }`}
    >
      <span className="flex-1 truncate">{label}</span>
      {count && (
        <span className="rounded-full bg-whisper px-1.5 py-px text-[9px] text-ink-muted">
          {count}
        </span>
      )}
      {dot && <span className="h-1 w-1 rounded-full bg-accent" />}
    </div>
  );
}

function MiniBlock({ label, tint }) {
  return (
    <div
      className="rounded bg-canvas px-2 py-1.5"
      style={{ borderLeft: `2px solid ${tint}` }}
    >
      <div className="text-[8px] uppercase tracking-[0.15em] text-ink-muted">{label}</div>
      <div className="mt-0.5 h-0.5 w-10 rounded-full bg-whisper" />
      <div className="mt-1 h-0.5 w-14 rounded-full bg-whisper" />
    </div>
  );
}

function MiniAction({ label, primary, highlight }) {
  const base = 'mb-1 flex items-center rounded-md px-2 py-1.5 text-[10px] tracking-wide';
  if (primary) return <div className={`${base} bg-ink text-canvas`}>{label}</div>;
  if (highlight) {
    return (
      <div className={`${base} border border-rose bg-canvas text-ink`}>
        <span className="flex-1">{label}</span>
        <span className="h-1 w-1 rounded-full bg-accent" />
      </div>
    );
  }
  return <div className={`${base} border border-whisper bg-canvas text-ink`}>{label}</div>;
}

function WhyThisExists() {
  return (
    <section className="bg-paper px-8 py-[120px]">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-3 text-[10px] tracking-[0.25em] text-accent">WHY THIS EXISTS</div>
        <h2 className="mb-10 max-w-[680px] font-serif text-[44px] leading-[1.1] tracking-tight text-ink">
          You shouldn't have to choose between{' '}
          <span className="italic">fast</span> and{' '}
          <span className="italic">in your voice</span>.
        </h2>

        <div className="mb-10 grid gap-6 md:grid-cols-3">
          <ProblemCard
            label="It takes months"
            text="Weeks of outlines, decks, and blank templates before you ever write a real lesson. Most creators quit before they launch."
          />
          <ProblemCard
            label="AI sounds like AI"
            text="Generic copy that could be any course online — nothing like how you actually teach, nothing worth charging for."
          />
          <ProblemCard
            label="You rewrite everything"
            text="You end up editing every sentence the AI wrote. Slower than starting from scratch, and it still doesn't sound like you."
          />
        </div>

        <div className="rounded-[14px] border border-accent/30 bg-white px-8 py-7">
          <div className="mb-2 text-[10px] tracking-[0.25em] text-accent">THE DIFFERENCE</div>
          <p className="max-w-[720px] font-serif text-[22px] italic leading-[1.45] text-ink">
            AYUAI is built around your voice. Paste one sample of how you teach — your words
            become the pattern every generation works within. You lead. AI follows.
          </p>
        </div>
      </div>
    </section>
  );
}

function ProblemCard({ label, text }) {
  return (
    <div className="flex h-full flex-col rounded-[14px] border border-whisper bg-white px-6 py-7">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[20px] text-ink-faint" aria-hidden="true">
          ✕
        </span>
        <span className="text-[10px] uppercase tracking-[0.25em] text-ink-muted">{label}</span>
      </div>
      <p className="text-[15px] leading-[1.65] text-ink-soft">{text}</p>
    </div>
  );
}

function Features() {
  return (
    <section id="features" className="px-8 py-[120px]">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-3 text-[10px] tracking-[0.25em] text-accent">FEATURES</div>
        <h2 className="mb-10 max-w-[680px] font-serif text-[44px] leading-[1.1] tracking-tight text-ink">
          Built for your craft, <span className="italic">not against it</span>.
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={<PenIcon />}
            title="Write like yourself — not like a template"
            text="Modules, lessons, and sections flow like a document. No drag-drop puzzles, no builder scaffolding — just your words in a calm space that auto-saves as you type."
          />
          <FeatureCard
            icon={<WaveIcon />}
            title="Train AI to sound like you"
            text="Paste one writing sample. AYUAI analyzes your tone, sentence rhythm, and signature phrases — every rewrite comes back unmistakably in your voice."
          />
          <FeatureCard
            icon={<SparkIcon />}
            title="Go from idea to lesson in seconds"
            text="One-click full-lesson generation. Per-section refinement. Description writing. All grounded in your course context, all in your tone."
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, text }) {
  return (
    <div className="flex h-full flex-col rounded-[14px] border border-whisper bg-white px-7 py-8">
      <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-paper text-accent">
        {icon}
      </div>
      <h3 className="mb-2 font-serif text-[22px] leading-[1.2] tracking-tight text-ink">
        {title}
      </h3>
      <p className="text-[14px] leading-[1.65] text-ink-soft">{text}</p>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: '01',
      title: 'Capture your voice',
      text: 'Paste a sample of past writing. AYUAI analyzes tone, sentence style, and signature phrases.',
    },
    {
      n: '02',
      title: 'Build your course',
      text: 'Create modules and lessons in a calm, document-like editor. Everything auto-saves.',
    },
    {
      n: '03',
      title: 'Refine with AI',
      text: 'Generate full lessons, rewrite sections in your tone, simplify language — one click per action.',
    },
    {
      n: '04',
      title: 'Preview & export',
      text: 'See the student experience end to end. Export as PDF, plain text, or copy straight to clipboard.',
    },
  ];

  return (
    <section id="how-it-works" className="bg-paper px-8 py-[120px]">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-3 text-[10px] tracking-[0.25em] text-accent">HOW IT WORKS</div>
        <h2 className="mb-10 max-w-[680px] font-serif text-[44px] leading-[1.1] tracking-tight text-ink">
          Four steps from blank to{' '}
          <span className="italic">launch-ready</span>.
        </h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div
              key={s.n}
              className="flex h-full flex-col rounded-[14px] border border-whisper bg-white px-6 py-7"
            >
              <div className="mb-5 font-serif text-[34px] italic text-accent">{s.n}</div>
              <h3 className="mb-2 font-serif text-[20px] leading-[1.2] tracking-tight text-ink">
                {s.title}
              </h3>
              <p className="text-[13.5px] leading-[1.65] text-ink-soft">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA({ onEnterWorkspace }) {
  return (
    <section className="px-8 py-[120px]">
      <div className="mx-auto max-w-[1100px] text-center">
        <div className="mx-auto max-w-[720px]">
        <div className="mb-4 text-[10px] tracking-[0.25em] text-accent">READY?</div>
        <h2 className="mb-5 font-serif text-[52px] leading-[1.05] tracking-tight text-ink">
          Turn your knowledge into a course{' '}
          <span className="italic">people will pay for</span>.
        </h2>
        <p className="mx-auto mb-8 max-w-[540px] text-[16px] leading-[1.65] text-ink-soft">
          A quiet, premium space to shape how you teach. Build it once, in your voice, and
          charge what it's worth.
        </p>
        <button
          type="button"
          onClick={onEnterWorkspace}
          className="h-12 rounded-md bg-ink px-7 text-[14px] tracking-wide text-canvas transition hover:bg-[#2A1F18]"
        >
          Open the workspace →
        </button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-whisper bg-canvas px-8 py-8">
      <div className="mx-auto flex max-w-[1100px] items-center justify-between">
        <div className="flex items-center">
          <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-accent">
            <span className="font-serif italic text-[13px] text-canvas">a</span>
          </div>
          <span className="ml-2 font-serif text-[14px] tracking-wide">AYUAI</span>
          <span className="ml-1.5 text-[9px] tracking-[0.25em] text-accent">STUDIO</span>
        </div>
        <span className="text-[11px] text-ink-muted">
          Built for creators who care about craft.
        </span>
      </div>
    </footer>
  );
}

function PenIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 4l6 6-11 11H3v-6L14 4z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 5l6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WaveIcon() {
  return (
    <svg width="20" height="18" viewBox="0 0 24 20" fill="none" aria-hidden="true">
      <path
        d="M2 10h2m3-6v12m3-9v6m3-8v10m3-7v4m3-6v8m2-4h2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 16 20" fill="none" aria-hidden="true">
      <path
        d="M9 2L3 11h4l-1 7 6-9H8l1-7z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
