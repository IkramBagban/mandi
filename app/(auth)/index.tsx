import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BigButton, Screen, ScreenSpacer } from '@/components';
import {
  mapAuthErrorToKey,
  PasswordInput,
  PhoneEntry,
  PhoneField,
  signInWithPassword,
  validatePassword,
} from '@/features/auth';
import { isOtpEnabled } from '@/lib/authFlags';
import { validateIndianPhone } from '@/lib/validation';
import { colors, radii, spacing, touchTargets, typography } from '@/theme';

type LoginTab = 'password' | 'otp';

/**
 * Login — password FIRST (zero SMS), OTP second and flag-gated.
 *
 * OTP tab exists only when `EXPO_PUBLIC_OTP_ENABLED=true` (see
 * `lib/authFlags`); with the flag off this screen is password-only and no
 * OTP code path is reachable from anywhere. New users go to
 * `Create account`, locked-out users to `Forgot password?`.
 */
export default function LoginScreen() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<LoginTab>('password');
  const otpOn = isOtpEnabled();

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('auth.title')}</Text>
        <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>
      </View>

      {otpOn ? (
        <View style={styles.tabs} accessibilityRole="tablist">
          <Pressable
            onPress={() => setTab('password')}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === 'password' }}
            accessibilityLabel={t('auth.passwordTab')}
            testID="auth-tab-password"
            style={({ pressed }) => [
              styles.tab,
              tab === 'password' && styles.tabActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.tabLabel, tab === 'password' && styles.tabLabelActive]}>
              {t('auth.passwordTab')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTab('otp')}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === 'otp' }}
            accessibilityLabel={t('auth.otpTab')}
            testID="auth-tab-otp"
            style={({ pressed }) => [
              styles.tab,
              tab === 'otp' && styles.tabActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.tabLabel, tab === 'otp' && styles.tabLabelActive]}>
              {t('auth.otpTab')}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {tab === 'password' || !otpOn ? (
        <PasswordTab />
      ) : (
        <PhoneEntry purpose="login" testIDPrefix="auth-otp" />
      )}

      <ScreenSpacer size={spacing.sm} />
      <Pressable
        onPress={() => router.push('/(auth)/signup')}
        accessibilityRole="button"
        accessibilityLabel={t('auth.createAccount')}
        testID="auth-goto-signup"
        style={({ pressed }) => [styles.link, pressed && styles.pressed]}
      >
        <Text style={styles.linkLabel}>{t('auth.createAccount')}</Text>
      </Pressable>
      {tab === 'password' ? (
        <Pressable
          onPress={() => router.push('/(auth)/forgot')}
          accessibilityRole="button"
          accessibilityLabel={t('auth.forgotPassword')}
          testID="auth-goto-forgot"
          style={({ pressed }) => [styles.link, pressed && styles.pressed]}
        >
          <Text style={styles.linkLabel}>{t('auth.forgotPassword')}</Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}

function PasswordTab() {
  const { t } = useTranslation();
  const [phoneRaw, setPhoneRaw] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const phone = validateIndianPhone(phoneRaw);
  const passwordCheck = validatePassword(password);
  const phoneError = touched && !phone.ok ? t(phone.errorKey) : null;
  const passwordError =
    (touched && !passwordCheck.ok ? t(passwordCheck.errorKey) : null) ??
    (loginError ? t(loginError) : null);

  const login = async () => {
    setTouched(true);
    if (!phone.ok || !passwordCheck.ok || loggingIn) return;
    setLoggingIn(true);
    setLoginError(null);
    try {
      await signInWithPassword({ phone: phone.value, password: passwordCheck.value });
      router.replace('/(tabs)');
    } catch (error) {
      setLoginError(mapAuthErrorToKey(error));
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <View style={styles.tabBody}>
      <PhoneField
        value={phoneRaw}
        onChange={(text) => {
          setPhoneRaw(text);
          if (loginError) setLoginError(null);
        }}
        error={phoneError}
        autoFocus
        testID="auth-login-phone-input"
      />
      <PasswordInput
        value={password}
        onChange={(text) => {
          setPassword(text);
          if (loginError) setLoginError(null);
        }}
        error={passwordError}
        testID="auth-login-password"
      />
      <ScreenSpacer size={spacing.sm} />
      <BigButton
        label={loggingIn ? t('auth.loginSubmitting') : t('auth.loginSubmit')}
        icon="lock"
        onPress={() => void login()}
        disabled={loggingIn}
        testID="auth-login-submit"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 2,
    paddingVertical: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    minHeight: touchTargets.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.card,
  },
  tabActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  tabLabel: {
    ...typography.bodyBold,
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.primary,
  },
  pressed: {
    opacity: 0.7,
  },
  tabBody: {
    gap: spacing.xs,
  },
  link: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: touchTargets.minimum,
  },
  linkLabel: {
    ...typography.bodyBold,
    color: colors.primaryDark,
    textDecorationLine: 'underline',
  },
});
