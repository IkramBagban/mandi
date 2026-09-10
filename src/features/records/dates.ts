/** Local-calendar YYYY-MM-DD helpers (DB `date` columns use this shape). */

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Today's date on the device calendar, e.g. "2026-09-10". */
export function todayISODate(): string {
  return toISODate(new Date());
}

/** Shift a YYYY-MM-DD string by whole days (used by the day stepper). */
export function addDaysISO(dateISO: string, deltaDays: number): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  dt.setDate(dt.getDate() + deltaDays);
  return toISODate(dt);
}

export function isTodayISO(dateISO: string): boolean {
  return dateISO === todayISODate();
}
