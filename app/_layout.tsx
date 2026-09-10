import { useEffect, useState } from 'react';
import { router, Stack, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { I18nextProvider } from 'react-i18next';

import i18n, { applyRtl, initI18n } from '@/i18n';
import { AuthProvider, useAuth } from '@/features/auth';
import { bootstrapLocale, useSettingsStore } from '@/store/settings';

void SplashScreen.preventAutoHideAsync();

/**
 * Boot order matters: stored/device language → RTL flags → i18n → UI.
 * RTL flags must land before the first render (esp. for Urdu), so we hold
 * the splash screen until locale bootstrap AND the persisted session check
 * finish — logged-out users must never glimpse the tabs.
 */
export default function RootLayout() {
  const [localeReady, setLocaleReady] = useState(false);

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
        if (!cancelled) setLocaleReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!localeReady) return null;

  return (
    <I18nextProvider i18n={i18n}>
      <StatusBar style="auto" />
      <AuthProvider>
        <GatedStack />
      </AuthProvider>
    </I18nextProvider>
  );
}

/**
 * Route gate: logged-out users see the auth stack only; signed-in users are
 * kept out of it. When Supabase isn't configured (UI-stub mode) the gate
 * stays open so the tabs remain explorable without a project.
 *
 * One exception: set-password NEEDS the fresh OTP-verify session (signup
 * and recovery land there signed-in), so signed-in users may stay on it.
 */
function GatedStack() {
  const { ready, configured, user } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (!ready) return;
    void SplashScreen.hideAsync();
  }, [ready]);

  useEffect(() => {
    if (!ready || !configured) return;
    const inAuth = segments[0] === '(auth)';
    const settingPassword = inAuth && segments.includes('password');
    if (!user && !inAuth) {
      router.replace('/(auth)');
    } else if (user && inAuth && !settingPassword) {
      router.replace('/(tabs)');
    }
  }, [ready, configured, user, segments]);

  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="person/[id]" />
      <Stack.Screen name="record/new" />
    </Stack>
  );
}
