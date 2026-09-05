import { DashboardTheme, BackgroundMode } from '../types';

export const PRESET_THEMES: DashboardTheme[] = [
  {
    id: 'classic-amber',
    name: 'Classic CPALE Gold',
    description: 'Prestigious Philippine Board Exam gold on deep slate canvas',
    accentColor: '#F59E0B',
    secondaryAccentColor: '#3B82F6',
    backgroundMode: 'dark-slate',
    cardStyle: 'solid',
    fontStyle: 'serif-heading',
  },
  {
    id: 'emerald-scholar',
    name: 'Emerald Scholar',
    description: 'Calming pine & mint green for deep cognitive focus and retention',
    accentColor: '#10B981',
    secondaryAccentColor: '#06B6D4',
    backgroundMode: 'dark-slate',
    cardStyle: 'solid',
    fontStyle: 'modern-sans',
  },
  {
    id: 'sapphire-elite',
    name: 'Sapphire Academic',
    description: 'Vibrant cobalt & ice blue for analytical precision and clarity',
    accentColor: '#38BDF8',
    secondaryAccentColor: '#818CF8',
    backgroundMode: 'dark-midnight',
    cardStyle: 'solid',
    fontStyle: 'modern-sans',
  },
  {
    id: 'crimson-focus',
    name: 'Crimson Executive',
    description: 'Bold ruby rose on pitch obsidian for high intensity sprints',
    accentColor: '#F43F5E',
    secondaryAccentColor: '#FB7185',
    backgroundMode: 'dark-obsidian',
    cardStyle: 'solid',
    fontStyle: 'serif-heading',
  },
  {
    id: 'amethyst-royal',
    name: 'Amethyst Nocturne',
    description: 'Mystic royal violet & lavender glow for late-night review sessions',
    accentColor: '#A855F7',
    secondaryAccentColor: '#EC4899',
    backgroundMode: 'dark-slate',
    cardStyle: 'solid',
    fontStyle: 'serif-heading',
  },
  {
    id: 'espresso-study',
    name: 'Espresso Cafe',
    description: 'Warm caramel bronze on cozy dark roast brown atmosphere',
    accentColor: '#FB923C',
    secondaryAccentColor: '#FBBF24',
    backgroundMode: 'dark-espresso',
    cardStyle: 'solid',
    fontStyle: 'serif-heading',
  },
  {
    id: 'titanium-stealth',
    name: 'Titanium Stealth',
    description: 'High contrast crisp silver on pure obsidian black for zero distraction',
    accentColor: '#E2E8F0',
    secondaryAccentColor: '#94A3B8',
    backgroundMode: 'dark-obsidian',
    cardStyle: 'bordered',
    fontStyle: 'academic-mono',
  },
  {
    id: 'sunset-coral',
    name: 'Sunset Coral',
    description: 'Dynamic coral orange and magenta for energizing review drills',
    accentColor: '#FF6B6B',
    secondaryAccentColor: '#FFA07A',
    backgroundMode: 'dark-slate',
    cardStyle: 'solid',
    fontStyle: 'modern-sans',
  },
  {
    id: 'daylight-paper',
    name: 'Daylight Paper (Light)',
    description: 'Crisp warm ivory paper with rich ink typography for daytime focus',
    accentColor: '#D97706',
    secondaryAccentColor: '#2563EB',
    backgroundMode: 'light-ivory',
    cardStyle: 'solid',
    fontStyle: 'serif-heading',
  },
  {
    id: 'nordic-arctic',
    name: 'Nordic Frost (Light)',
    description: 'Cool minimalist white & deep slate blue for high readability',
    accentColor: '#0284C7',
    secondaryAccentColor: '#4F46E5',
    backgroundMode: 'light-slate',
    cardStyle: 'solid',
    fontStyle: 'modern-sans',
  },
  {
    id: 'botanical-sage',
    name: 'Botanical Sage (Light)',
    description: 'Soft herbal sage & forest ink for calm, fatigue-free daytime study',
    accentColor: '#059669',
    secondaryAccentColor: '#0D9488',
    backgroundMode: 'light-sage',
    cardStyle: 'solid',
    fontStyle: 'modern-sans',
  },
  {
    id: 'rose-quartz',
    name: 'Rose Quartz (Light)',
    description: 'Warm terracotta blush & deep crimson typography for elegant review',
    accentColor: '#E11D48',
    secondaryAccentColor: '#DB2777',
    backgroundMode: 'light-rose',
    cardStyle: 'solid',
    fontStyle: 'serif-heading',
  },
  {
    id: 'solar-sand',
    name: 'Golden Sandstone (Light)',
    description: 'Warm parchment with rich bronze and amber contrast',
    accentColor: '#B45309',
    secondaryAccentColor: '#EA580C',
    backgroundMode: 'light-sand',
    cardStyle: 'solid',
    fontStyle: 'serif-heading',
  },
];

