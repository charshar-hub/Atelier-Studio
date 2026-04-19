import { useRef, useState } from 'react';
import { fileToResizedDataURL, imageWidthClass } from '../lib/images';

export default function ImageUploader({
  image,
  onChange,
  onRemove,
  showSizePicker = true,
  aspectHint = 'landscape',
  compact = false,
  placeholder = 'Upload image',
}) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const openFilePicker = () => inputRef.current?.click();

  const handleFiles = async (files) => {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    try {
      const src = await fileToResizedDataURL(file);
      onChange({ src, width: image?.width || 'full' });
    } catch (err) {
      console.error('Image upload failed:', err);
      setError('Could not read that image. Try another file.');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files);
  };

  if (!image?.src) {
    const dropHeight = compact
      ? 'h-[120px]'
      : aspectHint === 'square'
        ? 'aspect-square'
        : 'h-[180px]';
    return (
      <div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openFilePicker();
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!dragging) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`flex w-full ${dropHeight} flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 text-center transition ${
            dragging
              ? 'border-accent bg-paper/60 text-ink'
              : 'border-whisper bg-canvas/30 text-ink-muted hover:border-[#D4C5B0] hover:bg-paper/30 hover:text-ink'
          }`}
        >
          <span className="text-[22px] leading-none" aria-hidden="true">
            ⊕
          </span>
          <span className="mt-2 text-[11px] uppercase tracking-[0.16em]">
            {placeholder}
          </span>
          <span className="mt-1 text-[10.5px] italic text-ink-faint">
            or drag & drop
          </span>
        </button>
        {error && (
          <p className="mt-1.5 text-[11px] text-rose">{error}</p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className="group/upload relative">
      <div className={`flex w-full ${image.width === 'full' ? '' : 'justify-center'}`}>
        <img
          src={image.src}
          alt=""
          className={`rounded-lg ${imageWidthClass(image.width)} h-auto object-cover`}
          draggable={false}
        />
      </div>

      <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition group-hover/upload:opacity-100 focus-within:opacity-100">
        {showSizePicker && (
          <SizePicker
            width={image.width || 'full'}
            onChange={(w) => onChange({ ...image, width: w })}
          />
        )}
        <ToolbarButton
          onClick={(e) => {
            e.stopPropagation();
            openFilePicker();
          }}
          aria-label="Replace image"
        >
          Replace
        </ToolbarButton>
        {onRemove && (
          <ToolbarButton
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            aria-label="Remove image"
            danger
          >
            ×
          </ToolbarButton>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
    </div>
  );
}

function SizePicker({ width, onChange }) {
  const opts = [
    { key: 'small', label: 'S' },
    { key: 'medium', label: 'M' },
    { key: 'large', label: 'L' },
    { key: 'full', label: 'Full' },
  ];
  return (
    <div className="flex overflow-hidden rounded-md border border-whisper/80 bg-white/95 shadow-[0_1px_2px_rgba(42,31,27,0.08)]">
      {opts.map((o) => {
        const active = width === o.key;
        return (
          <button
            key={o.key}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(o.key);
            }}
            aria-label={`Size ${o.label}`}
            className={`h-6 px-2 text-[10px] tracking-wide transition ${
              active ? 'bg-ink text-canvas' : 'text-ink-muted hover:bg-paper hover:text-ink'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function ToolbarButton({ children, onClick, danger, ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-6 items-center rounded-md border border-whisper/80 bg-white/95 px-2 text-[10px] uppercase tracking-[0.15em] shadow-[0_1px_2px_rgba(42,31,27,0.08)] transition ${
        danger
          ? 'text-ink-muted hover:bg-rose/10 hover:text-rose'
          : 'text-ink-muted hover:bg-paper hover:text-ink'
      }`}
      {...rest}
    >
      {children}
    </button>
  );
}
