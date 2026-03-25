/**
 * Translation APIs sometimes return URL-encoded or double-encoded text; MyMemory can
 * return strings that re-encode to %2520 when sent through another request.
 */
export function normalizeTranslationText(raw: string): string {
  if (!raw) return raw;
  let t = raw.trim().replace(/\+/g, ' ');
  for (let i = 0; i < 5; i++) {
    if (!/%[0-9A-Fa-f]{2}/.test(t)) break;
    try {
      const next = decodeURIComponent(t);
      if (next === t) break;
      t = next;
    } catch {
      break;
    }
  }
  return t
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}
