import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { I18nextProvider } from 'react-i18next';

import i18n, { applyRtl, initI18n } from '@/i18n';
import { bootstrapLocale, useSettingsStore } from '@/store/settings';

void SplashScreen.preventAutoHideAsync();

/**
 * Boot order matters: stored/device language → RTL flags → i18n → UI.
 * RTL flags must land before the first render (esp. for Urdu), so we hold
 * the splash screen until locale bootstrap finishes.
 */
export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { language, fromStorage } = await bootstrapLocale();
        if (!fromStorage) {
          useSettingsStore.getState().setLanguage(language);
        }
        applyRtl(language);
        await initI18n(language);
      } catch {
        // Boot must never fail: fall back to Hindi strings.
        applyRtl('hi');
        await initI18n('hi');
      } finally {
        if (!cancelled) {
          setReady(true);
          await SplashScreen.hideAsync();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;

  return (
    <I18nextProvider i18n={i18n}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </I18nextProvider>
  );
}
