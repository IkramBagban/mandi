/**
 * Mandi design tokens — the single source of truth for the visual language.
 *
 * The audience (traders / farmers, often low app-literacy) drives every value:
 * - 48dp+ touch targets, one primary action per screen
 * - icon + photo first, minimal text, very large numerals
 * - high contrast light theme (readable in harsh mandi sunlight)
 */

export const colors = {
  // Brand — deep mandi green, trustworthy + high contrast on white.
  primary: '#1B7A43',
  primaryDark: '#145C32',
  primarySoft: '#E3F2E9',

  // Surfaces / text — near-black on white for maximum legibility.
  background: '#FFFFFF',
  surface: '#F4F6F4',
  card: '#FFFFFF',
  text: '#101613',
  textMuted: '#4B5550',
  border: '#D8DDD9',

  // Money semantics — credit (lena/dena) must be instantly distinguishable.
  credit: '#1B7A43',
  debit: '#C62828',
  warning: '#B26A00',
  warningSoft: '#FFF4DE',

  // States.
  danger: '#C62828',
  dangerSoft: '#FDECEC',
  disabled: '#9AA39D',
  overlay: 'rgba(16, 22, 19, 0.45)',
} as const;

export type AppColors = typeof colors;

/** 4dp base scale. Screen padding is `lg`; cards use `md` gaps. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export type AppSpacing = typeof spacing;

/**
 * Type scale — deliberately large. `display`/`amount` are for money figures
 * (always tabular-ish, bold, never below 28sp).
 */
export const typography = {
  display: { fontSize: 40, lineHeight: 48, fontWeight: '700' },
  title: { fontSize: 28, lineHeight: 36, fontWeight: '700' },
  heading: { fontSize: 22, lineHeight: 30, fontWeight: '700' },
  body: { fontSize: 18, lineHeight: 26, fontWeight: '400' },
  bodyBold: { fontSize: 18, lineHeight: 26, fontWeight: '600' },
  button: { fontSize: 20, lineHeight: 28, fontWeight: '700' },
  caption: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  amount: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
} as const;

export type AppTypography = typeof typography;

export const radii = {
  sm: 8,
  md: 16,
  lg: 24,
  full: 999,
} as const;

/** Minimum touch target — 48dp is the floor, primary actions use 56dp+. */
export const touchTargets = {
  minimum: 48,
  primary: 60,
  avatar: 72,
} as const;

export const theme = {
  colors,
  spacing,
  typography,
  radii,
  touchTargets,
} as const;

export type AppTheme = typeof theme;
