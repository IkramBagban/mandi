import * as Localization from 'expo-localization';
import { createInstance } from 'i18next';
import { I18nManager, Platform } from 'react-native';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';
import ur from './locales/ur.json';

export const SUPPORTED_LANGUAGES = ['en', 'hi', 'mr', 'ur'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** App opens in Hindi unless the user already picked (and stored) a language. */
export const DEFAULT_LANGUAGE: AppLanguage = 'hi';

/** Languages that need a right-to-left layout. */
const RTL_LANGUAGES: readonly AppLanguage[] = ['ur'];

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  mr: { translation: mr },
  ur: { translation: ur },
} as const;

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: typeof resources;
  }
}

export function isSupportedLanguage(value: unknown): value is AppLanguage {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

export function isRtlLanguage(language: AppLanguage): boolean {
  return RTL_LANGUAGES.includes(language);
}

/**
 * Apply the RTL direction flags for the given language.
 *
 * NOTE: `forceRTL` only takes full effect after the app reloads (a React
 * Native limitation, not ours). The settings screen tells the user to restart
 * once when switching to/from Urdu — see `settings.restartNote`.
 */
export function applyRtl(language: AppLanguage): void {
  if (Platform.OS === 'web') return;
  const rtl = isRtlLanguage(language);
  I18nManager.allowRTL(rtl);
  if (I18nManager.isRTL !== rtl) {
    I18nManager.forceRTL(rtl);
  }
}

/** Best-effort device language — only used when no stored choice exists. */
export function getDeviceLanguage(): AppLanguage | null {
  const code = Localization.getLocales()[0]?.languageCode ?? null;
  return code && isSupportedLanguage(code) ? code : null;
}

const i18n = createInstance();

let initPromise: Promise<void> | null = null;

/** Initialise i18next once. Safe to call from every bootstrap path. */
export function initI18n(language: AppLanguage): Promise<void> {
  if (!initPromise) {
    initPromise = i18n
      .use(initReactI18next)
      .init({
        resources,
        lng: language,
        fallbackLng: DEFAULT_LANGUAGE,
        interpolation: { escapeValue: false },
      })
      .then(() => undefined);
  }
  return initPromise;
}

/**
 * Switch language at runtime: updates i18next + RTL flags and persists the
 * choice through the settings store. The caller owns UI state.
 */
export async function changeAppLanguage(
  language: AppLanguage,
  persist: (language: AppLanguage) => void,
): Promise<void> {
  persist(language);
  applyRtl(language);
  await i18n.changeLanguage(language);
}

export default i18n;
