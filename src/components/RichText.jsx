import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

// Controlled presets — classes must appear as literal strings here so
// Tailwind's content scanner picks them up. The `rt-sz-*` / `rt-color-*`
// prefixes are DOM markers used to detect and unwrap active formatting.
const SIZE_OPTS = [
  {
    key: 'small',
    label: 'Small',
    className: 'rt-sz-small text-[12.5px] leading-[1.6]',
  },
  { key: 'body', label: 'Body', className: '' },
  {
    key: 'large',
    label: 'Large',
    className: 'rt-sz-large text-[18px] leading-[1.55]',
  },
  {
    key: 'heading',
    label: 'Heading',
    className:
      'rt-sz-heading font-serif text-[22px] leading-[1.25] tracking-tight',
  },
];

const COLOR_OPTS = [
  { key: 'default', label: 'Default', className: '' },
  {
    key: 'muted',
    label: 'Muted',
    className: 'rt-color-muted text-ink-muted',
  },
  {
    key: 'accent',
    label: 'Accent',
    className: 'rt-color-accent text-accent',
  },
  {
    key: 'highlight',
    label: 'Highlight',
    className: 'rt-color-highlight bg-paper rounded px-0.5',
  },
];

const SIZE_SELECTOR = '.rt-sz-small, .rt-sz-large, .rt-sz-heading';
const SIZE_CLASS_MAP = {
  small: 'rt-sz-small',
  large: 'rt-sz-large',
  heading: 'rt-sz-heading',
};
const COLOR_SELECTOR =
  '.rt-color-muted, .rt-color-accent, .rt-color-highlight';
const COLOR_CLASS_MAP = {
  muted: 'rt-color-muted',
  accent: 'rt-color-accent',
  highlight: 'rt-color-highlight',
};

const DEFAULT_ACTIVE = {
  bold: false,
  italic: false,
  ul: false,
  ol: false,
  size: 'body',
  color: 'default',
};

