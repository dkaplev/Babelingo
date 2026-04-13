import type { AppGameId } from '@/lib/types';

/** Visual theme per game mode (accents + neon); base surfaces stay readable on dark. */
export type PartyPalette = {
  accent: string;
  accent2: string;
  accentPop: string;
  surface: string;
  surface2: string;
  card: string;
  text: string;
  textMuted: string;
  borderSubtle: string;
  neonStroke: string;
  danger: string;
  success: string;
  podiumGold: string;
  podiumSilver: string;
  podiumBronze: string;
};

const baseSurfaces = {
  surface: '#1A1B4B',
  surface2: '#24285F',
  card: '#2A2E72',
  text: '#F4F6FF',
  textMuted: '#9BA3E8',
  borderSubtle: '#3D4278',
  danger: '#FF5C7A',
};

/** Echo Translator — blue-shifted card vs Babel’s violet so pick-game cards read as three hues. */
const echo: PartyPalette = {
  ...baseSurfaces,
  card: '#2A3D78',
  surface2: '#24356A',
  borderSubtle: '#3D5288',
  accent: '#D527B7',
  accent2: '#48D6D2',
  accentPop: '#F9C46B',
  neonStroke: '#48D6D2',
  success: '#48D6D2',
  podiumGold: '#F9C46B',
  podiumSilver: '#48D6D2',
  podiumBronze: '#B01D94',
};

/** Babel Phone — deep violet “chain” panel (distinct from Echo’s navy card). */
const babel: PartyPalette = {
  ...baseSurfaces,
  surface2: '#2D1B4E',
  card: '#3D2668',
  borderSubtle: '#5B3D8C',
  accent: '#A78BFA',
  accent2: '#38BDF8',
  accentPop: '#FBBF24',
  neonStroke: '#C4B5FD',
  success: '#38BDF8',
  podiumGold: '#FBBF24',
  podiumSilver: '#C4B5FD',
  podiumBronze: '#7C3AED',
};

/** Reverse Audio — emerald / mint / lime on deep teal card bias. */
const reverse: PartyPalette = {
  ...baseSurfaces,
  card: '#1E3D3A',
  surface2: '#243F3C',
  accent: '#10B981',
  accent2: '#5EEAD4',
  accentPop: '#BEF264',
  neonStroke: '#34D399',
  success: '#5EEAD4',
  podiumGold: '#BEF264',
  podiumSilver: '#5EEAD4',
  podiumBronze: '#059669',
};

/** Halloumi Mode — Greek flag blue + white + golden cheese on deep navy. */
const halloumi: PartyPalette = {
  ...baseSurfaces,
  surface: '#0D1B3E',
  surface2: '#122050',
  card: '#1A2D6B',
  borderSubtle: '#1E4098',
  accent: '#0D5EAF',
  accent2: '#FFFFFF',
  accentPop: '#F5C842',
  neonStroke: '#1B69C8',
  success: '#FFFFFF',
  podiumGold: '#F5C842',
  podiumSilver: '#AABDE8',
  podiumBronze: '#0D5EAF',
};

export function getPartyPalette(appGame: AppGameId): PartyPalette {
  if (appGame === 'babel_phone') return babel;
  if (appGame === 'reverse_audio') return reverse;
  if (appGame === 'halloumi_mode') return halloumi;
  return echo;
}
