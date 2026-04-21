import { THEME_LIST } from '../themes';

export default function Topbar({
  saveStatus = 'idle',
  onExport,
  onPreview,
  onPresent,
  canPresent = true,
  mode = 'write',
  onChangeMode,
  courseTitle = '',
  courseStatus = 'DRAFT',
  onChangeCourseTitle,
  onBackToDashboard,
  themeId = 'beauty-pro',
  onChangeTheme,
}) {
  return (
    <header className="flex h-14 items-center border-b border-whisper bg-canvas px-5">
      {/* Logo + back */}
      <div className="flex min-w-[220px] items-center">
        <button
          type="button"
          onClick={onBackToDashboard}
          aria-label="Back to dashboard"
          className="group flex items-center rounded-md px-1 py-1 transition hover:bg-whisper/60"
        >
          <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-accent">
            <span className="font-serif italic text-base text-canvas">a</span>
          </div>
          <span className="ml-2 font-serif text-[17px] tracking-wide">AYUAI</span>
          <span className="ml-2 text-[10px] tracking-[0.2em] text-accent">STUDIO</span>
        </button>
        {onBackToDashboard && (
          <button
            type="button"
            onClick={onBackToDashboard}
            className="ml-3 flex items-center gap-1 rounded-md px-2 py-1 text-[12px] text-ink-muted transition hover:bg-whisper/60 hover:text-ink"
          >
            <span aria-hidden="true">←</span>
            <span>Courses</span>
          </button>
        )}
      </div>

      {/* Course name — editable */}
      <div className="flex flex-1 items-center justify-center">
        <div className="flex items-center rounded-full bg-whisper/40 px-4 py-1.5 transition-colors hover:bg-whisper/60 focus-within:bg-whisper/70">
          <svg
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="none"
            className="mr-1.5 text-ink-muted"
          >
            <path
              d="M11 2L14 5L5 14H2V11L11 2Z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            type="text"
            value={courseTitle}
            onChange={(e) => onChangeCourseTitle?.(e.target.value)}
            placeholder="Untitled course"
            className="min-w-0 bg-transparent font-serif text-base tracking-wide placeholder:italic placeholder:text-ink-faint focus:outline-none"
            style={{ width: `${Math.max((courseTitle || 'Untitled course').length, 12)}ch` }}
          />
          <span className="ml-1 text-[10px] tracking-widest text-ink-muted">· {courseStatus}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end">
        <SaveIndicator status={saveStatus} />
        {onChangeTheme && (
          <ThemeSelector themeId={themeId} onChange={onChangeTheme} />
        )}
        {onChangeMode && <ModeToggle mode={mode} onChange={onChangeMode} />}
        <button
          onClick={onPresent}
          disabled={!canPresent}
          title={canPresent ? 'Start Teaching — full-screen' : 'Build a teaching flow first'}
          className="ml-2 h-8 rounded-md bg-ink px-3.5 text-xs tracking-wide text-canvas transition hover:bg-[#2A1F18] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Start Teaching
        </button>
        <button
          onClick={onPreview}
          className="ml-2 h-8 rounded-md border border-whisper bg-transparent px-3.5 text-xs tracking-wide transition hover:bg-paper"
        >
          Preview
        </button>
        <button
          onClick={onExport}
          className="ml-2 h-8 rounded-md border border-whisper bg-transparent px-3.5 text-xs tracking-wide transition hover:bg-paper"
        >
          Export
        </button>
      </div>
    </header>
  );
}

function ThemeSelector({ themeId, onChange }) {
  return (
    <label className="mr-2 flex items-center gap-1.5" title="Course theme">
      <span className="text-[10px] uppercase tracking-[0.18em] text-ink-muted">Theme</span>
      <select
        value={themeId}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 rounded-full border border-whisper bg-transparent px-2.5 text-[11px] tracking-wide text-ink-soft transition hover:bg-paper focus:outline-none"
      >
        {THEME_LIST.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function ModeToggle({ mode, onChange }) {
  const items = [
    { key: 'write', label: 'Write' },
    { key: 'teach', label: 'Teach' },
  ];
  return (
    <div className="ml-1 inline-flex items-center rounded-full border border-whisper bg-paper/40 p-0.5">
      {items.map((item) => {
        const active = mode === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={`rounded-full px-3 py-1 text-[11px] tracking-[0.14em] transition ${
              active
                ? 'bg-white text-ink shadow-[0_1px_2px_rgba(42,31,27,0.06)]'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {item.label.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

function SaveIndicator({ status }) {
  const isSaving = status === 'saving';
  const label =
    status === 'saving'
      ? 'Saving…'
      : status === 'saved'
        ? 'Saved'
        : status === 'error'
          ? 'Save failed'
          : 'Auto-saving';

  return (
    <span className="mr-3 flex items-center text-[11px] text-ink-soft transition-opacity duration-300">
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
          isSaving ? 'animate-pulse bg-accent' : status === 'error' ? 'bg-rose' : 'bg-ink-muted/40'
        }`}
      />
      {label}
    </span>
  );
}