export const DEFAULT_THEME: DashboardTheme = PRESET_THEMES[0];

export const POPULAR_ACCENT_COLORS = [
  { name: 'Amber Gold', hex: '#F59E0B' },
  { name: 'Emerald Green', hex: '#10B981' },
  { name: 'Sky Cyan', hex: '#38BDF8' },
  { name: 'Cobalt Blue', hex: '#3B82F6' },
  { name: 'Royal Purple', hex: '#8B5CF6' },
  { name: 'Magenta Pink', hex: '#EC4899' },
  { name: 'Crimson Rose', hex: '#F43F5E' },
  { name: 'Warm Orange', hex: '#F97316' },
  { name: 'Teal Mint', hex: '#14B8A6' },
  { name: 'Silver White', hex: '#E2E8F0' },
  { name: 'Gold Ochre', hex: '#D97706' },
  { name: 'Indigo Deep', hex: '#6366F1' },
];

export const POPULAR_TEXT_COLORS = [
  { name: 'Deep Charcoal Slate (Dark Ink)', hex: '#0F172A' },
  { name: 'Pure Obsidian Black', hex: '#020617' },
  { name: 'Warm Espresso Ink', hex: '#1C1917' },
  { name: 'Forest Night Ink', hex: '#064E3B' },
  { name: 'Navy Midnight Ink', hex: '#1E293B' },
  { name: 'Pure Crisp White', hex: '#FFFFFF' },
  { name: 'Cloud Slate Silver', hex: '#F8FAFC' },
  { name: 'Soft Warm Ivory', hex: '#FEF3C7' },
  { name: 'Mint Luminescence', hex: '#A7F3D0' },
  { name: 'Amber Luminescence', hex: '#FDE68A' },
  { name: 'Sky Blue Tint', hex: '#BAE6FD' },
  { name: 'Lavender Mist', hex: '#E9D5FF' },
];

export const POPULAR_CANVAS_COLORS = [
  { name: 'Pitch OLED', hex: '#030712', isLight: false },
  { name: 'Deep Slate', hex: '#020617', isLight: false },
  { name: 'Midnight Navy', hex: '#030816', isLight: false },
  { name: 'Warm Espresso', hex: '#120C0A', isLight: false },
  { name: 'Nordic Snow', hex: '#F8FAFC', isLight: true },
  { name: 'Daylight Ivory', hex: '#FBFAF6', isLight: true },
  { name: 'Botanical Sage', hex: '#F4F8F5', isLight: true },
  { name: 'Golden Sand', hex: '#FAF7F2', isLight: true },
  { name: 'Rose Linen', hex: '#FFF8F8', isLight: true },
];

export const BACKGROUND_MODE_DEFINITIONS: Record<
  BackgroundMode,
  {
    name: string;
    description: string;
    bgMain: string;
    bgCard: string;
    bgCardSubtle: string;
    bgSurfaceHover: string;
    border: string;
    textMain: string;
    textMuted: string;
    textDim: string;
    isLight: boolean;
  }
