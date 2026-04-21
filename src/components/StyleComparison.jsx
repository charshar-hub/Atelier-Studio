import { blockToPlainText } from '../lib/blockTypes';

export default function StyleComparison({ before, after, styleLabel, onApply, onCancel }) {
  const rows = buildRows(before, after);
  const hasChanges = rows.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 p-6 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-[min(980px,95vw)] flex-col overflow-hidden rounded-[14px] border border-whisper bg-paper shadow-2xl">
        <header className="border-b border-whisper px-7 py-5">
          <div className="mb-1 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-[10px] tracking-[0.25em] text-accent">PREVIEW · NOT YET APPLIED</span>
          </div>
          <h2 className="font-serif text-[26px] leading-[1.2] tracking-tight text-ink">
            Preview the rewrite
          </h2>
          <p className="mt-1.5 text-[13px] leading-[1.6] text-ink-soft">
            {styleLabel
              ? `Showing changes in the ${styleLabel.toLowerCase()} voice.`
              : 'Showing how Match my style would change this lesson.'}{' '}
            Nothing is saved until you click <span className="font-medium text-ink">Apply changes</span>.
          </p>
        </header>

        <div className="flex-1 overflow-y-auto px-7 py-5">
          {hasChanges ? (
            <div className="space-y-5">
              {rows.map((row) => (
                <FieldRow key={row.key} {...row} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-10 text-[14px] italic text-ink-muted">
              No changes suggested — the rewrite matches the current content.
            </div>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-whisper bg-canvas/40 px-7 py-4">
          <button
            onClick={onCancel}
            className="h-9 rounded-md border border-whisper bg-transparent px-4 text-[13px] tracking-wide text-ink transition hover:bg-paper"
          >
            Cancel
          </button>
          <button
            onClick={onApply}
            disabled={!hasChanges}
            className="h-9 rounded-md bg-ink px-5 text-[13px] tracking-wide text-canvas transition hover:bg-[#2A1F18] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Apply changes
          </button>
        </footer>
      </div>
    </div>
  );
}

function FieldRow({ label, before, after }) {
  return (
    <div>
      <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-ink-muted">{label}</div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Panel tone="before">{before || <Empty />}</Panel>
        <Panel tone="after">
          <DiffText before={before} after={after} />
        </Panel>
      </div>
    </div>
  );
}

function Panel({ tone, children }) {
  const isAfter = tone === 'after';
  return (
    <div
      className={`rounded-lg border px-4 py-3 ${
        isAfter ? 'border-accent/40 bg-white' : 'border-whisper bg-canvas'
      }`}
    >
      <div
        className={`mb-1.5 text-[10px] uppercase tracking-[0.18em] ${
          isAfter ? 'text-accent' : 'text-ink-muted'
        }`}
      >
        {isAfter ? 'After' : 'Before'}
      </div>
      <div className="text-[14px] leading-[1.7] text-ink-soft">{children}</div>
    </div>
  );
}

function Empty() {
  return <span className="italic text-ink-muted">(empty)</span>;
}

function DiffText({ before, after }) {
  if (!after) return <Empty />;
  const segments = wordDiff(before || '', after);
  return (
    <span className="text-ink">
      {segments.map((seg, i) =>
        seg.changed ? (
          <span key={i} className="font-semibold text-accent-deep">
            {seg.text}
          </span>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </span>
  );
}

function buildRows(before, after) {
  if (!before || !after) return [];
  const base = [
    { key: 'title', label: 'Title', before: before.title, after: after.title },
    { key: 'duration', label: 'Duration', before: before.duration, after: after.duration },
    { key: 'summary', label: 'Summary', before: before.summary, after: after.summary },
  ];
  const beforeBlocks = Array.isArray(before.blocks) ? before.blocks : [];
  const afterBlocks = Array.isArray(after.blocks) ? after.blocks : [];
  // Diff block content by index. Block order is preserved across an AI merge,
  // so index is a good key. Labels surface the block's role (or type) so the
  // reader can see which section changed.
  const blockRows = beforeBlocks.map((b, i) => ({
    key: `b-${i}`,
    label: b.role || b.type,
    before: blockToPlainText(b),
    after: afterBlocks[i] ? blockToPlainText(afterBlocks[i]) : '',
  }));
  return [...base, ...blockRows].filter((r) => (r.before || '') !== (r.after || ''));
}

// Word-level LCS diff — marks tokens in `after` that are new relative to `before`.
function wordDiff(before, after) {
  const b = before.split(/(\s+)/);
  const a = after.split(/(\s+)/);
  const m = b.length;
  const n = a.length;
  const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = b[i - 1] === a[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const out = [];
  let i = m;
  let j = n;
  while (j > 0) {
    if (i > 0 && b[i - 1] === a[j - 1]) {
      out.unshift({ text: a[j - 1], changed: false });
      i--;
      j--;
    } else {
      out.unshift({ text: a[j - 1], changed: true });
      j--;
    }
  }
  return out;
}
