import {
  makeBlock,
  makeBlockId,
  makeItemId,
  normalizeBlock,
  IMAGE_WIDTHS,
} from './blockTypes.js';

// -----------------------------------------------------------------------------
// Migration — flatten old nested bullet/section data into flat Block[]
// -----------------------------------------------------------------------------
// The old data shape had two problematic containers:
//
//   - subBlocks[]: a mixed array that could contain bullet_list blocks,
//     whose items each held a nested blocks[].
//   - bullet_list.items[].blocks[]: nested blocks inside every bullet item.
//
// Flattening rule: every bullet item becomes its own chain of flat blocks
// (one heading for its title + one flat block per nested block). This fixes
// the bug where only the *first* bullet used to convert — every bullet now
// surfaces as its own set of flat blocks.

function pushHeading(out, text, role) {
  const clean = (text || '').trim();
  if (!clean) return;
  out.push({
    id: makeBlockId(),
    type: 'heading',
    role,
    content: clean,
  });
}

function pushText(out, html, role) {
  if (typeof html !== 'string' || !html.trim()) return;
  out.push({
    id: makeBlockId(),
    type: 'text',
    role,
    content: html,
  });
}

function pushTip(out, html, role) {
  if (typeof html !== 'string' || !html.trim()) return;
  out.push({
    id: makeBlockId(),
    type: 'tip',
    role,
    content: html,
  });
}

function pushCallout(out, html) {
  if (typeof html !== 'string' || !html.trim()) return;
  out.push({
    id: makeBlockId(),
    type: 'callout',
    content: html,
  });
}

function pushImage(out, image, caption) {
  if (!image || typeof image.src !== 'string' || !image.src) return;
  out.push({
    id: makeBlockId(),
    type: 'image',
    content: {
      src: image.src,
      caption: typeof caption === 'string' ? caption : '',
      width: IMAGE_WIDTHS.includes(image.width) ? image.width : 'full',
    },
  });
}

function pushDivider(out) {
  out.push({ id: makeBlockId(), type: 'divider', content: null });
}

// Convert one nested block (from old bullet_list.items[].blocks[] or
// structureLesson AI output) into a flat block.
function flattenNestedBlock(out, nb) {
  if (!nb) return;
  switch (nb.type) {
    case 'divider':
      pushDivider(out);
      return;
    case 'image':
      pushImage(out, nb.image, '');
      return;
    case 'comparison':
      pushImage(out, nb.left, nb.leftLabel || '');
      pushImage(out, nb.right, nb.rightLabel || '');
      return;
    case 'tip':
      pushTip(out, nb.content);
      return;
    case 'note':
      // Notes were secondary callouts in the old model. Surface as text.
      pushText(out, nb.content);
      return;
    case 'text':
    default:
      pushText(out, nb.content);
  }
}