> = {
  'dark-slate': {
    name: 'Deep Slate',
    description: 'Calm navy-slate dark mode',
    bgMain: '#020617',
    bgCard: '#0f172a',
    bgCardSubtle: '#090d16',
    bgSurfaceHover: '#1e293b',
    border: '#1e293b',
    textMain: '#f8fafc',
    textMuted: '#cbd5e1',
    textDim: '#94a3b8',
    isLight: false,
  },
  'dark-obsidian': {
    name: 'Pitch Obsidian',
    description: 'Ultra dark OLED black canvas',
    bgMain: '#030712',
    bgCard: '#111827',
    bgCardSubtle: '#080c14',
    bgSurfaceHover: '#1f2937',
    border: '#1f2937',
    textMain: '#f9fafb',
    textMuted: '#e5e7eb',
    textDim: '#9ca3af',
    isLight: false,
  },
  'dark-midnight': {
    name: 'Midnight Navy',
    description: 'Deep royal blue maritime atmosphere',
    bgMain: '#030816',
    bgCard: '#0c1527',
    bgCardSubtle: '#060c1c',
    bgSurfaceHover: '#172554',
    border: '#1e293b',
    textMain: '#f0f9ff',
    textMuted: '#cbd5e1',
    textDim: '#94a3b8',
    isLight: false,
  },
  'dark-espresso': {
    name: 'Warm Espresso',
    description: 'Cozy coffee-shop dark roast brown',
    bgMain: '#120c0a',
    bgCard: '#1c1411',
    bgCardSubtle: '#0f0907',
    bgSurfaceHover: '#2e211c',
    border: '#2e211c',
    textMain: '#fef3c7',
    textMuted: '#fde68a',
    textDim: '#d4b499',
    isLight: false,
  },
  'light-ivory': {
    name: 'Daylight Ivory',
    description: 'Warm cream book paper finish',
    bgMain: '#fbfaf6',
    bgCard: '#ffffff',
    bgCardSubtle: '#f4efe6',
    bgSurfaceHover: '#eae3d5',
    border: '#e2d9cc',
    textMain: '#1c1917',
    textMuted: '#292524',
    textDim: '#57534e',
    isLight: true,
  },
  'light-slate': {
    name: 'Clean Arctic Slate',
    description: 'Crisp light gray and slate',
    bgMain: '#f8fafc',
    bgCard: '#ffffff',
    bgCardSubtle: '#f1f5f9',
    bgSurfaceHover: '#e2e8f0',
    border: '#cbd5e1',
    textMain: '#0f172a',
    textMuted: '#1e293b',
    textDim: '#475569',
    isLight: true,
  },
  'light-sage': {
    name: 'Botanical Sage',
    description: 'Soft herbal mint & ivory',
    bgMain: '#f4f8f5',
    bgCard: '#ffffff',
    bgCardSubtle: '#e6f0e9',
    bgSurfaceHover: '#d5e6db',
    border: '#c3dacb',
    textMain: '#064e3b',
    textMuted: '#14532d',
    textDim: '#365314',
    isLight: true,
  },
  'light-sand': {
    name: 'Golden Sandstone',
    description: 'Warm parchment with bronze contrast',
    bgMain: '#faf7f2',
    bgCard: '#ffffff',
    bgCardSubtle: '#f3ece1',
    bgSurfaceHover: '#e9dfd0',
    border: '#dcceba',
    textMain: '#451a03',
    textMuted: '#78350f',
    textDim: '#854d0e',
    isLight: true,
  },
  'light-rose': {
    name: 'Rose Quartz & Linen',
    description: 'Gentle blush linen & burgundy ink',
    bgMain: '#fff8f8',
    bgCard: '#ffffff',
    bgCardSubtle: '#fae8e8',
    bgSurfaceHover: '#f5d6d6',
    border: '#ecc2c2',
    textMain: '#4c0519',
    textMuted: '#881337',
    textDim: '#9f1239',
    isLight: true,
  },
};

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = (hex || '#000000').replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) {
    return { r: 245, g: 158, b: 11 };
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function adjustColorBrightness(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const factor = 1 + percent / 100;
  const newR = Math.min(255, Math.max(0, Math.round(r * factor)));
  const newG = Math.min(255, Math.max(0, Math.round(g * factor)));
  const newB = Math.min(255, Math.max(0, Math.round(b * factor)));
  return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
}

export function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  // YIQ luminance formula
  return (r * 299 + g * 587 + b * 114) / 1000;
}

export function getContrastTextColor(hex: string): string {
  const yiq = getLuminance(hex);
  return yiq >= 140 ? '#020617' : '#ffffff';
}

export function isColorLight(hex: string): boolean {
  return getLuminance(hex) >= 140;
}

