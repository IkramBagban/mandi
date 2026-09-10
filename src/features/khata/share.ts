import { Linking } from 'react-native';

/**
 * WhatsApp + phone transport for khata sharing and calling.
 * Message text itself is built by UI components with `t()` (translated);
 * this module only normalises numbers and opens the right app.
 * Never throws — callers get a status and show a friendly message.
 */

export type ShareStatus = 'opened' | 'noApp' | 'failed';

/** Indian mobile → `91XXXXXXXXXX` for wa.me links; null when unusable. */
export function toWhatsAppNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d]/g, '');
  if (/^[6-9]\d{9}$/.test(digits)) return `91${digits}`;
  if (/^91[6-9]\d{9}$/.test(digits)) return digits;
  return null;
}

/** Open WhatsApp with a prefilled khata summary (chat picker when no number). */
export async function shareKhataOnWhatsApp(
  phone: string | null | undefined,
  message: string,
): Promise<ShareStatus> {
  try {
    const number = toWhatsAppNumber(phone);
    const url = number
      ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
      : `whatsapp://send?text=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) return 'noApp';
    await Linking.openURL(url);
    return 'opened';
  } catch {
    return 'failed';
  }
}

/** Open the dialer for a person's number. */
export async function callPerson(phone: string | null | undefined): Promise<ShareStatus> {
  if (!phone) return 'failed';
  try {
    const url = `tel:${phone.replace(/[^\d+]/g, '')}`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) return 'noApp';
    await Linking.openURL(url);
    return 'opened';
  } catch {
    return 'failed';
  }
}