export default function RichText({
  value,
  onChange,
  placeholder,
  className,
}) {
  const ref = useRef(null);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(DEFAULT_ACTIVE);

  // Sync external value in only when it differs — avoids caret resets.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const next = value || '';
    if (el.innerHTML !== next) el.innerHTML = next;
  }, [value]);

  const emit = useCallback(() => {
    const el = ref.current;
    if (el) onChange?.(el.innerHTML);
  }, [onChange]);

  const readActive = useCallback(() => {
    const sel = window.getSelection();
    const el = ref.current;
    if (!sel || sel.rangeCount === 0 || !el?.contains(sel.anchorNode)) return;
    setActive(readActiveState(sel, el));
  }, []);

  // Keep formatting state live while focused, so toggles reflect the caret.
  useEffect(() => {
    if (!focused) return;
    document.addEventListener('selectionchange', readActive);
    return () => document.removeEventListener('selectionchange', readActive);
  }, [focused, readActive]);

  const handleInput = () => {
    const el = ref.current;
    if (el) cleanupEmptyNodes(el);
    emit();
    readActive();
  };

  const handleFocus = () => {
    setFocused(true);
    // Seed active state on first focus
    requestAnimationFrame(readActive);
  };

  const handleBlur = (e) => {
    // Ignore blur that went *to* the toolbar — keep it visible so clicks land.
    if (
      e.relatedTarget &&
      e.relatedTarget.closest &&
      e.relatedTarget.closest('[data-rt-toolbar]')
    ) {
      return;
    }
    setFocused(false);
  };

  const exec = (cmd, val = null) => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    document.execCommand(cmd, false, val);
    emit();
    readActive();
  };

  // Deterministic class-based formatting. Extracts the selection (which
  // splits any partially-overlapping marker spans), unwraps any remaining
  // marker spans inside the extracted fragment so nothing stacks, then
  // wraps (or not, for the "default/body" case) and reinserts.
  const applyWrappedFormat = (markerSelector, className) => {
    const sel = window.getSelection();
    const el = ref.current;
    if (
      !sel ||
      sel.rangeCount === 0 ||
      sel.isCollapsed ||
      !el ||
      !el.contains(sel.getRangeAt(0).commonAncestorContainer)
    ) {
      return;
    }
    // Don't let users format whitespace-only / zero-width selections — that's
    // what creates the "ghost" highlight strips with no text.
    if (sel.toString().trim() === '') return;
    const range = sel.getRangeAt(0);

    let frag;
    try {
      frag = range.extractContents();
    } catch {
      return;
    }

    // Unwrap existing marker spans inside the extracted fragment so the new
    // style replaces rather than nests under a competing one.
    const existing = frag.querySelectorAll(markerSelector);
    for (const node of Array.from(existing)) {
      const parent = node.parentNode;
      while (node.firstChild) parent.insertBefore(node.firstChild, node);
      parent.removeChild(node);
    }

    // Track what we're inserting so we can (a) escape marker ancestors and
    // (b) re-select the formatted range after mutation.
    let insertedNodes = [];
    let wrapper = null;
    if (className) {
      wrapper = document.createElement('span');
      wrapper.className = className;
      wrapper.appendChild(frag);
      range.insertNode(wrapper);
      insertedNodes = [wrapper];
    } else if (frag.firstChild) {
      // Capture child list BEFORE insertNode moves them into the DOM (which
      // empties the fragment and clears any references taken off of it).
      insertedNodes = Array.from(frag.childNodes);
      range.insertNode(frag);
    }

    // Critical: if the range was inside a marker span of the type we're
    // stripping, the extraction leaves that span empty and the insert
    // lands back INSIDE it — the style re-applies. Walk up, split out
    // of every matching ancestor so the formatted content sits outside.
    escapeMarkerAncestors(insertedNodes, markerSelector, el);

    // Collapse adjacent text nodes and remove any empties we just created.
    el.normalize();
    cleanupEmptyNodes(el);

    // Restore selection to the formatted range.
    const connected = insertedNodes.filter((n) => n.isConnected);
    if (connected.length > 0) {
      sel.removeAllRanges();
      const r = document.createRange();
      if (wrapper && wrapper.isConnected) {
        r.selectNodeContents(wrapper);
      } else {
        r.setStartBefore(connected[0]);
        r.setEndAfter(connected[connected.length - 1]);
      }
      sel.addRange(r);
    }

    emit();
    readActive();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace') {
      handleBackspace(e);
      if (e.defaultPrevented) return;
    }
    if (!(e.metaKey || e.ctrlKey)) return;
    const k = e.key.toLowerCase();
    // Cmd/Ctrl shortcuts. Intercept so we also run our emit/active logic.
    if (k === 'b') {
      e.preventDefault();
      exec('bold');
    } else if (k === 'i') {
      e.preventDefault();
      exec('italic');
    } else if (k === 'u') {
      // Not part of the toolbar anymore — block the native shortcut so users
      // don't accidentally introduce an underline we can't toggle off.
      e.preventDefault();
    } else if (e.shiftKey && (k === '8' || e.key === '*')) {
      e.preventDefault();
      exec('insertUnorderedList');
    } else if (e.shiftKey && (k === '7' || e.key === '&')) {
      e.preventDefault();
      exec('insertOrderedList');
    }
  };

  // When the user presses Backspace at the start of an empty <li>, the
  // browser doesn't always collapse the list item — we can end up with
  // a stuck, unpopulated bullet. Intercept and remove the empty <li>
  // (and the parent list if we've emptied it).
  const handleBackspace = (e) => {
    const el = ref.current;
    const sel = window.getSelection();
    if (!el || !sel || !sel.isCollapsed || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    let node = range.startContainer;
    if (node?.nodeType === 3) node = node.parentNode;
    const li = node?.closest?.('li');
    if (!li || !el.contains(li)) return;
    if (li.textContent !== '') return;

    e.preventDefault();
    const list = li.parentNode;
    const prevLi = li.previousElementSibling;
    li.remove();

    let listPrev = null;
    if (
      list &&
      (list.tagName === 'UL' || list.tagName === 'OL') &&
      list.children.length === 0
    ) {
      listPrev = list.previousSibling;
      list.remove();
    }

    const newRange = document.createRange();
    const target = prevLi || listPrev || el;
    newRange.selectNodeContents(target);
    newRange.collapse(false);
    sel.removeAllRanges();
    sel.addRange(newRange);

    cleanupEmptyNodes(el);
    emit();
    readActive();
  };

  // Strip all inline formatting (our marker spans + native bold/italic etc.)
  // from the current selection. Keeps plain text and list structure.
  const clearFormatting = () => {
    const sel = window.getSelection();
    const el = ref.current;
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed || !el) return;
    applyWrappedFormat(SIZE_SELECTOR, '');
    applyWrappedFormat(COLOR_SELECTOR, '');
    el.focus();
    try {
      document.execCommand('removeFormat');
    } catch {
      /* ignore */
    }
    cleanupEmptyNodes(el);
    emit();
    readActive();
  };

  const handlePaste = (e) => {
    // Paste as plain text — the only HTML we store comes from the toolbar.
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  return (
    <div className="relative">
      {focused && (
        <DockedToolbar
          active={active}
          onCmd={exec}
          onFormat={applyWrappedFormat}
          onClear={clearFormatting}
        />
      )}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        data-placeholder={placeholder || ''}
        className={`rich-text outline-none ${className || ''}`}
      />
    </div>
  );
}