export function applyThemeToDocument(theme: DashboardTheme): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const bgDef = BACKGROUND_MODE_DEFINITIONS[theme.backgroundMode] || BACKGROUND_MODE_DEFINITIONS['dark-slate'];
  const accentRgb = hexToRgb(theme.accentColor);
  const accentDark = adjustColorBrightness(theme.accentColor, -20);
  const accentLight = adjustColorBrightness(theme.accentColor, 25);
  const contrastText = getContrastTextColor(theme.accentColor);

  // Determine if active theme is light or dark
  const isThemeLight = theme.customBgColor ? isColorLight(theme.customBgColor) : bgDef.isLight;

  // Background and surfaces
  const resolvedBg = theme.customBgColor || bgDef.bgMain;
  const resolvedCard =
    theme.customCardColor ||
    (theme.customBgColor
      ? isThemeLight
        ? '#ffffff'
        : adjustColorBrightness(resolvedBg, 12)
      : bgDef.bgCard);
  const resolvedCardSubtle = theme.customBgColor
    ? isThemeLight
      ? adjustColorBrightness(resolvedBg, -4)
      : adjustColorBrightness(resolvedBg, 6)
    : bgDef.bgCardSubtle;
  const resolvedSurfaceHover = theme.customBgColor
    ? isThemeLight
      ? adjustColorBrightness(resolvedBg, -10)
      : adjustColorBrightness(resolvedBg, 18)
    : bgDef.bgSurfaceHover;
  const resolvedBorder = theme.customBgColor
    ? isThemeLight
      ? adjustColorBrightness(resolvedBg, -18)
      : adjustColorBrightness(resolvedBg, 22)
    : bgDef.border;

  // Text defaults based on canvas lightness
  const defaultTextMain = isThemeLight ? '#0f172a' : '#f8fafc';
  const defaultTextMuted = isThemeLight ? '#334155' : '#94a3b8';
  const defaultTextDim = isThemeLight ? '#64748b' : '#64748b';

  const resolvedTextMain = theme.textColor || (theme.customBgColor ? defaultTextMain : bgDef.textMain);
  const resolvedTextMuted =
    theme.textMutedColor ||
    (theme.textColor
      ? adjustColorBrightness(theme.textColor, isThemeLight ? 35 : -35)
      : theme.customBgColor
      ? defaultTextMuted
      : bgDef.textMuted);
  const resolvedTextDim = theme.customBgColor ? defaultTextDim : bgDef.textDim;

  // Set CSS Variables
  root.style.setProperty('--theme-accent', theme.accentColor);
  root.style.setProperty('--theme-accent-rgb', `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`);
  root.style.setProperty('--theme-accent-hover', accentDark);
  root.style.setProperty('--theme-accent-light', accentLight);
  root.style.setProperty('--theme-accent-contrast', contrastText);
  root.style.setProperty('--theme-secondary', theme.secondaryAccentColor || '#3B82F6');

  // Background and surfaces
  root.style.setProperty('--theme-bg', resolvedBg);
  root.style.setProperty('--theme-card', resolvedCard);
  root.style.setProperty('--theme-card-subtle', resolvedCardSubtle);
  root.style.setProperty('--theme-surface-hover', resolvedSurfaceHover);
  root.style.setProperty('--theme-border', resolvedBorder);
  root.style.setProperty('--theme-text-main', resolvedTextMain);
  root.style.setProperty('--theme-text-muted', resolvedTextMuted);
  root.style.setProperty('--theme-text-dim', resolvedTextDim);

  // Set body background and text
  document.body.style.backgroundColor = resolvedBg;
  document.body.style.color = resolvedTextMain;

  // Toggle classes on html root
  if (isThemeLight) {
    root.classList.add('theme-light');
    root.classList.remove('theme-dark');
    root.classList.remove('dark');
  } else {
    root.classList.add('theme-dark');
    root.classList.add('dark');
    root.classList.remove('theme-light');
  }

  // Heading font family
  if (theme.fontStyle === 'modern-sans') {
    root.style.setProperty('--theme-heading-font', "'Plus Jakarta Sans', sans-serif");
  } else if (theme.fontStyle === 'academic-mono') {
    root.style.setProperty('--theme-heading-font', "'JetBrains Mono', monospace");
  } else {
    root.style.setProperty('--theme-heading-font', "'Instrument Serif', Georgia, serif");
  }
}
