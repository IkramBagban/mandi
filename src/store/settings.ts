import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { AppLanguage, DEFAULT_LANGUAGE, getDeviceLanguage, isSupportedLanguage } from '@/i18n';

export const SETTINGS_STORAGE_KEY = 'mandi-settings';

interface SettingsState {
  /** UI language. Defaults to Hindi; stored choice wins over the default. */
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: DEFAULT_LANGUAGE,
      setLanguage: (language) => set({ language }),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ language: state.language }) as SettingsState,
    },
  ),
);

interface BootstrappedLocale {
  language: AppLanguage;
  /** True when the value came from storage (user chose before). */
  fromStorage: boolean;
}

/**
 * Resolve the language to boot with, before the first render:
 * stored choice → device language (if we support it) → Hindi.
 *
 * Reads the zustand-persist payload directly so RTL flags can be applied
 * before any UI mounts.
 */
export async function bootstrapLocale(): Promise<BootstrappedLocale> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      const stored =
        typeof parsed === 'object' && parsed !== null
          ? (parsed as { state?: { language?: unknown } }).state?.language
          : null;
      if (isSupportedLanguage(stored)) {
        return { language: stored, fromStorage: true };
      }
    }
  } catch {
    // Corrupt storage must never block boot — fall through to defaults.
  }
  return { language: getDeviceLanguage() ?? DEFAULT_LANGUAGE, fromStorage: false };
}
