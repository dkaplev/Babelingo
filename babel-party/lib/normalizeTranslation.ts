/**
 * Translation APIs sometimes return URL-encoded or double-encoded text; MyMemory can
 * return %20 literals that decodeURIComponent skips when a malformed % sequence throws.
 */
export function normalizeTranslationText(raw: string): string {
  if (!raw) return raw;
  let t = raw.trim().replace(/\+/g, ' ');

  // Unwrap %25XX → %XX (e.g. %2520 → %20) a few times
  for (let k = 0; k < 6; k++) {
    const next = t.replace(/%25([0-9A-Fa-f]{2})/gi, '%$1');
    if (next === t) break;
    t = next;
  }

  for (let i = 0; i < 10; i++) {
    if (!/%[0-9A-Fa-f]{2}/.test(t)) break;
    try {
      const decoded = decodeURIComponent(t);
      if (decoded === t) break;
      t = decoded;
    } catch {
      // Salvage common encodings so the rest can decode on the next pass
      t = t
        .replace(/%20/gi, ' ')
        .replace(/%0[0-9a-f]/gi, ' ')
        .replace(/%2[Cc]/g, ',')
        .replace(/%2[Ee]/g, '.')
        .replace(/%21/g, '!')
        .replace(/%3[Ff]/g, '?')
        .replace(/%3[Aa]/g, ':')
        .replace(/%3[Bb]/g, ';');
    }
  }

  return t
    .replace(/%20/gi, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}
