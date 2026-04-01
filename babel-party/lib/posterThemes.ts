export type PosterThemeId = 'retro' | 'neon' | 'minimal';

export type PosterTheme = {
  id: PosterThemeId;
  label: string;
  bg: string;
  ink: string;
  accent: string;
  accent2: string;
  badgeBg: string;
};

export const POSTER_THEMES: PosterTheme[] = [
  {
    id: 'retro',
    label: 'Retro',
    bg: '#2d1f3d',
    ink: '#f5e6ff',
    accent: '#ff6b9d',
    accent2: '#ffc857',
    badgeBg: '#1a1224',
  },
  {
    id: 'neon',
    label: 'Neon',
    bg: '#0a0a12',
    ink: '#e0f7fa',
    accent: '#00ffc8',
    accent2: '#ff00aa',
    badgeBg: '#12121c',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    bg: '#faf8f5',
    ink: '#1a1814',
    accent: '#c94f1a',
    accent2: '#3d3a34',
    badgeBg: '#f2efe9',
  },
];

export function randomPosterTheme(): PosterTheme {
  return POSTER_THEMES[Math.floor(Math.random() * POSTER_THEMES.length)]!;
}
