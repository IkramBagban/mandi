/**
 * Commodity + quality-grade starter list for the sale form.
 *
 * The form shows these as big tap chips (no typing needed) with the first
 * commodity (`mosambi`) and its first grade (`1no`) preselected. Grades are
 * mandi shorthand ("1no"/"2no") — intentionally NOT localized, like SKUs.
 * Commodity *names* are localized via `t('commodities.<id>')`.
 *
 * Stored in `sale_records.commodity` / `.variety` as these plain ids.
 */

export interface Commodity {
  id: string;
  /** Grades in display order; the first is the default. */
  grades: string[];
}

export const COMMODITIES: Commodity[] = [
  { id: 'mosambi', grades: ['1no', '2no'] },
  { id: 'santra', grades: ['1no', '2no'] },
  { id: 'anar', grades: ['1no', '2no'] },
  { id: 'kela', grades: ['robusta', 'local'] },
  { id: 'pyaz', grades: ['mota', 'chhota'] },
  { id: 'tamatar', grades: ['desi', 'hybrid'] },
];

export const DEFAULT_COMMODITY_ID = 'mosambi';

export function gradesFor(commodityId: string): string[] {
  return COMMODITIES.find((c) => c.id === commodityId)?.grades ?? [];
}

export function defaultGradeFor(commodityId: string): string {
  return gradesFor(commodityId)[0] ?? '';
}

/**
 * Localized commodity name. The cast keeps one call-site instead of a switch
 * per screen: every `commodities.*` key exists in all locale files (CI check:
 * the i18n parity script in the PR notes).
 */
export function commodityLabel(t: (key: 'commodities.mosambi') => string, id: string): string {
  return t(`commodities.${id}` as 'commodities.mosambi');
}