// Map an old subBlock (any of: text, tips, custom, deep_dive, steps,
// bullet_list, visual, comparison) into one or more flat blocks.
function flattenSubBlock(sb) {
  const out = [];
  if (!sb || typeof sb !== 'object') return out;

  const label = typeof sb.label === 'string' ? sb.label.trim() : '';

  switch (sb.type) {
    case 'text':
    case 'custom': {
      pushHeading(out, label, sb.role);
      pushText(out, sb.content, sb.role);
      return out;
    }
    case 'tips': {
      pushHeading(out, label, sb.role);
      pushTip(out, sb.content, sb.role);
      return out;
    }
    case 'deep_dive': {
      pushHeading(out, label);
      pushCallout(out, sb.content);
      return out;
    }
    case 'steps': {
      pushHeading(out, label, sb.role);
      const items = Array.isArray(sb.items) ? sb.items : [];
      const stepItems = items
        .map((it) => ({ id: makeItemId(), text: typeof it?.text === 'string' ? it.text : '' }))
        .filter((it) => it.text.trim());
      if (stepItems.length > 0) {
        out.push({
          id: makeBlockId(),
          type: 'steps',
          role: sb.role,
          content: stepItems,
        });
      }
      // Preserve any per-item images the old steps block had, as image blocks.
      items.forEach((it) => {
        if (it?.image?.src) pushImage(out, it.image, '');
      });
      return out;
    }
    case 'bullet_list': {
      pushHeading(out, label);
      const items = Array.isArray(sb.items) ? sb.items : [];
      // CRITICAL: iterate EVERY item so every bullet surfaces in the new
      // model. Each bullet → one heading + each nested block flattened.
      for (const item of items) {
        const text = typeof item?.text === 'string' ? item.text.trim() : '';
        if (text) pushHeading(out, text);
        const nested = Array.isArray(item?.blocks) ? item.blocks : [];
        for (const nb of nested) flattenNestedBlock(out, nb);
      }
      return out;
    }
    case 'visual': {
      if (label && label !== 'Visual example') pushHeading(out, label);
      pushImage(out, sb.image, sb.caption || '');
      const notes = Array.isArray(sb.notes) ? sb.notes.filter((n) => n && n.trim()) : [];
      for (const note of notes) pushText(out, note);
      return out;
    }
    case 'comparison': {
      pushHeading(out, label || 'Comparison');
      pushImage(out, sb.left?.image, sb.left?.label || 'Correct');
      pushImage(out, sb.right?.image, sb.right?.label || 'Incorrect');
      return out;
    }
    default: {
      // Unknown/legacy — preserve label + any string content as best we can.
      pushHeading(out, label);
      if (typeof sb.content === 'string') pushText(out, sb.content);
      return out;
    }
  }
}

// Public: migrate a raw lesson object (from Supabase or in-memory) into the
// new flat shape. Idempotent — lessons that already have `blocks` pass
// through normalized.
export function migrateLessonToBlocks(lesson) {
  if (!lesson || typeof lesson !== 'object') return lesson;

  if (Array.isArray(lesson.blocks)) {
    const { subBlocks: _drop, ...rest } = lesson;
    return { ...rest, blocks: lesson.blocks.map(normalizeBlock) };
  }

  const subBlocks = Array.isArray(lesson.subBlocks) ? lesson.subBlocks : [];
  const blocks = [];
  for (const sb of subBlocks) {
    const flat = flattenSubBlock(sb);
    for (const b of flat) blocks.push(normalizeBlock(b));
  }
  const { subBlocks: _removed, ...rest } = lesson;
  return { ...rest, blocks };
}

// -----------------------------------------------------------------------------
// AI response adapters — convert the legacy bullet-nested shapes that
// /api/generateLesson, /api/structureLesson and /api/expandLesson return
// into flat blocks. The frontend is the single point of flattening; the
// backend prompts stay unchanged.
// -----------------------------------------------------------------------------

// generateLesson / matchStyle / aiAction all return a flat object like:
//   { title, duration, summary, script, demoSteps, commonMistakes, proTip }
// Convert that into the canonical 4 role-tagged section blocks a new lesson
// body should contain: Script, Demo steps, Common mistakes, Pro tip.
export function buildBlocksFromLessonPayload(data) {
  const blocks = [];
  const roleSections = [
    { label: 'Script', text: data?.script, type: 'text', role: 'script' },
    { label: 'Demo steps', text: data?.demoSteps, type: 'steps-text', role: 'demoSteps' },
    { label: 'Common mistakes', text: data?.commonMistakes, type: 'tip', role: 'mistakes' },
    { label: 'Pro tip', text: data?.proTip, type: 'tip', role: 'tip' },
  ];

  for (const s of roleSections) {
    const text = typeof s.text === 'string' ? s.text.trim() : '';
    pushHeading(blocks, s.label, s.role);
    if (!text) continue;

    if (s.type === 'tip') {
      pushTip(blocks, text, s.role);
    } else if (s.type === 'steps-text') {
      const items = parseStepList(text);
      if (items.length > 0) {
        blocks.push({
          id: makeBlockId(),
          type: 'steps',
          role: s.role,
          content: items,
        });
      } else {
        pushText(blocks, text, s.role);
      }
    } else {
      pushText(blocks, text, s.role);
    }
  }
  return blocks;
}

