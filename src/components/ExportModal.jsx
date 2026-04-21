import { useMemo, useState } from 'react';
import { blockToPlainText } from '../lib/blockTypes';

export default function ExportModal({ courseMeta, lessons, onClose }) {
  const text = useMemo(() => buildCourseText(courseMeta, lessons), [courseMeta, lessons]);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slugify(courseMeta.title)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintPdf = () => {
    const win = window.open('', '_blank', 'width=820,height=900');
    if (!win) {
      alert('Please allow pop-ups to print or save as PDF.');
      return;
    }
    win.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(courseMeta.title)}</title>
    <style>
      body { font-family: Georgia, 'Cormorant Garamond', serif; max-width: 720px; margin: 48px auto; padding: 0 40px; color: #2D221B; }
      pre { white-space: pre-wrap; word-wrap: break-word; font-family: inherit; font-size: 14px; line-height: 1.75; }
      @media print { body { margin: 0; padding: 24px 40px; } }
    </style>
  </head>
  <body>
    <pre>${escapeHtml(text)}</pre>
    <script>window.addEventListener('load', () => setTimeout(() => window.print(), 100));</script>
  </body>
</html>`);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 p-6 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-[min(920px,95vw)] flex-col overflow-hidden rounded-[14px] border border-whisper bg-paper shadow-2xl">
        <header className="flex items-start justify-between border-b border-whisper px-7 py-5">
          <div>
            <div className="mb-1 text-[10px] tracking-[0.25em] text-accent">EXPORT</div>
            <h2 className="font-serif text-[26px] leading-[1.2] tracking-tight text-ink">
              Export course
            </h2>
            <p className="mt-1.5 text-[13px] leading-[1.6] text-ink-soft">
              Copy to clipboard, download as plain text, or save as PDF.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close export"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition hover:bg-whisper hover:text-ink"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto bg-white px-7 py-5">
          <pre className="whitespace-pre-wrap break-words font-sans text-[13px] leading-[1.75] text-ink">
            {text}
          </pre>
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-whisper bg-canvas/40 px-7 py-4">
          <button
            onClick={onClose}
            className="h-9 rounded-md border border-whisper bg-transparent px-4 text-[13px] tracking-wide text-ink transition hover:bg-paper"
          >
            Close
          </button>
          <button
            onClick={handleDownloadTxt}
            className="h-9 rounded-md border border-whisper bg-white px-4 text-[13px] tracking-wide text-ink transition hover:bg-paper"
          >
            Download .txt
          </button>
          <button
            onClick={handlePrintPdf}
            className="h-9 rounded-md border border-whisper bg-white px-4 text-[13px] tracking-wide text-ink transition hover:bg-paper"
          >
            Save as PDF
          </button>
          <button
            onClick={handleCopy}
            className="h-9 rounded-md bg-ink px-5 text-[13px] tracking-wide text-canvas transition hover:bg-[#2A1F18]"
          >
            {copied ? 'Copied ✓' : 'Copy to clipboard'}
          </button>
        </footer>
      </div>
    </div>
  );
}

function buildCourseText(meta, lessons) {
  const sep = '─'.repeat(60);
  const lines = [];

  lines.push(meta.title.toUpperCase());
  lines.push('='.repeat(meta.title.length));
  lines.push('');
  lines.push(`Status: ${meta.status}`);
  lines.push('');
  lines.push(sep);
  lines.push('');
  lines.push(`MODULE ${meta.moduleNumber} OF ${meta.moduleCount}`);
  lines.push(meta.moduleTitle);
  if (meta.moduleSubtitle) {
    lines.push('');
    lines.push(meta.moduleSubtitle);
  }
  lines.push('');
  lines.push(sep);
  lines.push('');

  if (lessons.length === 0) {
    lines.push('(no lessons yet)');
    lines.push('');
  }

  lessons.forEach((lesson, i) => {
    lines.push(`LESSON ${lesson.number} · ${lesson.title || '(untitled)'}`);
    if (lesson.duration) lines.push(`Duration: ${lesson.duration}`);
    if (lesson.summary) {
      lines.push('');
      lines.push(lesson.summary);
    }
    // Flat block export: headings print in uppercase as section markers,
    // every other populated block prints its plain-text content underneath.
    const blocks = Array.isArray(lesson.blocks) ? lesson.blocks : [];
    for (const b of blocks) {
      const text = blockToPlainText(b);
      if (b.type === 'heading' && text && text.trim()) {
        lines.push('');
        lines.push(text.toUpperCase());
        continue;
      }
      if (!text || !text.trim()) continue;
      lines.push('');
      lines.push(text);
    }
    lines.push('');
    if (i < lessons.length - 1) {
      lines.push(sep);
      lines.push('');
    }
  });

  return lines.join('\n');
}

function slugify(str) {
  return (
    str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'course'
  );
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
