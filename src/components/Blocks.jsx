import { useEffect, useRef, useState } from 'react';
import RichText from './RichText';
import ImageUploader from './ImageUploader';
import { imageWidthClass } from '../lib/images';
import {
  makeItemId,
  makeBlock,
  cloneBlock,
  SPLIT_CHILD_TYPES,
  SPLIT_RATIOS,
} from '../lib/blockTypes';

// ---------------------------------------------------------------------------
// Block picker — shown when the user clicks "+ Add block".
// ---------------------------------------------------------------------------

export const PICKER_ITEMS = [
  { type: 'text', label: 'Text', hint: 'Paragraph' },
  { type: 'heading', label: 'Heading', hint: 'Section title' },
  { type: 'tip', label: 'Tip', hint: 'Highlighted note' },
  { type: 'callout', label: 'Callout', hint: 'Deeper explanation' },
  { type: 'image', label: 'Image', hint: 'Upload or paste URL' },
  { type: 'steps', label: 'Steps', hint: 'Numbered sequence' },
  { type: 'checklist', label: 'Checklist', hint: 'Checkable items' },
  { type: 'video', label: 'Video', hint: 'YouTube / Vimeo URL' },
  { type: 'split', label: 'Split layout', hint: '2 columns' },
  { type: 'divider', label: 'Divider', hint: '' },
];

