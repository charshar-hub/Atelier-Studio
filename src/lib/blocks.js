// Shared helpers for reading lesson sub-blocks in a type-aware way.
// Text/tips/custom/steps bodies may now contain light HTML (bold/italic/
// underline/lists/spans with our preset classes). These helpers return
// plain text for consumers that can't handle markup (AI payloads, text
// exports, contentful-ness checks).

// Strip lightweight rich-text HTML → plain text. Safe against missing DOM
// (SSR would bypass, but this app is client-only).
function htmlToPlain(html) {
  if (typeof html !== 'string' || !html) return '';
  if (typeof document === 'undefined') return html.replace(/<[^>]*>/g, '');
  const el = document.createElement('div');
  el.innerHTML = html;
  return el.textContent || '';
}

export function blockToPlainText(sb) {
  if (!sb) return '';
  switch (sb.type) {
    case 'steps':
      return (sb.items || [])
        .map((it, i) => {
          const text = htmlToPlain(it.text).trim();
          return text ? `${i + 1}. ${text}` : '';
        })
        .filter(Boolean)
        .join('\n');
    case 'bullet_list':
      return (sb.items || [])
        .map((it) => {
          const text = htmlToPlain(it.text).trim();
          const nestedLines = Array.isArray(it.blocks)
            ? it.blocks
                .map((nb) => {
                  if (!nb) return '';
                  if (nb.type === 'divider') return '---';
                  if (nb.type === 'image' || nb.type === 'comparison') return '';
                  return htmlToPlain(nb.content || '').trim();
                })
                .filter(Boolean)
                .map((line) => `    ${line}`)
                .join('\n')
            : '';
          if (!text && !nestedLines) return '';
          return nestedLines ? `• ${text}\n${nestedLines}` : `• ${text}`;
        })
        .filter(Boolean)
        .join('\n');
    case 'visual':
      return [sb.caption, ...(Array.isArray(sb.notes) ? sb.notes : [])]
        .filter((s) => typeof s === 'string' && s.trim())
        .join('\n');
    case 'comparison':
      return [sb.left?.label, sb.right?.label]
        .filter((s) => typeof s === 'string' && s.trim())
        .join(' · ');
    default:
      return htmlToPlain(sb.content);
  }
}

export function blockHasContent(sb) {
  if (!sb) return false;
  switch (sb.type) {
    case 'steps':
      return (sb.items || []).some(
        (it) => htmlToPlain(it.text).trim() || it.image?.src,
      );
    case 'bullet_list':
      return (sb.items || []).some((it) => {
        if (htmlToPlain(it.text).trim()) return true;
        return (
          Array.isArray(it.blocks) &&
          it.blocks.some((nb) => {
            if (!nb) return false;
            if (nb.type === 'image') return Boolean(nb.image?.src);
            if (nb.type === 'comparison')
              return Boolean(nb.left?.src || nb.right?.src);
            if (nb.type === 'divider') return true;
            return Boolean(htmlToPlain(nb.content || '').trim());
          })
        );
      });
    case 'visual':
      return (
        Boolean(sb.image?.src) ||
        Boolean(sb.caption && sb.caption.trim()) ||
        (Array.isArray(sb.notes) && sb.notes.some((n) => n && n.trim()))
      );
    case 'comparison':
      return Boolean(sb.left?.image?.src || sb.right?.image?.src);
    default:
      return Boolean(htmlToPlain(sb.content).trim());
  }
}
