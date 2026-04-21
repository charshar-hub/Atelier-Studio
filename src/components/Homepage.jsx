// AYUAI Studio marketing homepage.
// Neutral, minimal, elegant — no hype, no generic SaaS copy. Structure:
// NavBar → Hero → What AYUAI Does → How It Works → Theme System →
// AI Capabilities → Relatable → Final CTA → Footer.

export default function Homepage({ onEnterWorkspace }) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-canvas text-ink">
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
    <nav className="sticky top-0 z-30 border-b border-whisper/60 bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between px-8">
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
              href="#how-it-works"
              className="text-[13px] leading-none text-ink-soft transition hover:text-ink"
            >
              How it works
            </a>
            <a
              href="#themes"
              className="text-[13px] leading-none text-ink-soft transition hover:text-ink"
            >
              Themes
            </a>
            <a
              href="#capabilities"
              className="text-[13px] leading-none text-ink-soft transition hover:text-ink"
            >
              Capabilities
            </a>
          </div>
        </div>

        <button
          type="button"
          onClick={onEnterWorkspace}
          className="h-9 rounded-md bg-ink px-4 text-[12px] tracking-wide text-canvas transition hover:bg-accent-deep"
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
    <section className="border-b border-whisper/60">
      <div className="mx-auto flex max-w-[1100px] flex-col items-center px-8 pb-24 pt-24 text-center">
        <div className="mb-6 text-[10px] uppercase tracking-[0.3em] text-accent">
          AYUAI · Course Studio
        </div>
        <h1 className="font-serif text-[56px] leading-[1.05] tracking-tight text-ink md:text-[68px]">
          Turn what you know into a course
          <br />
          that sounds like you.
        </h1>
        <p className="mt-7 max-w-[620px] text-[17px] leading-[1.65] text-ink-soft">
          AYUAI captures your teaching voice, drafts structured lessons around it, and
          gives you a library of themes to shape how students see the result — without
          rewriting a word.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onEnterWorkspace}
            className="h-11 rounded-md bg-ink px-6 text-[13px] tracking-wide text-canvas transition hover:bg-accent-deep"
          >
            Start a course
          </button>
          <a
            href="#how-it-works"
            className="flex h-11 items-center rounded-md border border-whisper bg-transparent px-6 text-[13px] tracking-wide text-ink-soft transition hover:bg-paper hover:text-ink"
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
      eyebrow: '01 · Voice',
      title: 'Capture how you teach.',
      body: 'Paste a script, a caption, or anything you’ve written. AYUAI analyzes your tone, sentence rhythm, and signature phrases once — then reuses that voice across every lesson.',
    },
    {
      eyebrow: '02 · Content',
      title: 'Generate structured lessons.',
      body: 'Describe the topic, the audience, and the goal. AYUAI drafts lesson titles, outlines, scripts, demo steps, and common mistakes — already written in your voice.',
    },
    {
      eyebrow: '03 · Presentation',
      title: 'Present with themes.',
      body: 'Choose a theme built for your audience — beauty, education, wellness, or minimal. Switch any time. Your content stays put; only the look changes.',
    },
  ];
  return (
    <section className="border-b border-whisper/60 py-24">
      <div className="mx-auto max-w-[1100px] px-8">
        <div className="mb-14 max-w-[640px]">
          <div className="mb-3 text-[10px] uppercase tracking-[0.28em] text-accent">
            What AYUAI does
          </div>
          <h2 className="font-serif text-[38px] leading-[1.15] tracking-tight text-ink">
            Three things, done cleanly.
          </h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {items.map((item) => (
            <div key={item.eyebrow} className="flex flex-col">
              <div className="mb-3 text-[10px] uppercase tracking-[0.22em] text-ink-muted">
                {item.eyebrow}
              </div>
              <h3 className="mb-3 font-serif text-[22px] leading-[1.25] tracking-tight text-ink">
                {item.title}
              </h3>
              <p className="text-[14.5px] leading-[1.7] text-ink-soft">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How It Works ────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      n: '1',
      title: 'Define your teaching style.',
      body: 'Share one writing sample — a page, a caption, or a few paragraphs. AYUAI reads it and builds a reusable voice profile you can refine any time.',
    },
    {
      n: '2',
      title: 'Generate the course.',
      body: 'Describe your topic, your audience, and what you want them to walk away knowing. AYUAI drafts the modules and lessons as a full working outline.',
    },
    {
      n: '3',
      title: 'Apply a theme and publish.',
      body: 'Pick a theme that matches the audience. Preview it. Edit anything that needs a second pass. Share with students or export when ready.',
    },
  ];
  return (
    <section id="how-it-works" className="border-b border-whisper/60 py-24">
      <div className="mx-auto max-w-[1100px] px-8">
        <div className="mb-14 max-w-[640px]">
          <div className="mb-3 text-[10px] uppercase tracking-[0.28em] text-accent">
            How it works
          </div>
          <h2 className="font-serif text-[38px] leading-[1.15] tracking-tight text-ink">
            Three steps, no project planning.
          </h2>
        </div>
        <ol className="grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <li
              key={step.n}
              className="rounded-lg border border-whisper bg-paper/50 p-7"
            >
              <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-full border border-whisper bg-canvas font-serif italic text-[15px] text-ink">
                {step.n}
              </div>
              <h3 className="mb-2 font-serif text-[20px] leading-[1.3] tracking-tight text-ink">
                {step.title}
              </h3>
              <p className="text-[14px] leading-[1.7] text-ink-soft">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ── Theme System ────────────────────────────────────────────────────────────

function ThemeSystemSection() {
  const themes = [
    { name: 'Beauty Pro', note: 'Warm cream, camel accent' },
    { name: 'Minimal Dark', note: 'Near black, high contrast' },
    { name: 'Education Classic', note: 'Slate, blue accent' },
    { name: 'Wellness Calm', note: 'Sage green, airy' },
    { name: 'Creator Clean', note: 'White, grid-aligned' },
    { name: 'Editorial', note: 'Terracotta, magazine-style' },
  ];
  return (
    <section id="themes" className="border-b border-whisper/60 py-24">
      <div className="mx-auto max-w-[1100px] px-8">
        <div className="mb-14 grid gap-8 md:grid-cols-[1fr_1fr] md:items-end">
          <div className="max-w-[520px]">
            <div className="mb-3 text-[10px] uppercase tracking-[0.28em] text-accent">
              Themes
            </div>
            <h2 className="font-serif text-[38px] leading-[1.15] tracking-tight text-ink">
              Change how it looks.
              <br />
              Never rewrite what it says.
            </h2>
          </div>
          <p className="max-w-[460px] text-[15px] leading-[1.7] text-ink-soft md:justify-self-end">
            Themes control colors, typography, and layout — nothing else. Switch a course
            from a minimal white look to something warm and editorial in one click. The
            content you wrote doesn’t move.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {themes.map((t) => (
            <div
              key={t.name}
              className="flex items-center justify-between rounded-lg border border-whisper bg-paper/40 px-5 py-4"
            >
              <div>
                <div className="font-serif text-[16px] leading-[1.2] text-ink">
                  {t.name}
                </div>
                <div className="mt-1 text-[12px] text-ink-muted">{t.note}</div>
              </div>
              <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
            </div>
          ))}
        </div>
      </div>
    </section>
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
    <section id="capabilities" className="border-b border-whisper/60 py-24">
      <div className="mx-auto max-w-[1100px] px-8">
        <div className="mb-14 max-w-[640px]">
          <div className="mb-3 text-[10px] uppercase tracking-[0.28em] text-accent">
            Capabilities
          </div>
          <h2 className="font-serif text-[38px] leading-[1.15] tracking-tight text-ink">
            The writing work, already done.
          </h2>
        </div>
        <div className="grid gap-x-10 gap-y-10 md:grid-cols-2">
          {items.map((item) => (
            <div key={item.title} className="flex gap-4">
              <span
                className="mt-[11px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent"
                aria-hidden="true"
              />
              <div>
                <h3 className="mb-1.5 font-serif text-[19px] leading-[1.3] tracking-tight text-ink">
                  {item.title}
                </h3>
                <p className="text-[14px] leading-[1.7] text-ink-soft">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
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
    <section className="border-b border-whisper/60 py-24">
      <div className="mx-auto max-w-[900px] px-8 text-center">
        <div className="mb-3 text-[10px] uppercase tracking-[0.28em] text-accent">
          For teachers, not course designers
        </div>
        <h2 className="mx-auto max-w-[680px] font-serif text-[36px] leading-[1.2] tracking-tight text-ink md:text-[44px]">
          You don’t need to be an expert at building courses.
        </h2>
        <p className="mx-auto mt-6 max-w-[620px] text-[16px] leading-[1.7] text-ink-soft">
          Most people teaching online aren’t instructional designers. AYUAI handles the
          structure, the pacing, and the rewrites. You bring what you actually know.
        </p>
        <ul className="mx-auto mt-10 grid max-w-[720px] gap-3 text-left sm:grid-cols-2">
          {reassurances.map((r) => (
            <li
              key={r}
              className="flex items-start gap-3 rounded-lg border border-whisper bg-paper/40 px-4 py-3 text-[14px] leading-[1.55] text-ink-soft"
            >
              <span
                className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent"
                aria-hidden="true"
              />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── Final CTA ───────────────────────────────────────────────────────────────

function FinalCTA({ onEnterWorkspace }) {
  return (
    <section className="py-28">
      <div className="mx-auto max-w-[780px] px-8 text-center">
        <h2 className="font-serif text-[44px] leading-[1.1] tracking-tight text-ink md:text-[52px]">
          Start with a topic.
          <br />
          Ship a course.
        </h2>
        <p className="mx-auto mt-6 max-w-[520px] text-[16px] leading-[1.7] text-ink-soft">
          One writing sample, one topic, one theme. You can edit, rewrite, or start over
          at any point — nothing gets locked in.
        </p>
        <div className="mt-10">
          <button
            type="button"
            onClick={onEnterWorkspace}
            className="h-12 rounded-md bg-ink px-7 text-[13.5px] tracking-wide text-canvas transition hover:bg-accent-deep"
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
    <footer className="border-t border-whisper bg-paper/40">
      <div className="mx-auto flex max-w-[1100px] flex-col items-center justify-between gap-4 px-8 py-10 md:flex-row">
        <div className="flex items-center">
          <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-accent">
            <span className="font-serif italic text-[13px] leading-none text-canvas">
              a
            </span>
          </div>
          <span className="ml-2 font-serif text-[14px] tracking-wide">AYUAI</span>
          <span className="ml-2 text-[10px] tracking-[0.2em] text-ink-muted">STUDIO</span>
        </div>
        <div className="text-[12px] text-ink-muted">
          © {new Date().getFullYear()} AYUAI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