// Move `nodes` out of any ancestor matching `markerSelector`. Works
// innermost-first: if the immediate parent matches, we lift all nodes
// before that parent, then loop in case there's another matching
// ancestor above. Safety-capped to avoid any pathological case.
function escapeMarkerAncestors(nodes, markerSelector, root) {
  if (!nodes.length) return;
  for (let i = 0; i < 8; i++) {
    const first = nodes.find((n) => n.isConnected);
    if (!first) return;
    const parent = first.parentNode;
    if (!parent || parent === root || parent.nodeType !== 1) return;
    if (!parent.matches?.(markerSelector)) return;
    const grandparent = parent.parentNode;
    if (!grandparent) return;
    for (const n of nodes) {
      if (n.isConnected && parent.contains(n)) {
        grandparent.insertBefore(n, parent);
      }
    }
  }
}

// Walk the editor and remove empty formatting wrappers, empty list items,
// and empty lists. Never touches the element currently containing the
// caret so the user doesn't lose their place while typing.
function cleanupEmptyNodes(root) {
  const sel = window.getSelection();
  let caretNode = null;
  if (sel && sel.rangeCount > 0 && root.contains(sel.anchorNode)) {
    caretNode =
      sel.anchorNode.nodeType === 3
        ? sel.anchorNode.parentNode
        : sel.anchorNode;
  }
  const containsCaret = (node) =>
    caretNode && (node === caretNode || node.contains(caretNode));

  // Pass 1: empty formatting spans (size/color/highlight wrappers with
  // nothing inside). An empty wrapper is what the "ghost" oval was.
  for (const span of Array.from(root.querySelectorAll('span'))) {
    if (!span.isConnected) continue;
    if (containsCaret(span)) continue;
    const hasElementChildren = span.children.length > 0;
    if (!hasElementChildren && span.textContent === '') {
      span.remove();
    }
  }

  // Pass 2: empty list items. textContent='' covers both "no text" and
  // "only empty spans inside" so the leftover-from-Enter case is handled.
  for (const li of Array.from(root.querySelectorAll('li'))) {
    if (!li.isConnected) continue;
    if (containsCaret(li)) continue;
    if (li.textContent === '') {
      li.remove();
    }
  }

  // Pass 3: empty lists.
  for (const list of Array.from(root.querySelectorAll('ul, ol'))) {
    if (!list.isConnected) continue;
    if (list.children.length === 0) {
      list.remove();
    }
  }
}

function readActiveState(sel, root) {
  const state = { ...DEFAULT_ACTIVE };
  try {
    state.bold = document.queryCommandState('bold');
    state.italic = document.queryCommandState('italic');
    state.ul = document.queryCommandState('insertUnorderedList');
    state.ol = document.queryCommandState('insertOrderedList');
  } catch {
    /* ignore */
  }
  state.size = detectRangeFormat(sel, SIZE_CLASS_MAP, 'body', root);
  state.color = detectRangeFormat(sel, COLOR_CLASS_MAP, 'default', root);
  return state;
}

function findAncestorKey(node, classMap, root) {
  let current = node;
  if (current?.nodeType === 3) current = current.parentNode;
  while (current && current !== root && current !== document.body) {
    if (current.classList) {
      for (const [key, cls] of Object.entries(classMap)) {
        if (current.classList.contains(cls)) return key;
      }
    }
    current = current.parentNode;
  }
  return null;
}

