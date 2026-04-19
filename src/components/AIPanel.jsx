import { generateActions, refineActions } from '../data/dummyData';

const ACTION_MODE_MAP = {
  'g-demo': 'demoSteps',
  'r-improve': 'improve',
  'r-tone': 'rewrite',
  'r-simplify': 'simplify',
};

const ACTION_LOADING_LABELS = {
  'g-demo': 'Generating steps…',
  'r-improve': 'Improving…',
  'r-tone': 'Rewriting…',
  'r-simplify': 'Simplifying…',
};

export default function AIPanel({
  onGenerateLesson,
  onMatchStyle,
  onAIAction,
  onStructureLesson,
  onExpandLesson,
  styleProfile,
  canMatchStyle,
  canExpand,
  isGenerating,
  isMatchingStyle,
  isStructuring,
  isExpanding,
  inFlightAIActions,
  lastChange,
}) {
  const inFlight = inFlightAIActions || new Set();

  const handlers = {
    'g-lesson': onGenerateLesson,
    'g-structure': onStructureLesson,
    'r-style': onMatchStyle,
    'r-expand': onExpandLesson,
  };
  for (const [key, mode] of Object.entries(ACTION_MODE_MAP)) {
    handlers[key] = onAIAction ? () => onAIAction(mode) : undefined;
  }

  const disabledKeys = new Set();
  if (!canMatchStyle) {
    // Style/refine actions, structure, and expand all target the selected lesson
    disabledKeys.add('r-style');
    disabledKeys.add('g-structure');
    disabledKeys.add('r-expand');
    for (const key of Object.keys(ACTION_MODE_MAP)) disabledKeys.add(key);
  }
  if (!canExpand) disabledKeys.add('r-expand');
  if (isGenerating) disabledKeys.add('g-lesson');
  if (isMatchingStyle) disabledKeys.add('r-style');
  if (isStructuring) disabledKeys.add('g-structure');
  if (isExpanding) disabledKeys.add('r-expand');
  for (const [key, mode] of Object.entries(ACTION_MODE_MAP)) {
    if (inFlight.has(mode)) disabledKeys.add(key);
  }

  const labelOverrides = {
    'g-lesson': isGenerating ? 'Generating…' : undefined,
    'g-structure': isStructuring ? 'Structuring…' : undefined,
    'r-style': isMatchingStyle ? 'Applying style…' : undefined,
    'r-expand': isExpanding ? 'Expanding…' : undefined,
  };
  for (const [key, mode] of Object.entries(ACTION_MODE_MAP)) {
    if (inFlight.has(mode)) labelOverrides[key] = ACTION_LOADING_LABELS[key];
  }

  const loadingKeySet = new Set();
  if (isGenerating) loadingKeySet.add('g-lesson');
  if (isStructuring) loadingKeySet.add('g-structure');
  if (isMatchingStyle) loadingKeySet.add('r-style');
  if (isExpanding) loadingKeySet.add('r-expand');
  for (const [key, mode] of Object.entries(ACTION_MODE_MAP)) {
    if (inFlight.has(mode)) loadingKeySet.add(key);
  }

  const subLabels = {};

  return (
    <aside className="flex w-[300px] flex-col border-l border-whisper bg-paper px-5 py-6">
      <div>
        <div className="mb-1 text-[10px] tracking-[0.25em] text-accent">ASSISTANT</div>
        <h3 className="font-serif text-[24px] tracking-tight text-ink">AI Actions</h3>
        <p className="mt-1.5 text-[13px] leading-[1.6] text-ink-soft">
          Applied to the selected lesson
        </p>
        <p className="mt-3 font-serif text-[15px] italic leading-[1.55] text-ink-soft">
          Want it to sound even more like you? Add more writing in Style Kit anytime.
        </p>
      </div>

      <ActionGroup
        title="Generate"
        actions={generateActions}
        handlers={handlers}
        disabledKeys={disabledKeys}
        subLabels={subLabels}
        labelOverrides={labelOverrides}
        loadingKeys={loadingKeySet}
      />
      <ActionGroup
        title="Refine"
        actions={refineActions}
        handlers={handlers}
        disabledKeys={disabledKeys}
        subLabels={subLabels}
        labelOverrides={labelOverrides}
        loadingKeys={loadingKeySet}
      />

      {/* Footer card: most recent change, or captured voice preview as fallback */}
      {lastChange ? (
        <LastChangeCard change={lastChange} />
      ) : styleProfile ? (
        <div className="mt-auto rounded-lg border border-whisper bg-canvas p-4">
          <div className="mb-2.5 flex items-center">
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-[10px] tracking-[0.2em] text-ink-muted">YOUR STYLE</span>
          </div>
          <p className="font-serif italic text-[16px] leading-[1.5] text-ink">
            {styleProfile.summary ||
              (Array.isArray(styleProfile.toneTags) && styleProfile.toneTags.length > 0
                ? styleProfile.toneTags.join(', ')
                : styleProfile.tone || 'Captured voice')}
          </p>
          {Array.isArray(styleProfile.toneTags) && styleProfile.toneTags.length > 0 && (
            <p className="mt-1 text-[13px] leading-[1.6] text-ink-soft">
              {styleProfile.toneTags.slice(0, 4).join(' · ')}
            </p>
          )}
          {(styleProfile.signaturePhrases || []).length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1">
              {styleProfile.signaturePhrases.slice(0, 2).map((p) => (
                <span
                  key={p}
                  className="rounded-full border border-whisper bg-paper px-2 py-0.5 font-serif text-[13px] italic text-ink-soft"
                >
                  “{p}”
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-auto rounded-lg border border-whisper bg-canvas p-4">
          <div className="mb-2.5 flex items-center">
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-ink-muted/40" />
            <span className="text-[10px] tracking-[0.2em] text-ink-muted">NO CHANGES YET</span>
          </div>
          <p className="text-[13.5px] leading-[1.6] text-ink-soft">
            Your most recent edit will appear here.
          </p>
        </div>
      )}
    </aside>
  );
}

function ActionGroup({
  title,
  actions,
  handlers,
  disabledKeys,
  subLabels,
  labelOverrides = {},
  loadingKeys,
}) {
  return (
    <div className="mt-5">
      <div className="mb-2.5 px-1 text-[10px] uppercase tracking-[0.2em] text-ink-muted">
        {title}
      </div>
      <div>
        {actions.map((action) => (
          <AIActionButton
            key={action.key}
            action={action}
            onClick={handlers[action.key]}
            disabled={disabledKeys.has(action.key)}
            subLabel={subLabels[action.key]}
            labelOverride={labelOverrides[action.key]}
            loading={loadingKeys?.has(action.key) || false}
          />
        ))}
      </div>
    </div>
  );
}

function AIActionButton({ action, onClick, disabled, subLabel, labelOverride, loading }) {
  const base =
    'mb-1.5 flex w-full items-center rounded-lg px-3.5 py-2.5 text-left text-[13px] tracking-wide transition disabled:cursor-not-allowed disabled:opacity-70';

  const label = labelOverride || action.label;

  const content = (
    <>
      {loading && (
        <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-canvas/40 border-t-canvas" />
      )}
      <span className="flex-1">{label}</span>
      {subLabel && !loading && (
        <span className="ml-2 text-[10px] italic tracking-normal opacity-70">{subLabel}</span>
      )}
    </>
  );

  if (action.primary) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${base} bg-ink text-canvas hover:bg-[#2A1F18]`}
      >
        {content}
      </button>
    );
  }

  if (action.highlight) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${base} border border-rose bg-canvas text-ink hover:bg-white`}
      >
        {loading && (
          <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
        )}
        <span className="flex-1">{label}</span>
        {!loading &&
          (subLabel ? (
            <span className="ml-2 text-[10px] italic tracking-normal text-ink-muted">
              {subLabel}
            </span>
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          ))}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} border border-whisper bg-canvas text-ink hover:bg-white`}
    >
      {content}
    </button>
  );
}

function LastChangeCard({ change }) {
  return (
    <div className="mt-auto rounded-lg border border-whisper bg-canvas p-4">
      <div className="mb-2.5 flex items-center">
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
        <span className="text-[10px] tracking-[0.2em] text-ink-muted">LAST CHANGE</span>
      </div>
      <p className="font-serif text-[16px] leading-[1.4] text-ink line-clamp-3 [overflow-wrap:anywhere]">
        {change.action}
        {change.lessonTitle && (
          <>
            {' — '}
            <span className="italic">“{change.lessonTitle}”</span>
          </>
        )}
      </p>
      <p className="mt-1.5 text-[11px] tracking-wide text-ink-soft">
        {formatRelativeTime(change.timestamp)}
      </p>
    </div>
  );
}

function formatRelativeTime(ts) {
  if (!ts) return 'just now';
  const diff = Math.max(0, Date.now() - ts);
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}
