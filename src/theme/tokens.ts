/**
 * Mandi design tokens — the single source of truth for the visual language.
 *
 * The audience (traders / farmers, often low app-literacy) still drives the
 * floor: 44dp+ touch targets, one primary action per screen, icon + photo
 * first, minimal text, big numerals for MONEY.
 *
 * Refinement rules (compact but never cramped):
 * - Large numerals ONLY where money matters: balances, totals, bill amounts
 *   (`display` / `amount`). Chrome, labels and rows use the compact scale.
 * - Cards lift with a hairline border + soft shadow, never 2dp outlines.
 * - Dividers are 1dp `hairline`, not full borders around everything.
 * - No uppercase text transforms (Urdu/Arabic script has no uppercase).
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
  text: '#1A211D',
  textMuted: '#5A6460',
  textFaint: '#8A938E',
  border: '#D8DDD9',
  /** 1dp dividers and card outlines — lighter than the old 2dp boxes. */
  hairline: '#E6EAE7',

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

/** 4dp base scale. Screen padding is `lg`; rows/cards use `md`/`sm` gaps. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export type AppSpacing = typeof spacing;

/**
 * Type scale — compact chrome, large money.
 * - `display` (32): hero money only — lifetime balance, bill net.
 * - `amount` (24): secondary money — card totals, day totals.
 * - `title` (22): screen titles. `heading` (17): sections + row amounts.
 * - `body` (15) / `caption` (13): everything else. `label` (12): eyebrows.
 */
export const typography = {
  display: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
  amount: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  heading: { fontSize: 17, lineHeight: 24, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodyBold: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  button: { fontSize: 16, lineHeight: 24, fontWeight: '700' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '700' },
} as const;

export type AppTypography = typeof typography;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;

/** Minimum touch target — 44dp is the floor, primary actions use 52dp. */
export const touchTargets = {
  minimum: 44,
  primary: 52,
  avatar: 44,
} as const;

/**
 * Card lift: hairline border + soft shadow instead of heavy 2dp outlines.
 * Spread onto card styles: `...shadows.card`.
 */
export const shadows = {
  card: {
    shadowColor: '#101613',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  pop: {
    shadowColor: '#101613',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

export const theme = {
  colors,
  spacing,
  typography,
  radii,
  touchTargets,
  shadows,
} as const;

export type AppTheme = typeof theme;
