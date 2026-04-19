import { useEffect, useState } from 'react';

export default function Dashboard({
  courses,
  isLoading,
  error,
  onOpenCourse,
  onCreateCourse,
  onDeleteCourse,
  onRenameCourse,
  onDuplicateCourse,
  onGoHome,
  isConfigured,
}) {
  return (
    <main className="flex-1 overflow-y-auto bg-canvas px-14 py-10">
      {onGoHome && (
        <button
          type="button"
          onClick={onGoHome}
          className="mb-4 flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-ink-muted transition hover:bg-whisper/60 hover:text-ink"
        >
          <span aria-hidden="true">←</span>
          <span>Home</span>
        </button>
      )}

      <header className="mb-8 flex items-end justify-between gap-6">
        <div>
          <div className="mb-2 text-[10px] tracking-[0.25em] text-accent">WORKSPACE</div>
          <h1 className="mb-2 font-serif text-[40px] leading-[1.1] tracking-tight text-ink">
            Your courses
          </h1>
          <p className="max-w-[600px] text-[15px] leading-[1.7] text-ink-soft">
            Every course you build lives here. Pick one to continue, or start something new.
          </p>
        </div>
        <button
          onClick={onCreateCourse}
          disabled={!isConfigured}
          className="h-10 rounded-md bg-ink px-5 text-[13px] tracking-wide text-canvas transition hover:bg-[#2A1F18] disabled:cursor-not-allowed disabled:opacity-50"
        >
          + Create new course
        </button>
      </header>

      {!isConfigured && <SetupNotice />}

      {isConfigured && error && (
        <div className="mb-6 rounded-lg border border-rose bg-white px-5 py-4 text-[13px] text-ink">
          <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-accent">Error</div>
          {error}
        </div>
      )}

      {isConfigured && isLoading && (
        <div className="flex items-center justify-center py-16 text-[14px] italic text-ink-muted">
          Loading your courses…
        </div>
      )}

      {isConfigured && !isLoading && !error && courses.length === 0 && (
        <EmptyState onCreateCourse={onCreateCourse} />
      )}

      {isConfigured && !isLoading && courses.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onOpen={() => onOpenCourse(course.id)}
              onDelete={onDeleteCourse ? () => onDeleteCourse(course.id) : undefined}
              onRename={
                onRenameCourse ? (title) => onRenameCourse(course.id, title) : undefined
              }
              onDuplicate={
                onDuplicateCourse ? () => onDuplicateCourse(course.id) : undefined
              }
            />
          ))}
        </div>
      )}
    </main>
  );
}

function CourseCard({ course, onOpen, onDelete, onRename, onDuplicate }) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [titleDraft, setTitleDraft] = useState(course.title || '');

  useEffect(() => {
    if (!isRenaming) setTitleDraft(course.title || '');
  }, [course.title, isRenaming]);

  const startRename = (e) => {
    e.stopPropagation();
    setTitleDraft(course.title || '');
    setIsRenaming(true);
  };

  const commitRename = () => {
    setIsRenaming(false);
    const trimmed = titleDraft.trim() || 'Untitled course';
    if (trimmed !== (course.title || '')) {
      onRename?.(trimmed);
    } else {
      setTitleDraft(course.title || '');
    }
  };

  const cancelRename = () => {
    setTitleDraft(course.title || '');
    setIsRenaming(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitRename();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelRename();
    }
  };

  return (
    <div
      onClick={isRenaming ? undefined : onOpen}
      className={`group relative rounded-[12px] border border-whisper bg-white p-6 transition ${
        isRenaming
          ? 'cursor-default border-accent/40 shadow-[0_0_0_3px_rgba(184,147,106,0.08)]'
          : 'cursor-pointer hover:border-[#D4C5B0] hover:shadow-[0_2px_12px_rgba(58,46,38,0.06)]'
      }`}
    >
      {!isRenaming && (
        <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
          {onRename && <ActionPill onClick={startRename} label="Rename" />}
          {onDuplicate && (
            <ActionPill
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              label="Duplicate"
            />
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this course? This cannot be undone.')) onDelete();
              }}
              aria-label="Delete course"
              className="flex h-7 w-7 items-center justify-center rounded-full text-ink-muted transition hover:bg-whisper hover:text-ink"
            >
              <span className="text-base leading-none">×</span>
            </button>
          )}
        </div>
      )}

      <div className="mb-3 text-[10px] tracking-[0.25em] text-accent">COURSE</div>

      {isRenaming ? (
        <input
          type="text"
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          autoFocus
          className="mb-2 w-full rounded-md border border-accent/40 bg-white px-2 py-1 font-serif text-[22px] leading-[1.25] tracking-tight text-ink focus:border-accent focus:outline-none"
        />
      ) : (
        <h3 className="mb-2 pr-2 font-serif text-[22px] leading-[1.25] tracking-tight text-ink">
          {course.title || 'Untitled course'}
        </h3>
      )}

      <div className="text-[12px] text-ink-soft">
        Last updated {formatRelative(course.updated_at)}
      </div>
    </div>
  );
}

function ActionPill({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-whisper bg-canvas px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] text-ink-soft transition hover:bg-paper hover:text-ink"
    >
      {label}
    </button>
  );
}

function EmptyState({ onCreateCourse }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[12px] border border-dashed border-[#D4C5B0] bg-white py-16 text-center">
      <div className="mb-3 text-[10px] tracking-[0.25em] text-accent">NOTHING HERE YET</div>
      <h2 className="mb-2 font-serif text-[24px] italic text-ink">Your first course awaits</h2>
      <p className="mb-5 max-w-[440px] text-[14px] leading-[1.6] text-ink-soft">
        Build a module-by-module course, rewrite it in your voice, and export it when it's ready.
      </p>
      <button
        onClick={onCreateCourse}
        className="h-10 rounded-md bg-ink px-5 text-[13px] tracking-wide text-canvas transition hover:bg-[#2A1F18]"
      >
        + Create new course
      </button>
    </div>
  );
}

function SetupNotice() {
  return (
    <div className="rounded-[12px] border border-whisper bg-white p-6">
      <div className="mb-2 text-[10px] tracking-[0.25em] text-accent">SETUP REQUIRED</div>
      <h2 className="mb-3 font-serif text-[22px] tracking-tight text-ink">
        Connect your Supabase project
      </h2>
      <p className="mb-4 text-[14px] leading-[1.7] text-ink-soft">
        Add two variables to your <code className="rounded bg-paper px-1.5 py-0.5 text-[12px]">.env</code>{' '}
        file at the project root, then restart <code className="rounded bg-paper px-1.5 py-0.5 text-[12px]">npm run dev</code>:
      </p>
      <pre className="mb-4 overflow-x-auto rounded-md bg-ink px-4 py-3 text-[12px] text-canvas">
{`VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>`}
      </pre>
      <p className="mb-3 text-[13px] leading-[1.7] text-ink-soft">
        Then run this SQL once in the Supabase SQL editor to create the table:
      </p>
      <pre className="overflow-x-auto rounded-md bg-ink px-4 py-3 text-[12px] leading-[1.6] text-canvas">
{`create table courses (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled course',
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table courses enable row level security;
create policy "Anyone can read" on courses for select using (true);
create policy "Anyone can insert" on courses for insert with check (true);
create policy "Anyone can update" on courses for update using (true) with check (true);
create policy "Anyone can delete" on courses for delete using (true);`}
      </pre>
    </div>
  );
}

function formatRelative(iso) {
  if (!iso) return 'just now';
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
