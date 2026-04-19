import { sidebarWorkspace, sidebarVoice } from '../data/dummyData';

export default function Sidebar({ active, onSelect }) {
  return (
    <aside className="flex w-[220px] flex-col border-r border-whisper bg-paper px-3.5 py-5">
      <SectionLabel>Workspace</SectionLabel>
      {sidebarWorkspace.map((item) => (
        <NavItem
          key={item.key}
          item={item}
          active={active === item.key}
          onClick={() => onSelect(item.key)}
        />
      ))}

      <div className="my-3 mx-1.5 h-px bg-whisper" />

      <SectionLabel>Your Voice</SectionLabel>
      {sidebarVoice.map((item) => (
        <NavItem
          key={item.key}
          item={item}
          active={active === item.key}
          onClick={() => onSelect(item.key)}
        />
      ))}
    </aside>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="px-2.5 py-2 text-[10px] uppercase tracking-[0.2em] text-ink-muted">
      {children}
    </div>
  );
}

function NavItem({ item, active, onClick }) {
  const isDisabled = Boolean(item.disabled);

  const className = `mb-0.5 flex items-center rounded-md px-2.5 py-2 text-left text-[14px] transition ${
    isDisabled
      ? 'cursor-not-allowed border border-transparent text-ink-faint'
      : active
        ? 'border border-whisper bg-canvas font-medium'
        : 'border border-transparent hover:bg-whisper/50'
  }`;

  return (
    <button
      type="button"
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      aria-disabled={isDisabled || undefined}
      title={isDisabled ? 'Coming soon' : undefined}
      className={className}
    >
      <span className="flex-1">{item.label}</span>
      {isDisabled && item.hint ? (
        <span className="rounded-full border border-whisper bg-canvas px-1.5 py-px text-[9px] uppercase tracking-[0.15em] text-ink-muted">
          {item.hint}
        </span>
      ) : (
        <>
          {item.count !== undefined && (
            <span className="rounded-full bg-whisper px-1.5 py-px text-[10px] text-ink-muted">
              {item.count}
            </span>
          )}
          {item.dot && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
        </>
      )}
    </button>
  );
}
