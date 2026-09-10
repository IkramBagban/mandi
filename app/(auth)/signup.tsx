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
  signUpWithPassword,
  validatePassword,
} from '@/features/auth';
import { isOtpEnabled } from '@/lib/authFlags';
import { validateIndianPhone } from '@/lib/validation';
import { colors, spacing, touchTargets, typography } from '@/theme';

/**
 * Signup — two shapes behind one route, picked by the OTP flag:
 *
 * OTP ON: phone → one code (creates/confirms the account) → set-password.
 * OTP OFF (default): phone + password on THIS screen → direct
 *   `signUpWithPassword`, zero SMS. Requires phone confirmations OFF in the
 *   Supabase dashboard (see README "Auth") — otherwise signup cannot issue
 *   a session and the screen says so instead of hanging.
 */
export default function SignupScreen() {
  const { t } = useTranslation();
  const otpOn = isOtpEnabled();

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('auth.signupTitle')}</Text>
        <Text style={styles.subtitle}>
          {otpOn ? t('auth.signupSubtitle') : t('auth.signupSubtitleDirect')}
        </Text>
      </View>

      {otpOn ? (
        <PhoneEntry purpose="signup" autoFocus testIDPrefix="auth-signup" />
      ) : (
        <DirectSignupForm />
      )}

      <ScreenSpacer size={spacing.sm} />
      <Pressable
        onPress={() => router.replace('/(auth)')}
        accessibilityRole="button"
        accessibilityLabel={t('auth.backToLogin')}
        testID="auth-signup-back"
        style={({ pressed }) => [styles.link, pressed && styles.pressed]}
      >
        <Text style={styles.linkLabel}>{t('auth.backToLogin')}</Text>
      </Pressable>
    </Screen>
  );
}

function DirectSignupForm() {
  const { t } = useTranslation();
  const [phoneRaw, setPhoneRaw] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const phone = validateIndianPhone(phoneRaw);
  const passwordCheck = validatePassword(password);
  const phoneError = touched && !phone.ok ? t(phone.errorKey) : null;
  const passwordError =
    (touched && !passwordCheck.ok ? t(passwordCheck.errorKey) : null) ??
    (createError ? t(createError) : null);

  const create = async () => {
    setTouched(true);
    if (!phone.ok || !passwordCheck.ok || creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      await signUpWithPassword({ phone: phone.value, password: passwordCheck.value });
      router.replace('/(tabs)');
    } catch (error) {
      setCreateError(mapAuthErrorToKey(error));
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={styles.form}>
      <PhoneField
        value={phoneRaw}
        onChange={(text) => {
          setPhoneRaw(text);
          if (createError) setCreateError(null);
        }}
        error={phoneError}
        autoFocus
        testID="auth-signup-phone-input"
      />
      <PasswordInput
        value={password}
        onChange={(text) => {
          setPassword(text);
          if (createError) setCreateError(null);
        }}
        error={passwordError}
        testID="auth-signup-password"
      />
      <ScreenSpacer size={spacing.sm} />
      <BigButton
        label={creating ? t('auth.savingPassword') : t('auth.createAccount')}
        icon="person-add"
        onPress={() => void create()}
        disabled={creating}
        testID="auth-signup-submit"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
  },
  form: {
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
  pressed: {
    opacity: 0.7,
  },
});