// Detects the active marker-class format across the current selection.
// Returns one of the map keys, `defaultKey`, or `'mixed'` when the range
// spans multiple values — feeding the indeterminate toolbar state.
function detectRangeFormat(sel, classMap, defaultKey, root) {
  if (!sel || sel.rangeCount === 0 || !root) return defaultKey;
  const range = sel.getRangeAt(0);

  if (sel.isCollapsed) {
    return findAncestorKey(sel.anchorNode, classMap, root) ?? defaultKey;
  }

  const found = new Set();
  const common = range.commonAncestorContainer;
  // Iterate every text node that intersects the selection. Every text node
  // has exactly one ancestor chain, so its format is uniform — if we see
  // more than one distinct key across nodes, the selection is mixed.
  const iter = document.createNodeIterator(common, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.textContent) return NodeFilter.FILTER_SKIP;
      if (!range.intersectsNode(node)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let node;
  while ((node = iter.nextNode())) {
    const key = findAncestorKey(node, classMap, root) ?? defaultKey;
    found.add(key);
    if (found.size > 1) return 'mixed';
  }
  if (found.size === 0) return defaultKey;
  return [...found][0];
}

/* ───────────────────────── Docked toolbar ───────────────────────── */

function DockedToolbar({ active, onCmd, onFormat, onClear }) {
  const [menu, setMenu] = useState(null); // 'size' | 'color' | null
  const [entered, setEntered] = useState(false);

  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!menu) return;
    const handler = (e) => {
      if (!e.target.closest('[data-rt-toolbar]')) setMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menu]);

  const applySize = (key) => {
    // Pass the full className (or empty for Body). applyWrappedFormat strips
    // any existing size span inside the selection before applying, so the new
    // size replaces instead of nesting.
    const opt = SIZE_OPTS.find((o) => o.key === key);
    onFormat(SIZE_SELECTOR, opt?.className || '');
    setMenu(null);
  };

  const applyColor = (key) => {
    const opt = COLOR_OPTS.find((o) => o.key === key);
    onFormat(COLOR_SELECTOR, opt?.className || '');
    setMenu(null);
  };

  const currentSizeLabel =
    active.size === 'mixed'
      ? 'Mixed'
      : SIZE_OPTS.find((o) => o.key === active.size)?.label || 'Body';
  const colorKey = active.color === 'mixed' ? 'mixed' : active.color;

  return (
    <div
      data-rt-toolbar
      // Prevent any mousedown on the toolbar from stealing focus.
      onMouseDown={(e) => e.preventDefault()}
      style={{
        opacity: entered ? 1 : 0,
        transform: `translateY(${entered ? 0 : 4}px)`,
        transition: 'opacity 120ms ease-out, transform 120ms ease-out',
      }}
      // group/rtb drives the idle-opacity behavior — toolbar is at 75% by
      // default, lifts to 100% on hover or when a menu is open.
      className={`group/rtb relative z-10 mb-2 inline-flex items-center gap-1 rounded-[12px] border border-whisper/70 bg-white/85 px-1.5 py-1 shadow-[0_8px_20px_-10px_rgba(42,31,27,0.18)] backdrop-blur-md transition-opacity duration-200 ${
        menu ? 'opacity-100' : 'opacity-75 hover:opacity-100 focus-within:opacity-100'
      }`}
    >
      <TBtn
        onClick={() => onCmd('bold')}
        active={active.bold}
        aria-label="Bold"
        title="Bold — Cmd/Ctrl+B"
      >
        <span className="font-semibold">B</span>
      </TBtn>
      <TBtn
        onClick={() => onCmd('italic')}
        active={active.italic}
        aria-label="Italic"
        title="Italic — Cmd/Ctrl+I"
      >
        <span className="font-serif italic">I</span>
      </TBtn>
      <TSep />
      <TBtn
        onClick={() => onCmd('insertUnorderedList')}
        active={active.ul}
        aria-label="Bullet list"
        title="Bullet list — Cmd/Ctrl+Shift+8"
      >
        <span aria-hidden="true">•</span>
      </TBtn>
      <TBtn
        onClick={() => onCmd('insertOrderedList')}
        active={active.ol}
        aria-label="Numbered list"
        title="Numbered list — Cmd/Ctrl+Shift+7"
      >
        <span className="text-[11px]" aria-hidden="true">
          1.
        </span>
      </TBtn>
      <TSep />

      <div className="relative">
        <TDropdown
          onClick={() => setMenu(menu === 'size' ? null : 'size')}
          open={menu === 'size'}
          aria-label="Typography"
        >
          {currentSizeLabel}
        </TDropdown>
        {menu === 'size' && (
          <TMenu>
            {SIZE_OPTS.map((o) => (
              <TMenuItem
                key={o.key}
                active={active.size === o.key}
                onClick={() => applySize(o.key)}
              >
                <span className={o.className || 'text-[14px]'}>{o.label}</span>
              </TMenuItem>
            ))}
          </TMenu>
        )}
      </div>

      <TSep />

      <div className="relative">
        <TDropdown
          onClick={() => setMenu(menu === 'color' ? null : 'color')}
          open={menu === 'color'}
          aria-label="Color & highlight"
          compact
        >
          <ColorSwatch color={colorKey} />
        </TDropdown>
        {menu === 'color' && (
          <TMenu>
            {COLOR_OPTS.map((o) => (
              <TMenuItem
                key={o.key}
                active={active.color === o.key}
                onClick={() => applyColor(o.key)}
              >
                <span className="flex items-center gap-2.5">
                  <ColorSwatch color={o.key} />
                  <span className={o.key === 'highlight' ? '' : o.className}>
                    {o.label}
                  </span>
                </span>
              </TMenuItem>
            ))}
          </TMenu>
        )}
      </div>

      {onClear && (
        <>
          <TSep />
          <TBtn
            onClick={onClear}
            aria-label="Clear formatting"
            title="Clear formatting"
          >
            <span className="text-[11px] tracking-wide">Clear</span>
          </TBtn>
        </>
      )}
    </div>
  );
}

