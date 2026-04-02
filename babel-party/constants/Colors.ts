/** Neon Retro — party game night (magenta / cyan / orange on dark navy). */
const navy = '#1A1B4B';
/** Same as `navy` — `babelingo-title.png` is exported on this flat fill so the home screen must match. */
const logoBackdrop = navy;
const navyMid = '#24285F';
const navyCard = '#2A2E72';
const magenta = '#D527B7';
const cyan = '#48D6D2';
const orange = '#F9C46B';

export default {
  party: {
    /** ~10% — primary CTAs */
    accent: magenta,
    /** ~30% — secondary panels, chips, neon borders */
    accent2: cyan,
    /** Joy / highlights / “hero” type */
    accentPop: orange,
    /** ~60% — base */
    surface: navy,
    /** Home / logo strip — matches PNG background */
    logoBackdrop,
    /** Dim layer over NesBackground when using logoBackdrop (navy @ 88%). */
    logoBackdropOverlay: 'rgba(26, 27, 75, 0.88)',
    surface2: navyMid,
    card: navyCard,
    text: '#F4F6FF',
    textMuted: '#9BA3E8',
    borderSubtle: '#3D4278',
    /** High-contrast outline (replaces doodle ink) */
    neonStroke: cyan,
    danger: '#FF5C7A',
    success: cyan,
    podiumGold: orange,
    podiumSilver: cyan,
    podiumBronze: '#B01D94',
  },
  light: {
    text: '#F4F6FF',
    background: navy,
    tint: magenta,
    tabIconDefault: '#9BA3E8',
    tabIconSelected: cyan,
  },
  dark: {
    text: '#F4F6FF',
    background: navy,
    tint: cyan,
    tabIconDefault: '#9BA3E8',
    tabIconSelected: orange,
  },
};
