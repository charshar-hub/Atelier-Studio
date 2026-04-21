// AYUAI Studio marketing homepage — modern SaaS layout.
//
// Scope conventions (all scoped to <div data-page="home">):
// • Typography: Inter only. Hierarchy via size + weight, not font style.
// • Spacing scale: 8 / 16 / 24 / 32 / 48 / 72 px.
//   Tailwind mapping: gap-2 / gap-4 / gap-6 / gap-8 / gap-12 / gap-18.
// • Layout: max-w-[1100px] outer, max-w-[640px] for reading text.
// • Sections: border-b only, no paper-fill cards.
// • Labels: 12px uppercase, text-ink-soft (resolves to #6B7280 here).
// • Buttons: rounded-lg (8px), solid black primary, bordered secondary.

export default function Homepage({ onEnterWorkspace }) {
  return (
    <div
      data-page="home"
      className="min-h-screen w-full overflow-x-hidden bg-canvas text-ink"
    >
      <NavBar onEnterWorkspace={onEnterWorkspace} />
      <Hero onEnterWorkspace={onEnterWorkspace} />
      <Pillars />
      <HowItWorks />
      <ThemeSystemSection />
      <Capabilities />
      <Relatable />
      <FinalCTA onEnterWorkspace={onEnterWorkspace} />
      <Footer />
    </div>
  );
}

// ── Nav ─────────────────────────────────────────────────────────────────────

function NavBar({ onEnterWorkspace }) {
  return (
    <nav className="sticky top-0 z-30 border-b border-whisper bg-canvas/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between px-8">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink">
              <span className="text-[13px] font-semibold leading-none text-canvas">
                A
              </span>
            </div>
            <span className="text-[15px] font-semibold leading-none tracking-tight">
              AYUAI Studio
            </span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#how-it-works"
              className="text-[14px] leading-none text-ink-soft transition hover:text-ink"
            >
              How it works
            </a>
            <a
              href="#themes"
              className="text-[14px] leading-none text-ink-soft transition hover:text-ink"
            >
              Themes
            </a>
            <a
              href="#capabilities"
              className="text-[14px] leading-none text-ink-soft transition hover:text-ink"
            >
              Capabilities
            </a>
          </div>
        </div>

        <button
          type="button"
          onClick={onEnterWorkspace}
          className="h-9 rounded-lg bg-ink px-4 text-[13px] font-medium text-canvas transition hover:opacity-90"
        >
          Open workspace
        </button>
      </div>
    </nav>
  );
}

// ── Hero ────────────────────────────────────────────────────────────────────

function Hero({ onEnterWorkspace }) {
  return (
    <section className="border-b border-whisper">
      <div className="mx-auto flex max-w-[1100px] flex-col items-center px-8 pb-[72px] pt-[96px] text-center">
        <SectionLabel className="mb-8">AYUAI · Course Studio</SectionLabel>
        <h1 className="max-w-[900px] text-[56px] font-semibold leading-[1.05] tracking-tight text-ink">
          Turn what you know into a course that sounds like you.
        </h1>
        <p className="mt-8 max-w-[640px] text-[18px] leading-[1.55] text-ink-soft">
          AYUAI captures your teaching voice, drafts structured lessons around it, and
          gives you a library of themes to shape how students see the result — without
          rewriting a word.
        </p>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onEnterWorkspace}
            className="h-11 rounded-lg bg-ink px-6 text-[14px] font-medium text-canvas transition hover:opacity-90"
          >
            Start a course
          </button>
          <a
            href="#how-it-works"
            className="flex h-11 items-center rounded-lg border border-whisper bg-transparent px-6 text-[14px] font-medium text-ink transition hover:bg-paper"
          >
            See how it works
          </a>
        </div>
      </div>
    </section>
  );
}

// ── What AYUAI Does (3 pillars) ─────────────────────────────────────────────