function parseStepList(text) {
  if (!text) return [];
  // Prefer newline-separated numbered lists. Fall back to " · " / ";" / ","
  // if the AI returns a one-line "3 steps · A · B · C" form.
  const lines = text
    .split(/\n+/)
    .map((l) => l.replace(/^\s*\d+\s*[.)]\s*/, '').trim())
    .filter(Boolean);
  if (lines.length > 1) {
    return lines.map((t) => ({ id: makeItemId(), text: t }));
  }
  const flat = text.split(/\s*[·;]\s*/).map((s) => s.trim()).filter(Boolean);
  if (flat.length >= 2) {
    // Drop a leading "N steps" preamble if present.
    const cleaned = /^\d+\s+steps?/i.test(flat[0]) ? flat.slice(1) : flat;
    if (cleaned.length >= 2) {
      return cleaned.map((t) => ({ id: makeItemId(), text: t }));
    }
  }
  return [];
}

// structureLesson returns: { sections: [{ title, type: 'bullet_points'|'expand', items?|notes? }] }
// Flatten every bullet (and its nested blocks) into the flat block list.
export function buildBlocksFromStructureResponse(data) {
  const out = [];
  const sections = Array.isArray(data?.sections) ? data.sections : [];
  for (const section of sections) {
    const title = typeof section?.title === 'string' ? section.title.trim() : '';
    if (title) pushHeading(out, title);

    if (section?.type === 'expand') {
      const notes = typeof section?.notes === 'string' ? section.notes : '';
      pushCallout(out, notes);
      continue;
    }

    const items = Array.isArray(section?.items) ? section.items : [];
    for (const raw of items) {
      if (typeof raw === 'string') {
        pushText(out, raw.trim());
        continue;
      }
      if (!raw || typeof raw !== 'object') continue;
      const itemTitle = typeof raw.title === 'string' ? raw.title.trim()
        : typeof raw.text === 'string' ? raw.text.trim()
        : '';
      if (itemTitle) pushHeading(out, itemTitle);
      const nested = Array.isArray(raw.blocks) ? raw.blocks : [];
      for (const nb of nested) flattenNestedBlock(out, nb);
    }
  }
  return out;
}

// Build the { sections: [{ title, items: [...] }] } payload /api/expandLesson
// expects. We walk flat blocks, using each heading as a section title and
// collecting steps/checklist items (or any headings underneath) as bullets.
export function buildExpandSectionsFromBlocks(blocks) {
  if (!Array.isArray(blocks)) return [];
  const htmlPlain = (s) => {
    if (typeof s !== 'string' || !s) return '';
    if (typeof document === 'undefined') return s.replace(/<[^>]*>/g, '').trim();
    const el = document.createElement('div');
    el.innerHTML = s;
    return (el.textContent || '').trim();
  };
  const sections = [];
  let current = null;

  const flush = () => {
    if (current && current.items.length > 0) sections.push(current);
    current = null;
  };

  for (const b of blocks) {
    if (!b) continue;
    if (b.type === 'heading') {
      flush();
      current = { title: htmlPlain(b.content) || 'Section', items: [] };
      continue;
    }
    if (!current) current = { title: 'Section', items: [] };

    if (b.type === 'steps' || b.type === 'checklist') {
      const items = Array.isArray(b.content) ? b.content : [];
      for (const it of items) {
        const t = htmlPlain(it.text);
        if (t) current.items.push(t);
      }
    }
  }
  flush();
  return sections;
}

// expandLesson returns: { sections: [{ title, items: [{ bullet, expanded }] }] }
// Flatten every (bullet, expanded) pair into a heading + text block.
export function buildBlocksFromExpandResponse(data) {
  const out = [];
  const sections = Array.isArray(data?.sections) ? data.sections : [];
  for (const section of sections) {
    const title = typeof section?.title === 'string' ? section.title.trim() : '';
    if (title) pushHeading(out, title);
    const items = Array.isArray(section?.items) ? section.items : [];
    for (const it of items) {
      const bullet = typeof it?.bullet === 'string' ? it.bullet.trim() : '';
      const expanded = typeof it?.expanded === 'string' ? it.expanded.trim() : '';
      if (bullet) pushHeading(out, bullet);
      if (expanded) pushText(out, expanded);
    }
  }
  return out;
}