/* ───────────────────────── Toolbar sub-components ───────────────────── */

function TBtn({ children, onClick, active, ...rest }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-7 min-w-[28px] items-center justify-center rounded-md px-1.5 text-[12px] transition ${
        active
          ? 'bg-ink text-canvas'
          : 'text-ink-soft hover:bg-paper/80 hover:text-ink'
      }`}
      {...rest}
    >
      {children}
    </button>
  );
}

function TDropdown({ children, onClick, open, compact, ...rest }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-7 items-center gap-1 rounded-md px-2 text-[12px] transition ${
        compact ? '' : 'min-w-[72px]'
      } ${
        open
          ? 'bg-paper text-ink'
          : 'text-ink-soft hover:bg-paper/80 hover:text-ink'
      }`}
      {...rest}
    >
      {children}
      <span className="text-[8px] leading-none opacity-70" aria-hidden="true">
        ▾
      </span>
    </button>
  );
}

function TSep() {
  return <span className="mx-0.5 h-4 w-px bg-whisper" aria-hidden="true" />;
}

function TMenu({ children }) {
  return (
    <div
      onMouseDown={(e) => e.preventDefault()}
      className="absolute top-full left-0 z-20 mt-1.5 w-[150px] overflow-hidden rounded-[10px] border border-whisper/80 bg-white/95 py-1 shadow-[0_10px_28px_-10px_rgba(42,31,27,0.22)] backdrop-blur-md"
    >
      {children}
    </div>
  );
}

function TMenuItem({ children, onClick, active }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex w-full items-center px-3 py-1.5 text-left text-[12px] transition ${
        active
          ? 'bg-paper text-ink'
          : 'text-ink-soft hover:bg-paper/70 hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

function ColorSwatch({ color }) {
  if (color === 'highlight') {
    return (
      <span
        className="inline-block h-3 w-3 rounded-sm border border-whisper bg-paper"
        aria-hidden="true"
      />
    );
  }
  if (color === 'mixed') {
    // Split swatch signals the selection spans multiple colors.
    return (
      <span
        className="inline-block h-3 w-3 rounded-full border border-whisper/60"
        style={{
          background:
            'conic-gradient(#2B2118 0 25%, #8A7666 25% 50%, #B8936A 50% 75%, #F3ECE1 75% 100%)',
        }}
        aria-hidden="true"
      />
    );
  }
  const bg =
    color === 'accent' ? 'bg-accent' : color === 'muted' ? 'bg-ink-muted' : 'bg-ink';
  return (
    <span
      className={`inline-block h-3 w-3 rounded-full border border-whisper/60 ${bg}`}
      aria-hidden="true"
    />
  );
}

// Strip light rich-text HTML → plain text. Used by consumers that need
// plain text (AI payloads, text export, style diff).
export function richTextToPlain(html) {
  if (typeof html !== 'string' || !html) return '';
  const el = document.createElement('div');
  el.innerHTML = html;
  return el.textContent || '';
}