function Pillars() {
  const items = [
    {
      label: '01 · Voice',
      title: 'Capture how you teach.',
      body: 'Paste a script, a caption, or anything you’ve written. AYUAI analyzes your tone, sentence rhythm, and signature phrases once — then reuses that voice across every lesson.',
    },
    {
      label: '02 · Content',
      title: 'Generate structured lessons.',
      body: 'Describe the topic, the audience, and the goal. AYUAI drafts lesson titles, outlines, scripts, demo steps, and common mistakes — already written in your voice.',
    },
    {
      label: '03 · Presentation',
      title: 'Present with themes.',
      body: 'Choose a theme built for your audience — beauty, education, wellness, or minimal. Switch any time. Your content stays put; only the look changes.',
    },
  ];
  return (
    <Section>
      <SectionHeader label="What AYUAI does" title="Three things, done cleanly." />
      <div className="grid gap-8 md:grid-cols-3">
        {items.map((item) => (
          <div key={item.label}>
            <SectionLabel className="mb-3">{item.label}</SectionLabel>
            <h3 className="mb-3 text-[20px] font-semibold leading-[1.3] text-ink">
              {item.title}
            </h3>
            <p className="max-w-[640px] text-[15px] leading-[1.65] text-ink-soft">
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── How It Works ────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      n: '01',
      title: 'Define your teaching style.',
      body: 'Share one writing sample — a page, a caption, or a few paragraphs. AYUAI reads it and builds a reusable voice profile you can refine any time.',
    },
    {
      n: '02',
      title: 'Generate the course.',
      body: 'Describe your topic, your audience, and what you want them to walk away knowing. AYUAI drafts the modules and lessons as a full working outline.',
    },
    {
      n: '03',
      title: 'Apply a theme and publish.',
      body: 'Pick a theme that matches the audience. Preview it. Edit anything that needs a second pass. Share with students or export when ready.',
    },
  ];
  return (
    <Section id="how-it-works">
      <SectionHeader label="How it works" title="Three steps, no project planning." />
      <ol className="grid gap-8 md:grid-cols-3">
        {steps.map((step) => (
          <li
            key={step.n}
            className="flex flex-col border-t border-whisper pt-6"
          >
            <span className="mb-4 text-[13px] font-medium tabular-nums text-ink-soft">
              {step.n}
            </span>
            <h3 className="mb-3 text-[18px] font-semibold leading-[1.35] text-ink">
              {step.title}
            </h3>
            <p className="text-[15px] leading-[1.65] text-ink-soft">{step.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

// ── Theme System ────────────────────────────────────────────────────────────

function ThemeSystemSection() {
  const themes = [
    { name: 'Beauty Pro', note: 'Warm cream, serif headings' },
    { name: 'Minimal Dark', note: 'Near black, bold sans' },
    { name: 'Education Classic', note: 'Slate, blue accent' },
    { name: 'Wellness Calm', note: 'Sage green, airy' },
    { name: 'Creator Clean', note: 'White, grid-aligned' },
  ];
  return (
    <Section id="themes">
      <div className="mb-12 grid gap-8 md:grid-cols-2 md:items-end">
        <div>
          <SectionLabel className="mb-4">Themes</SectionLabel>
          <h2 className="text-[36px] font-semibold leading-[1.15] tracking-tight text-ink">
            Change how it looks. Never rewrite what it says.
          </h2>
        </div>
        <p className="max-w-[640px] text-[16px] leading-[1.65] text-ink-soft md:justify-self-end">
          Themes control colors, typography, and layout — nothing else. Switch a course
          from a minimal white look to something warm and editorial in one click. The
          content you wrote doesn’t move.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-whisper bg-whisper sm:grid-cols-2 md:grid-cols-3">
        {themes.map((t) => (
          <div
            key={t.name}
            className="flex items-center justify-between bg-canvas px-5 py-5"
          >
            <div>
              <div className="text-[15px] font-semibold leading-tight text-ink">
                {t.name}
              </div>
              <div className="mt-1 text-[13px] text-ink-soft">{t.note}</div>
            </div>
            <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── AI Capabilities ─────────────────────────────────────────────────────────

function Capabilities() {
  const items = [
    {
      title: 'Generate a lesson.',
      body: 'From a topic and audience, AYUAI drafts a full lesson — title, summary, script, demo steps, common mistakes, and a pro tip.',
    },
    {
      title: 'Rewrite in your tone.',
      body: 'Drop any paragraph in. AYUAI rewrites it against your captured voice — subtle enough not to sound rewritten.',
    },
    {
      title: 'Structure messy notes.',
      body: 'Paste rough notes or bullets. AYUAI groups, orders, and headlines them into a teachable outline you can refine.',
    },
    {
      title: 'Expand to full teaching.',
      body: 'Turn a list of bullets into full prose — each point explained in the style a teacher would actually use.',
    },
    {
      title: 'Build a teaching flow.',
      body: 'Convert a lesson into a sequence of cards with spoken cues and what to watch for — ready for a live or recorded class.',
    },
    {
      title: 'Improve any section.',
      body: 'One click per block to tighten, clarify, or soften. Works on the selected section only — nothing else gets touched.',
    },
  ];
  return (
    <Section id="capabilities">
      <SectionHeader
        label="Capabilities"
        title="The writing work, already done."
      />
      <div className="grid gap-x-12 gap-y-12 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.title}>
            <h3 className="mb-3 text-[17px] font-semibold leading-[1.4] text-ink">
              {item.title}
            </h3>
            <p className="max-w-[640px] text-[15px] leading-[1.65] text-ink-soft">
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── Relatable ───────────────────────────────────────────────────────────────

function Relatable() {
  const reassurances = [
    'No templates to fill in before you start.',
    'No pre-planned module maps required.',
    'Every AI draft is editable, never locked.',
    'If you can write how you’d explain it, AYUAI can build the course.',
  ];
  return (
    <Section>
      <div className="mx-auto max-w-[900px] text-center">
        <SectionLabel className="mb-4">For teachers, not course designers</SectionLabel>
        <h2 className="mx-auto max-w-[720px] text-[40px] font-semibold leading-[1.15] tracking-tight text-ink">
          You don’t need to be an expert at building courses.
        </h2>
        <p className="mx-auto mt-6 max-w-[640px] text-[17px] leading-[1.65] text-ink-soft">
          Most people teaching online aren’t instructional designers. AYUAI handles the
          structure, the pacing, and the rewrites. You bring what you actually know.
        </p>
        <ul className="mx-auto mt-12 grid max-w-[760px] gap-3 text-left sm:grid-cols-2">
          {reassurances.map((r) => (
            <li
              key={r}
              className="flex items-start gap-3 rounded-lg border border-whisper px-4 py-3 text-[14px] leading-[1.55] text-ink-soft"
            >
              <span
                className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ink"
                aria-hidden="true"
              />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

// ── Final CTA ───────────────────────────────────────────────────────────────

function FinalCTA({ onEnterWorkspace }) {
  return (
    <section className="py-[96px]">
      <div className="mx-auto max-w-[780px] px-8 text-center">
        <h2 className="text-[44px] font-semibold leading-[1.1] tracking-tight text-ink">
          Start with a topic. Ship a course.
        </h2>
        <p className="mx-auto mt-6 max-w-[560px] text-[17px] leading-[1.65] text-ink-soft">
          One writing sample, one topic, one theme. You can edit, rewrite, or start over
          at any point — nothing gets locked in.
        </p>
        <div className="mt-10">
          <button
            type="button"
            onClick={onEnterWorkspace}
            className="h-12 rounded-lg bg-ink px-7 text-[14px] font-medium text-canvas transition hover:opacity-90"
          >
            Create a course
          </button>
        </div>
      </div>
    </section>
  );
}

// ── Footer ──────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-whisper">
      <div className="mx-auto flex max-w-[1100px] flex-col items-center justify-between gap-4 px-8 py-8 md:flex-row">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-ink">
            <span className="text-[11px] font-semibold leading-none text-canvas">A</span>
          </div>
          <span className="text-[13px] font-medium tracking-tight">AYUAI Studio</span>
        </div>
        <div className="text-[12px] text-ink-soft">
          © {new Date().getFullYear()} AYUAI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

// ── Shared primitives ───────────────────────────────────────────────────────

function Section({ id, children }) {
  return (
    <section
      id={id}
      className="border-b border-whisper py-[72px]"
    >
      <div className="mx-auto max-w-[1100px] px-8">{children}</div>
    </section>
  );
}

function SectionHeader({ label, title }) {
  return (
    <div className="mb-12 max-w-[640px]">
      <SectionLabel className="mb-4">{label}</SectionLabel>
      <h2 className="text-[36px] font-semibold leading-[1.15] tracking-tight text-ink">
        {title}
      </h2>
    </div>
  );
}

function SectionLabel({ children, className = '' }) {
  // 12px uppercase, text-ink-soft (#6B7280 inside data-page="home" scope).
  // No decorative tracking beyond the standard uppercase label feel.
  return (
    <div
      className={`text-[12px] font-medium uppercase tracking-[0.08em] text-ink-soft ${className}`}
    >
      {children}
    </div>
  );
}