export function BlockPicker({ onPick, onClose }) {
  return (
    <div
      className="absolute left-1/2 top-full z-20 mt-1 w-[260px] -translate-x-1/2 rounded-lg border border-whisper bg-white p-1.5 shadow-[0_8px_28px_-12px_rgba(58,46,38,0.2)]"
      onMouseLeave={onClose}
    >
      <div className="px-2 pb-1.5 pt-1 text-[9px] uppercase tracking-[0.22em] text-ink-muted">
        Add block
      </div>
      <ul className="space-y-0.5">
        {PICKER_ITEMS.map((item) => (
          <li key={item.type}>
            <button
              type="button"
              onClick={() => {
                onPick(item.type);
                onClose();
              }}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[13px] text-ink transition hover:bg-paper/70"
            >
              <span>{item.label}</span>
              {item.hint && (
                <span className="text-[11px] text-ink-muted">{item.hint}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BlockShell — wraps every block with drag handle, menu (delete/duplicate),
// and the "+ Add Below" affordance rendered by the parent.
// ---------------------------------------------------------------------------

export function BlockShell({
  children,
  onDelete,
  onDuplicate,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragged,
  isDragTarget,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div
      className={`group relative flex items-start gap-1 ${
        isDragTarget ? 'border-t-2 border-accent/60' : ''
      } ${isDragged ? 'opacity-40' : ''}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Drag handle + menu (shown on hover) */}
      <div className="flex w-6 flex-shrink-0 flex-col items-center pt-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          className="flex h-5 w-5 cursor-grab items-center justify-center rounded text-ink-muted hover:bg-paper hover:text-ink active:cursor-grabbing"
          aria-label="Drag to reorder"
          title="Drag to reorder"
        >
          <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
            <circle cx="2" cy="2" r="1.3" />
            <circle cx="8" cy="2" r="1.3" />
            <circle cx="2" cy="7" r="1.3" />
            <circle cx="8" cy="7" r="1.3" />
            <circle cx="2" cy="12" r="1.3" />
            <circle cx="8" cy="12" r="1.3" />
          </svg>
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="mt-0.5 flex h-5 w-5 items-center justify-center rounded text-ink-muted hover:bg-paper hover:text-ink"
            aria-label="Block actions"
          >
            <span className="text-base leading-none">⋯</span>
          </button>
          {menuOpen && (
            <div
              className="absolute left-6 top-0 z-30 w-[140px] rounded-md border border-whisper bg-white py-1 shadow-[0_6px_20px_-10px_rgba(58,46,38,0.25)]"
              onMouseLeave={() => setMenuOpen(false)}
            >
              {onDuplicate && (
                <button
                  type="button"
                  onClick={() => {
                    onDuplicate();
                    setMenuOpen(false);
                  }}
                  className="block w-full px-3 py-1.5 text-left text-[12px] text-ink hover:bg-paper"
                >
                  Duplicate
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete();
                    setMenuOpen(false);
                  }}
                  className="block w-full px-3 py-1.5 text-left text-[12px] text-rose hover:bg-rose/10"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Individual block components — each gets { block, onChange } props.
// ---------------------------------------------------------------------------

export function HeadingBlock({ block, onChange }) {
  return (
    <RichText
      value={block.content || ''}
      onChange={(html) => onChange({ content: html })}
      placeholder="Heading"
      className="font-serif text-[24px] leading-[1.2] tracking-tight text-ink"
    />
  );
}

export function TextBlock({ block, onChange }) {
  return (
    <RichText
      value={block.content || ''}
      onChange={(html) => onChange({ content: html })}
      placeholder="Write something, or press + to add a block"
      className="text-[16px] leading-[1.7] text-ink"
    />
  );
}

export function TipBlock({ block, onChange }) {
  return (
    <div className="rounded-lg border border-rose/30 bg-canvas/60 px-4 py-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-rose">
        <span className="h-1 w-1 rounded-full bg-rose" />
        <span>Tip</span>
      </div>
      <RichText
        value={block.content || ''}
        onChange={(html) => onChange({ content: html })}
        placeholder="A pointer the educator should emphasise."
        className="text-[15px] leading-[1.65] text-ink"
      />
    </div>
  );
}

export function CalloutBlock({ block, onChange }) {
  return (
    <div className="rounded-lg border border-accent/30 bg-paper/60 px-5 py-4">
      <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-accent">
        <span className="h-1 w-1 rounded-full bg-accent" />
        <span>Deeper understanding</span>
      </div>
      <RichText
        value={block.content || ''}
        onChange={(html) => onChange({ content: html })}
        placeholder="Expand on this concept."
        className="text-[15.5px] leading-[1.7] text-ink"
      />
    </div>
  );
}

export function DividerBlock() {
  return <hr className="my-1 border-0 border-t border-whisper" />;
}

// Image: supports both upload AND URL paste.
export function ImageBlock({ block, onChange }) {
  const content = block.content || { src: '', caption: '', width: 'full', fit: 'cover' };
  const [urlDraft, setUrlDraft] = useState('');
  const [replaceMode, setReplaceMode] = useState(false);
  const inputRef = useRef(null);

  const updateImage = (patch) => onChange({ content: { ...content, ...patch } });

  const handlePasteUrl = () => {
    const trimmed = urlDraft.trim();
    if (!trimmed) return;
    updateImage({ src: trimmed });
    setUrlDraft('');
    setReplaceMode(false);
  };

  const needsUpload = !content.src || replaceMode;
  if (needsUpload) {
    return (
      <div className="rounded-lg border border-dashed border-whisper bg-paper/30 p-4">
        <ImageUploader
          image={{ src: '', width: content.width }}
          onChange={(img) => {
            updateImage({ src: img.src, width: img.width || 'full' });
            setReplaceMode(false);
          }}
          onRemove={() => updateImage({ src: '' })}
          showSizePicker={false}
          compact
          placeholder={content.src ? 'Upload a replacement' : 'Upload image'}
        />
        <div className="mt-2 flex gap-2">
          <input
            ref={inputRef}
            type="url"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handlePasteUrl();
              }
            }}
            placeholder="or paste an image URL"
            className="flex-1 rounded-md border border-whisper bg-white px-3 py-1.5 text-[12px] text-ink placeholder:italic placeholder:text-ink-faint focus:border-accent/50 focus:outline-none"
          />
          <button
            type="button"
            onClick={handlePasteUrl}
            disabled={!urlDraft.trim()}
            className="rounded-md bg-ink px-3 py-1.5 text-[12px] tracking-wide text-canvas transition hover:bg-[#2A1F18] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add
          </button>
        </div>
        {content.src && (
          <button
            type="button"
            onClick={() => setReplaceMode(false)}
            className="mt-2 text-[11px] text-ink-muted hover:text-ink"
          >
            Cancel
          </button>
        )}
      </div>
    );
  }

  const objectFitClass = content.fit === 'contain' ? 'object-contain' : 'object-cover';

  return (
    <figure className="group/img relative">
      <img
        src={content.src}
        alt={content.caption || ''}
        className={`rounded-lg ${imageWidthClass(content.width)} ${objectFitClass}`}
      />
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover/img:opacity-100">
        <button
          type="button"
          onClick={() => setReplaceMode(true)}
          className="flex h-7 items-center rounded-md bg-ink/85 px-2 text-[11px] tracking-wide text-canvas hover:bg-ink"
        >
          Replace
        </button>
        <button
          type="button"
          onClick={() => updateImage({ src: '' })}
          className="flex h-7 items-center rounded-md bg-ink/85 px-2 text-[11px] tracking-wide text-canvas hover:bg-ink"
        >
          Remove
        </button>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-3">
        <select
          value={content.width}
          onChange={(e) => updateImage({ width: e.target.value })}
          className="rounded border border-whisper bg-white px-2 py-0.5 text-[11px] text-ink-soft focus:outline-none"
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
          <option value="full">Full</option>
        </select>
        {/* Fit: cover crops to fill the box; contain letterboxes the whole image. */}
        <div className="inline-flex items-center rounded border border-whisper bg-white p-0.5">
          <button
            type="button"
            onClick={() => updateImage({ fit: 'cover' })}
            className={`rounded px-2 py-0.5 text-[11px] tracking-wide transition ${
              content.fit === 'cover' ? 'bg-ink text-canvas' : 'text-ink-muted hover:text-ink'
            }`}
            title="Fill the frame, cropping if needed"
          >
            Fill
          </button>
          <button
            type="button"
            onClick={() => updateImage({ fit: 'contain' })}
            className={`rounded px-2 py-0.5 text-[11px] tracking-wide transition ${
              content.fit === 'contain' ? 'bg-ink text-canvas' : 'text-ink-muted hover:text-ink'
            }`}
            title="Fit the whole image, even if it leaves space"
          >
            Fit
          </button>
        </div>
        <input
          type="text"
          value={content.caption || ''}
          onChange={(e) => updateImage({ caption: e.target.value })}
          placeholder="Caption (optional)"
          className="flex-1 rounded bg-transparent px-1 py-0.5 text-[12px] italic text-ink-soft placeholder:text-ink-faint focus:bg-paper/40 focus:outline-none"
        />
      </div>
    </figure>
  );
}

// Video: URL only (YouTube/Vimeo). No oEmbed — just a plain iframe when it
// looks like a standard embeddable URL, otherwise a link.
export function VideoBlock({ block, onChange }) {
  const content = block.content || { url: '', caption: '' };
  const [draft, setDraft] = useState(content.url || '');

  const commit = () => {
    if (draft.trim() === (content.url || '')) return;
    onChange({ content: { ...content, url: draft.trim() } });
  };

  const embedUrl = toEmbeddableUrl(content.url);

  return (
    <div className="rounded-lg border border-whisper bg-white p-3">
      <input
        type="url"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          }
        }}
        placeholder="Paste a YouTube or Vimeo URL"
        className="w-full rounded-md border border-whisper bg-paper/40 px-3 py-1.5 text-[12px] text-ink placeholder:italic placeholder:text-ink-faint focus:border-accent/50 focus:outline-none"
      />
      {embedUrl ? (
        <div className="relative mt-3 aspect-video w-full overflow-hidden rounded-md bg-black">
          <iframe
            src={embedUrl}
            title="Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
      ) : content.url ? (
        <a
          href={content.url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block break-all text-[12px] text-accent underline"
        >
          {content.url}
        </a>
      ) : null}
      <input
        type="text"
        value={content.caption || ''}
        onChange={(e) =>
          onChange({ content: { ...content, caption: e.target.value } })
        }
        placeholder="Caption (optional)"
        className="mt-2 w-full rounded bg-transparent px-1 py-0.5 text-[12px] italic text-ink-soft placeholder:text-ink-faint focus:bg-paper/40 focus:outline-none"
      />
    </div>
  );
}

function toEmbeddableUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return '';
  const trimmed = url.trim();
  const yt = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = trimmed.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return '';
}

export function StepsBlock({ block, onChange }) {
  const items = Array.isArray(block.content) ? block.content : [];

  const updateItem = (id, text) =>
    onChange({ content: items.map((it) => (it.id === id ? { ...it, text } : it)) });

  const addItem = () =>
    onChange({
      content: [...items, { id: makeItemId(), text: '' }],
    });

  const removeItem = (id) =>
    onChange({ content: items.filter((it) => it.id !== id) });

  return (
    <div>
      <ol className="space-y-2">
        {items.map((it, idx) => (
          <li key={it.id} className="flex items-start gap-3">
            <span className="mt-[6px] min-w-[18px] font-serif italic text-[13px] text-ink-faint">
              {String(idx + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0 flex-1">
              <RichText
                value={it.text}
                onChange={(html) => updateItem(it.id, html)}
                placeholder="A step…"
                className="text-[15px] leading-[1.65] text-ink"
              />
            </div>
            <button
              type="button"
              onClick={() => removeItem(it.id)}
              className="mt-0.5 rounded px-1 text-[13px] text-ink-muted hover:text-ink"
              aria-label="Remove step"
            >
              ×
            </button>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={addItem}
        className="mt-2 text-[12px] tracking-wide text-ink-muted hover:text-ink"
      >
        + Add step
      </button>
    </div>
  );
}

export function ChecklistBlock({ block, onChange }) {
  const items = Array.isArray(block.content) ? block.content : [];

  const updateItem = (id, patch) =>
    onChange({ content: items.map((it) => (it.id === id ? { ...it, ...patch } : it)) });

  const addItem = () =>
    onChange({ content: [...items, { id: makeItemId(), text: '', done: false }] });

  const removeItem = (id) => onChange({ content: items.filter((it) => it.id !== id) });

  return (
    <div>
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li key={it.id} className="flex items-start gap-2.5">
            <input
              type="checkbox"
              checked={Boolean(it.done)}
              onChange={(e) => updateItem(it.id, { done: e.target.checked })}
              className="mt-[9px] h-3.5 w-3.5 accent-accent"
            />
            <div className="min-w-0 flex-1">
              <RichText
                value={it.text}
                onChange={(html) => updateItem(it.id, { text: html })}
                placeholder="Item…"
                className={`text-[15px] leading-[1.65] ${
                  it.done ? 'text-ink-muted line-through' : 'text-ink'
                }`}
              />
            </div>
            <button
              type="button"
              onClick={() => removeItem(it.id)}
              className="mt-1 rounded px-1 text-[13px] text-ink-muted hover:text-ink"
              aria-label="Remove item"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={addItem}
        className="mt-2 text-[12px] tracking-wide text-ink-muted hover:text-ink"
      >
        + Add item
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SplitBlock — single parent block with two columns, each holding children.
// Content shape: { ratio: '50-50' | ..., columns: [{ blocks: [] }, { blocks: [] }] }
// Children are normal Block objects but restricted to SPLIT_CHILD_TYPES (no
// nested splits). Supports per-column "+ Add" picker, variant presets,
// ratio control, and a swap-columns button.
// ---------------------------------------------------------------------------

// Inline grid-template-columns per ratio. Tailwind JIT's arbitrary-value
// scanner didn't reliably pick up `grid-cols-[minmax(0,1fr)_minmax(0,1fr)]`
// from an object literal, so we drive the grid through a style prop instead.
// Under the md breakpoint (~768px) we fall back to a single stacked column.
const RATIO_TO_GRID = {
  '50-50': 'minmax(0,1fr) minmax(0,1fr)',
  '40-60': 'minmax(0,2fr) minmax(0,3fr)',
  '60-40': 'minmax(0,3fr) minmax(0,2fr)',
  '30-70': 'minmax(0,3fr) minmax(0,7fr)',
  '70-30': 'minmax(0,7fr) minmax(0,3fr)',
};

function useIsDesktop() {
  const get = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(min-width: 768px)').matches;
  const [isDesktop, setIsDesktop] = useState(get);
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mql = window.matchMedia('(min-width: 768px)');
    const onChange = (e) => setIsDesktop(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return isDesktop;
}

function useSplitGridStyle(ratio) {
  const isDesktop = useIsDesktop();
  const cols = RATIO_TO_GRID[ratio] || RATIO_TO_GRID['50-50'];
  return {
    gridTemplateColumns: isDesktop ? cols : 'minmax(0,1fr)',
  };
}

const SPLIT_VARIANTS = [
  {
    key: 'image-text',
    label: 'Image + Text',
    hint: 'Image on the left, words on the right',
    build: () => ({
      ratio: '50-50',
      columns: [
        { blocks: [makeBlock('image')] },
        { blocks: [makeBlock('heading'), makeBlock('text')] },
      ],
    }),
  },
  {
    key: 'text-image',
    label: 'Text + Image',
    hint: 'Words on the left, image on the right',
    build: () => ({
      ratio: '50-50',
      columns: [
        { blocks: [makeBlock('heading'), makeBlock('text')] },
        { blocks: [makeBlock('image')] },
      ],
    }),
  },
  {
    key: 'image-image',
    label: 'Image vs Image',
    hint: 'Side-by-side comparison',
    build: () => ({
      ratio: '50-50',
      columns: [
        { blocks: [makeBlock('image'), makeBlock('text')] },
        { blocks: [makeBlock('image'), makeBlock('text')] },
      ],
    }),
  },
];

function SplitChildPicker({ onPick, onClose }) {
  const items = PICKER_ITEMS.filter((i) => SPLIT_CHILD_TYPES.includes(i.type));
  return (
    <div
      className="absolute left-1/2 top-full z-20 mt-1 w-[220px] -translate-x-1/2 rounded-lg border border-whisper bg-white p-1.5 shadow-[0_8px_28px_-12px_rgba(58,46,38,0.2)]"
      onMouseLeave={onClose}
    >
      <div className="px-2 pb-1.5 pt-1 text-[9px] uppercase tracking-[0.22em] text-ink-muted">
        Add to column
      </div>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.type}>
            <button
              type="button"
              onClick={() => {
                onPick(item.type);
                onClose();
              }}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[13px] text-ink transition hover:bg-paper/70"
            >
              <span>{item.label}</span>
              {item.hint && <span className="text-[11px] text-ink-muted">{item.hint}</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SplitBlock({ block, onChange, onDuplicate, onDelete }) {
  const content = block.content || {
    ratio: '50-50',
    mode: 'default',
    labels: { left: '', right: '' },
    columns: [{ blocks: [] }, { blocks: [] }],
  };
  const { ratio, mode = 'default', labels = { left: '', right: '' }, columns } = content;

  const isEmpty =
    (columns[0]?.blocks?.length ?? 0) === 0 && (columns[1]?.blocks?.length ?? 0) === 0;

  const patchContent = (patch) => onChange({ content: { ...content, ...patch } });

  const applyVariant = (variant) => patchContent(variant.build());

  const setRatio = (r) => patchContent({ ratio: r });
  const setMode = (m) => {
    // Switching to comparison seeds default labels if they're blank.
    if (m === 'comparison' && !labels.left && !labels.right) {
      patchContent({ mode: m, labels: { left: 'Before', right: 'After' } });
    } else {
      patchContent({ mode: m });
    }
  };
  const setLabel = (side, value) =>
    patchContent({ labels: { ...labels, [side]: value } });

  const swapColumns = () =>
    patchContent({
      columns: [columns[1] || { blocks: [] }, columns[0] || { blocks: [] }],
      labels: { left: labels.right, right: labels.left },
    });

  const updateColumn = (colIdx, nextBlocks) => {
    const nextColumns = columns.map((col, i) =>
      i === colIdx ? { ...col, blocks: nextBlocks } : col,
    );
    patchContent({ columns: nextColumns });
  };

  const insertChild = (colIdx, index, type) => {
    if (!SPLIT_CHILD_TYPES.includes(type)) return;
    const col = columns[colIdx] || { blocks: [] };
    const next = [...(col.blocks || [])];
    const clamped = Math.max(0, Math.min(index, next.length));
    next.splice(clamped, 0, makeBlock(type));
    updateColumn(colIdx, next);
  };

  const updateChild = (colIdx, childId, patch) => {
    const col = columns[colIdx] || { blocks: [] };
    updateColumn(
      colIdx,
      (col.blocks || []).map((b) => (b.id === childId ? { ...b, ...patch } : b)),
    );
  };

  const deleteChild = (colIdx, childId) => {
    const col = columns[colIdx] || { blocks: [] };
    updateColumn(colIdx, (col.blocks || []).filter((b) => b.id !== childId));
  };

  const duplicateChild = (colIdx, childId) => {
    const col = columns[colIdx] || { blocks: [] };
    const idx = (col.blocks || []).findIndex((b) => b.id === childId);
    if (idx === -1) return;
    const copy = cloneBlock(col.blocks[idx]);
    const next = [...col.blocks];
    next.splice(idx + 1, 0, copy);
    updateColumn(colIdx, next);
  };

  const moveChildToOtherColumn = (colIdx, childId) => {
    const otherIdx = colIdx === 0 ? 1 : 0;
    const col = columns[colIdx] || { blocks: [] };
    const moving = (col.blocks || []).find((b) => b.id === childId);
    if (!moving) return;
    const nextColumns = columns.map((c, i) => {
      if (i === colIdx) return { ...c, blocks: c.blocks.filter((b) => b.id !== childId) };
      if (i === otherIdx) return { ...c, blocks: [...(c.blocks || []), moving] };
      return c;
    });
    patchContent({ columns: nextColumns });
  };

  const reorderChild = (colIdx, fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    const col = columns[colIdx] || { blocks: [] };
    const next = [...(col.blocks || [])];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(Math.max(0, Math.min(toIndex, next.length)), 0, moved);
    updateColumn(colIdx, next);
  };

  const gridStyle = useSplitGridStyle(ratio);

  return (
    <div className="group/split relative rounded-lg border border-whisper bg-paper/20 focus-within:border-accent/40 focus-within:shadow-[0_0_0_3px_rgba(184,147,106,0.08)]">
      {/* Floating contextual toolbar — appears on hover OR when a child is
          focused. Sits above the block, Notion-style. */}
      <SplitFloatingToolbar
        ratio={ratio}
        mode={mode}
        onRatio={setRatio}
        onMode={setMode}
        onSwap={swapColumns}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />

      <div className="p-4">
        {/* Variant presets (only when empty) */}
        {isEmpty && (
          <>
            <div className="mb-3 text-[10px] uppercase tracking-[0.22em] text-ink-muted">
              Start with a template
            </div>
            <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-3">
              {SPLIT_VARIANTS.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => applyVariant(v)}
                  className="rounded-md border border-whisper bg-white px-3 py-2.5 text-left transition hover:border-accent/40 hover:bg-paper"
                >
                  <div className="text-[12.5px] font-medium text-ink">{v.label}</div>
                  <div className="mt-0.5 text-[11px] text-ink-muted">{v.hint}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Comparison mode: editable labels above each column */}
        {mode === 'comparison' && !isEmpty && (
          <div className="mb-2 grid gap-3" style={gridStyle}>
            {['left', 'right'].map((side) => (
              <input
                key={side}
                type="text"
                value={labels[side]}
                onChange={(e) => setLabel(side, e.target.value)}
                placeholder={side === 'left' ? 'Before' : 'After'}
                className="rounded-md bg-transparent px-2 py-1 text-center text-[11px] uppercase tracking-[0.22em] text-ink-soft placeholder:normal-case placeholder:tracking-normal placeholder:italic placeholder:text-ink-faint hover:bg-paper/40 focus:bg-paper/60 focus:outline-none"
              />
            ))}
          </div>
        )}

        {/* Slider mode renders an overlay of the two first images. The
            regular column editors still render below so the user can edit
            the images / text that feed the slider. */}
        {mode === 'slider' && !isEmpty && <ComparisonSlider columns={columns} labels={labels} />}

        {/* Columns — grid on md+, stacks vertically on mobile */}
        <div className="grid gap-3" style={gridStyle}>
          {columns.map((col, colIdx) => (
            <SplitColumn
              key={colIdx}
              colIdx={colIdx}
              blocks={col.blocks || []}
              onInsert={(idx, type) => insertChild(colIdx, idx, type)}
              onUpdateChild={(childId, patch) => updateChild(colIdx, childId, patch)}
              onDeleteChild={(childId) => deleteChild(colIdx, childId)}
              onDuplicateChild={(childId) => duplicateChild(colIdx, childId)}
              onMoveToOther={(childId) => moveChildToOtherColumn(colIdx, childId)}
              onReorder={(from, to) => reorderChild(colIdx, from, to)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Contextual toolbar pinned to the top of a split block. Only visible on
// hover or focus-within — matches Notion/Canva contextual controls.
function SplitFloatingToolbar({ ratio, mode, onRatio, onMode, onSwap, onDuplicate, onDelete }) {
  return (
    <div className="pointer-events-none absolute -top-10 left-1/2 z-10 -translate-x-1/2 opacity-0 transition-opacity group-hover/split:opacity-100 group-focus-within/split:opacity-100">
      <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-whisper bg-white px-1.5 py-1 shadow-[0_4px_16px_-6px_rgba(58,46,38,0.18)]">
        <ToolbarButton onClick={onSwap} title="Swap columns">
          <span className="text-[13px] leading-none">⇄</span>
        </ToolbarButton>
        <ToolbarDivider />
        <ToolbarSelect
          value={ratio}
          onChange={onRatio}
          options={SPLIT_RATIOS.map((r) => ({ value: r, label: r.replace('-', ' / ') }))}
          title="Column ratio"
        />
        <ToolbarDivider />
        <ToolbarSelect
          value={mode}
          onChange={onMode}
          options={[
            { value: 'default', label: 'Default' },
            { value: 'comparison', label: 'Comparison' },
            { value: 'slider', label: 'Slider' },
          ]}
          title="Layout style"
        />
        {(onDuplicate || onDelete) && <ToolbarDivider />}
        {onDuplicate && (
          <ToolbarButton onClick={onDuplicate} title="Duplicate block">
            <span className="text-[11px] tracking-wide">Duplicate</span>
          </ToolbarButton>
        )}
        {onDelete && (
          <ToolbarButton onClick={onDelete} title="Delete block" variant="danger">
            <span className="text-[11px] tracking-wide">Delete</span>
          </ToolbarButton>
        )}
      </div>
    </div>
  );
}

function ToolbarButton({ onClick, title, variant = 'default', children }) {
  const base = 'flex h-7 items-center rounded-md px-2 transition';
  const tone =
    variant === 'danger'
      ? 'text-rose hover:bg-rose/10'
      : 'text-ink-soft hover:bg-paper hover:text-ink';
  return (
    <button type="button" onClick={onClick} title={title} className={`${base} ${tone}`}>
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="mx-0.5 h-4 w-px bg-whisper" />;
}

function ToolbarSelect({ value, onChange, options, title }) {
  return (
    <select
      title={title}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-7 rounded-md bg-transparent px-1.5 text-[11px] text-ink-soft hover:bg-paper hover:text-ink focus:outline-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// Before/After image slider. Finds the first image child in each column and
// juxtaposes them, clipped to a user-adjustable percentage.
function ComparisonSlider({ columns, labels }) {
  const leftImg = findFirstImage(columns[0]?.blocks);
  const rightImg = findFirstImage(columns[1]?.blocks);
  const [pct, setPct] = useState(50);
  const wrapRef = useRef(null);
  const draggingRef = useRef(false);

  const startDrag = (e) => {
    draggingRef.current = true;
    e.preventDefault();
  };
  const onMove = (clientX) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const next = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setPct(next);
  };

  useEffect(() => {
    const onMouseMove = (e) => {
      if (draggingRef.current) onMove(e.clientX);
    };
    const onMouseUp = () => {
      draggingRef.current = false;
    };
    const onTouchMove = (e) => {
      if (draggingRef.current && e.touches[0]) onMove(e.touches[0].clientX);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, []);

  if (!leftImg?.src || !rightImg?.src) {
    return (
      <div className="mb-3 rounded-md border border-dashed border-whisper bg-white/60 px-4 py-3 text-center text-[12px] italic text-ink-muted">
        Slider mode needs an image in each column.
      </div>
    );
  }

  return (
    <figure className="mb-3">
      <div
        ref={wrapRef}
        className="relative aspect-[16/9] w-full select-none overflow-hidden rounded-lg bg-black"
      >
        <img
          src={rightImg.src}
          alt={labels.right || 'After'}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
        <div
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${pct}%` }}
        >
          <img
            src={leftImg.src}
            alt={labels.left || 'Before'}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ width: `${100 / (pct / 100 || 1)}%`, maxWidth: 'none' }}
            draggable={false}
          />
        </div>
        {(labels.left || labels.right) && (
          <>
            <span className="absolute left-2 top-2 rounded-full bg-ink/75 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-canvas">
              {labels.left || 'Before'}
            </span>
            <span className="absolute right-2 top-2 rounded-full bg-ink/75 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-canvas">
              {labels.right || 'After'}
            </span>
          </>
        )}
        <div
          onMouseDown={startDrag}
          onTouchStart={startDrag}
          className="absolute inset-y-0 z-10 flex w-1 cursor-ew-resize items-center justify-center bg-canvas"
          style={{ left: `calc(${pct}% - 2px)` }}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-whisper bg-white shadow-[0_1px_6px_rgba(58,46,38,0.25)] text-ink-soft">
            ⇔
          </span>
        </div>
      </div>
    </figure>
  );
}

function findFirstImage(blocks) {
  if (!Array.isArray(blocks)) return null;
  const img = blocks.find((b) => b?.type === 'image' && b.content?.src);
  return img ? img.content : null;
}

function SplitColumn({
  colIdx,
  blocks,
  onInsert,
  onUpdateChild,
  onDeleteChild,
  onDuplicateChild,
  onMoveToOther,
  onReorder,
}) {
  const [pickerAt, setPickerAt] = useState(null);
  const [emptyPickerOpen, setEmptyPickerOpen] = useState(false);
  const [drag, setDrag] = useState({ fromIndex: -1, overIndex: -1 });

  const handleDragStart = (index) => (e) => {
    e.dataTransfer.effectAllowed = 'move';
    setDrag({ fromIndex: index, overIndex: -1 });
  };
  const handleDragOver = (index) => (e) => {
    if (drag.fromIndex < 0) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (drag.overIndex !== index) setDrag((s) => ({ ...s, overIndex: index }));
  };
  const handleDrop = (index) => (e) => {
    if (drag.fromIndex < 0) return;
    e.preventDefault();
    if (drag.fromIndex !== index) onReorder(drag.fromIndex, index);
    setDrag({ fromIndex: -1, overIndex: -1 });
  };
  const handleDragEnd = () => setDrag({ fromIndex: -1, overIndex: -1 });

  // Empty column placeholder — a large, centered "+ Add content" card with
  // an inline picker popover. Meant to feel inviting rather than incidental.
  if (blocks.length === 0) {
    return (
      <div className="group/col relative flex min-h-[160px] items-center justify-center rounded-md border-2 border-dashed border-whisper bg-white/70 p-4 transition hover:border-accent/40">
        <div className="mb-1 absolute left-3 top-2 text-[9px] uppercase tracking-[0.22em] text-ink-muted">
          Column {colIdx + 1}
        </div>
        <button
          type="button"
          onClick={() => setEmptyPickerOpen(true)}
          className="flex flex-col items-center gap-1.5 rounded-md px-4 py-3 text-ink-muted transition hover:text-ink"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-whisper bg-paper text-[18px] leading-none text-ink-soft">
            +
          </span>
          <span className="text-[12.5px] tracking-wide">Add content</span>
        </button>
        {emptyPickerOpen && (
          <SplitChildPicker
            onPick={(type) => {
              onInsert(0, type);
              setEmptyPickerOpen(false);
            }}
            onClose={() => setEmptyPickerOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="group/col rounded-md border border-whisper bg-white p-3">
      <div className="mb-1 text-[9px] uppercase tracking-[0.22em] text-ink-muted">
        Column {colIdx + 1}
      </div>

      <div className="space-y-1">
        <AddChildRow
          open={pickerAt === 0}
          onToggle={() => setPickerAt(pickerAt === 0 ? null : 0)}
          onPick={(type) => {
            onInsert(0, type);
            setPickerAt(null);
          }}
        />

        {blocks.map((child, index) => (
          <div key={child.id}>
            <SplitChildShell
              onDelete={() => onDeleteChild(child.id)}
              onDuplicate={() => onDuplicateChild(child.id)}
              onMoveToOther={() => onMoveToOther(child.id)}
              onDragStart={handleDragStart(index)}
              onDragOver={handleDragOver(index)}
              onDrop={handleDrop(index)}
              onDragEnd={handleDragEnd}
              isDragged={drag.fromIndex === index}
              isDragTarget={
                drag.overIndex === index &&
                drag.fromIndex !== index &&
                drag.fromIndex >= 0
              }
            >
              <BlockBody
                block={child}
                onChange={(patch) => onUpdateChild(child.id, patch)}
              />
            </SplitChildShell>

            <AddChildRow
              open={pickerAt === index + 1}
              onToggle={() => setPickerAt(pickerAt === index + 1 ? null : index + 1)}
              onPick={(type) => {
                onInsert(index + 1, type);
                setPickerAt(null);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function AddChildRow({ open, onToggle, onPick }) {
  return (
    <div className="relative flex items-center justify-center py-0.5">
      <button
        type="button"
        onClick={onToggle}
        className="flex h-5 w-5 items-center justify-center rounded-full border border-whisper bg-white text-[13px] leading-none text-ink-muted opacity-0 transition hover:border-accent/60 hover:bg-paper hover:text-ink group-hover:opacity-100 focus:opacity-100"
        style={{ opacity: open ? 1 : undefined }}
        aria-label="Add block to column"
      >
        +
      </button>
      {open && <SplitChildPicker onPick={onPick} onClose={onToggle} />}
    </div>
  );
}

function SplitChildShell({
  children,
  onDelete,
  onDuplicate,
  onMoveToOther,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragged,
  isDragTarget,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div
      className={`group relative flex items-start gap-1 rounded px-1 py-0.5 ${
        isDragTarget ? 'border-t-2 border-accent/60' : ''
      } ${isDragged ? 'opacity-40' : ''}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="flex w-5 flex-shrink-0 flex-col items-center pt-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          className="flex h-4 w-4 cursor-grab items-center justify-center rounded text-ink-muted hover:bg-paper hover:text-ink active:cursor-grabbing"
          aria-label="Drag to reorder"
          title="Drag to reorder in column"
        >
          <svg width="8" height="12" viewBox="0 0 10 14" fill="currentColor">
            <circle cx="2" cy="2" r="1.2" />
            <circle cx="8" cy="2" r="1.2" />
            <circle cx="2" cy="7" r="1.2" />
            <circle cx="8" cy="7" r="1.2" />
            <circle cx="2" cy="12" r="1.2" />
            <circle cx="8" cy="12" r="1.2" />
          </svg>
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="mt-0.5 flex h-4 w-4 items-center justify-center rounded text-ink-muted hover:bg-paper hover:text-ink"
            aria-label="Block actions"
          >
            <span className="text-[13px] leading-none">⋯</span>
          </button>
          {menuOpen && (
            <div
              className="absolute left-5 top-0 z-30 w-[150px] rounded-md border border-whisper bg-white py-1 shadow-[0_6px_20px_-10px_rgba(58,46,38,0.25)]"
              onMouseLeave={() => setMenuOpen(false)}
            >
              {onMoveToOther && (
                <button
                  type="button"
                  onClick={() => {
                    onMoveToOther();
                    setMenuOpen(false);
                  }}
                  className="block w-full px-3 py-1.5 text-left text-[12px] text-ink hover:bg-paper"
                >
                  Move to other column
                </button>
              )}
              {onDuplicate && (
                <button
                  type="button"
                  onClick={() => {
                    onDuplicate();
                    setMenuOpen(false);
                  }}
                  className="block w-full px-3 py-1.5 text-left text-[12px] text-ink hover:bg-paper"
                >
                  Duplicate
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete();
                    setMenuOpen(false);
                  }}
                  className="block w-full px-3 py-1.5 text-left text-[12px] text-rose hover:bg-rose/10"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

// Dispatcher — used by the Canvas and student preview. Split blocks accept
// optional onDuplicate/onDelete so the floating toolbar can mirror the
// parent's block-level actions.
export function BlockBody({ block, onChange, onDuplicate, onDelete, readOnly = false }) {
  if (!block) return null;
  if (readOnly) return <ReadOnlyBlock block={block} />;

  switch (block.type) {
    case 'heading':
      return <HeadingBlock block={block} onChange={onChange} />;
    case 'text':
      return <TextBlock block={block} onChange={onChange} />;
    case 'tip':
      return <TipBlock block={block} onChange={onChange} />;
    case 'callout':
      return <CalloutBlock block={block} onChange={onChange} />;
    case 'image':
      return <ImageBlock block={block} onChange={onChange} />;
    case 'video':
      return <VideoBlock block={block} onChange={onChange} />;
    case 'steps':
      return <StepsBlock block={block} onChange={onChange} />;
    case 'checklist':
      return <ChecklistBlock block={block} onChange={onChange} />;
    case 'split':
      return (
        <SplitBlock
          block={block}
          onChange={onChange}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      );
    case 'divider':
      return <DividerBlock />;
    default:
      return null;
  }
}

// Read-only render (StudentPreview, export). Kept simple — the same styling
// as the editor but non-interactive.
export function ReadOnlyBlock({ block }) {
  if (!block) return null;
  switch (block.type) {
    case 'heading':
      return (
        <h2
          className="rich-text mt-4 font-serif text-[24px] leading-[1.2] tracking-tight text-ink"
          dangerouslySetInnerHTML={{ __html: block.content || '' }}
        />
      );
    case 'text':
      return (
        <div
          className="rich-text text-[17px] leading-[1.75] text-ink"
          dangerouslySetInnerHTML={{ __html: block.content || '' }}
        />
      );
    case 'tip':
      return (
        <div
          data-themed-card
          className="border border-rose/30 bg-canvas/60 px-5 py-4"
        >
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-rose">
            <span className="h-1 w-1 rounded-full bg-rose" />
            <span>Tip</span>
          </div>
          <div
            className="rich-text text-[15.5px] leading-[1.7] text-ink"
            dangerouslySetInnerHTML={{ __html: block.content || '' }}
          />
        </div>
      );
    case 'callout':
      return (
        <div
          data-themed-card
          className="border border-accent/30 bg-paper/60 px-5 py-4"
        >
          <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-accent">
            Deeper understanding
          </div>
          <div
            className="rich-text text-[16px] leading-[1.7] text-ink"
            dangerouslySetInnerHTML={{ __html: block.content || '' }}
          />
        </div>
      );
    case 'image': {
      const c = block.content || {};
      if (!c.src) return null;
      return (
        <figure>
          <img
            src={c.src}
            alt={c.caption || ''}
            data-themed-card
            className={imageWidthClass(c.width)}
          />
          {c.caption && (
            <figcaption className="mt-2 text-[13px] italic text-ink-soft">
              {c.caption}
            </figcaption>
          )}
        </figure>
      );
    }
    case 'video': {
      const c = block.content || {};
      const embed = toEmbeddableUrl(c.url);
      if (!c.url) return null;
      if (!embed) {
        return (
          <a
            href={c.url}
            target="_blank"
            rel="noreferrer"
            className="block break-all text-[13px] text-accent underline"
          >
            {c.url}
          </a>
        );
      }
      return (
        <figure>
          <div className="relative aspect-video w-full overflow-hidden rounded-md bg-black">
            <iframe
              src={embed}
              title="Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
          {c.caption && (
            <figcaption className="mt-2 text-[13px] italic text-ink-soft">
              {c.caption}
            </figcaption>
          )}
        </figure>
      );
    }
    case 'steps': {
      const items = Array.isArray(block.content) ? block.content : [];
      if (items.length === 0) return null;
      return (
        <ol className="space-y-3">
          {items.map((it, i) => (
            <li key={it.id} className="flex items-start gap-3">
              <span className="mt-[6px] font-serif italic text-[14px] text-ink-faint">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div
                className="rich-text flex-1 text-[16px] leading-[1.7] text-ink"
                dangerouslySetInnerHTML={{ __html: it.text || '' }}
              />
            </li>
          ))}
        </ol>
      );
    }
    case 'checklist': {
      const items = Array.isArray(block.content) ? block.content : [];
      if (items.length === 0) return null;
      return (
        <ul className="space-y-1.5">
          {items.map((it) => (
            <li key={it.id} className="flex items-start gap-2.5">
              <span
                className={`mt-[10px] flex h-3.5 w-3.5 items-center justify-center rounded border ${
                  it.done ? 'border-accent bg-accent text-canvas' : 'border-whisper bg-white'
                }`}
              >
                {it.done && (
                  <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3 8.5L6.5 12L13 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <div
                className={`rich-text flex-1 text-[15.5px] leading-[1.65] ${
                  it.done ? 'text-ink-muted line-through' : 'text-ink'
                }`}
                dangerouslySetInnerHTML={{ __html: it.text || '' }}
              />
            </li>
          ))}
        </ul>
      );
    }
    case 'divider':
      return <hr className="my-2 border-0 border-t border-whisper" />;
    case 'split':
      // Separate component so useSplitGridStyle's hook usage stays valid.
      return <ReadOnlySplit block={block} />;
    default:
      return null;
  }
}

function ReadOnlySplit({ block }) {
  const c = block.content || {};
  const cols = Array.isArray(c.columns) ? c.columns : [];
  const labels = c.labels || { left: '', right: '' };
  const gridStyle = useSplitGridStyle(c.ratio);

  return (
    <div className="space-y-3">
      {c.mode === 'slider' && <ComparisonSlider columns={cols} labels={labels} />}
      {c.mode === 'comparison' && (
        <div className="grid gap-5" style={gridStyle}>
          {['left', 'right'].map((side) => (
            <div
              key={side}
              className="text-center text-[10px] uppercase tracking-[0.22em] text-ink-muted"
            >
              {labels[side] || (side === 'left' ? 'Before' : 'After')}
            </div>
          ))}
        </div>
      )}
      <div className="grid gap-5" style={gridStyle}>
        {cols.map((col, i) => (
          <div key={i} className="space-y-3">
            {(col.blocks || []).map((nb) => (
              <ReadOnlyBlock key={nb.id} block={nb} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
