/**
 * Shareable “moment” copy — PRD: optional share card export, TikTok-style captions,
 * “why this sounded strange” / meme-adjacent social hooks.
 */
export type MomentPayload = {
  mangled: string;
  originalEnglish?: string;
  languageLabel?: string;
  playerName?: string;
};

export type MomentTemplate = {
  id: string;
  label: string;
  build: (p: MomentPayload) => string;
  /** Short line at top of share graphic */
  graphicBanner: string;
  /** Optional second line under banner */
  graphicStamp?: string;
};

export const MOMENT_TEMPLATES: MomentTemplate[] = [
  {
    id: 'political',
    label: 'Fake campaign slogan',
    build: (p) =>
      `🗳️ PAID FOR BY THE COMMITTEE TO CONFUSE ENGLISH\n\n"${p.mangled}"\n\n— ${p.playerName ?? 'A registered chaos voter'} · Babelingo`,
    graphicBanner: 'COMMITTEE TO CONFUSE ENGLISH',
    graphicStamp: 'APPROVED PARTY LINE',
  },
  {
    id: 'breaking',
    label: 'Breaking news chyron',
    build: (p) =>
      `BREAKING: Experts say "${p.mangled}"${p.languageLabel ? ` (${p.languageLabel} pipeline)` : ''}\n\nSource: Babelingo wire · not fact-checked`,
    graphicBanner: 'BREAKING',
    graphicStamp: 'BABELINGO WIRE · NOT FACT-CHECKED',
  },
  {
    id: 'motivational',
    label: 'Motivational poster',
    build: (p) =>
      `LIVE • LAUGH • LOSE THE SUBTEXT\n\n"${p.mangled}"\n\nHang this in your kitchen · Babelingo`,
    graphicBanner: 'LIVE · LAUGH · LOSE THE SUBTEXT',
    graphicStamp: 'DAILY AFFIRMATION',
  },
  {
    id: 'movie',
    label: 'Movie tagline',
    build: (p) =>
      `THIS SUMMER… ONE PHONE… ZERO LINGUISTIC INTEGRITY\n\n"${p.mangled}"\n\nRated Party · Babelingo`,
    graphicBanner: 'THIS SUMMER',
    graphicStamp: 'RATED PARTY',
  },
  {
    id: 'conspiracy',
    label: 'Conspiracy whiteboard',
    build: (p) =>
      `THEY DON'T WANT YOU TO KNOW\n\n"${p.mangled}"\n\n${p.originalEnglish ? `Original: "${p.originalEnglish}"\n\n` : ''}Wake up sheeple · Babelingo`,
    graphicBanner: 'THEY DON’T WANT YOU TO KNOW',
    graphicStamp: 'CONNECT THE DOTS',
  },
];
