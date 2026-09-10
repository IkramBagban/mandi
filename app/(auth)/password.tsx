import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { BigButton, Screen, ScreenSpacer } from '@/components';
import {
  formatIndianPhoneDisplay,
  mapAuthErrorToKey,
  PasswordInput,
  setPassword,
  validatePassword,
} from '@/features/auth';
import type { SetPasswordMode } from '@/features/auth';
import { colors, spacing, typography } from '@/theme';

function isSetPasswordMode(value: string | undefined): value is SetPasswordMode {
  return value === 'signup' || value === 'recovery';
}

/**
 * Set-password — the last step of signup AND of forgot-password.
 *
 * Both flows verified the number by OTP immediately before this screen, so
 * the live session authorises `updateUser({ password })` — no second code,
 * no email link. Afterwards the account logs in with phone+password and
 * never needs another SMS. One primary action: Save password.
 */
export default function SetPasswordScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ mode?: string; phone?: string }>();
  const mode: SetPasswordMode = isSetPasswordMode(params.mode) ? params.mode : 'signup';
  const phone = typeof params.phone === 'string' ? params.phone : '';

  const [password, setPasswordValue] = useState('');
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const check = validatePassword(password);
  const fieldError =
    (touched && !check.ok ? t(check.errorKey) : null) ?? (saveError ? t(saveError) : null);

  const save = async () => {
    setTouched(true);
    if (!check.ok || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await setPassword({ password: check.value });
      router.replace('/(tabs)');
    } catch (error) {
      setSaveError(mapAuthErrorToKey(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('auth.setPasswordTitle')}</Text>
        <Text style={styles.subtitle}>
          {mode === 'recovery'
            ? t('auth.setPasswordSubtitleReset')
            : t('auth.setPasswordSubtitleNew')}
        </Text>
        {phone ? <Text style={styles.phone}>{formatIndianPhoneDisplay(phone)}</Text> : null}
      </View>

      <PasswordInput
        value={password}
        onChange={(text) => {
          setPasswordValue(text);
          if (saveError) setSaveError(null);
        }}
        error={fieldError}
        autoFocus
        testID="auth-set-password"
      />

      <ScreenSpacer size={spacing.sm} />
      <BigButton
        label={saving ? t('auth.savingPassword') : t('auth.savePassword')}
        icon="lock"
        onPress={() => void save()}
        disabled={saving}
        testID="auth-save-password"
      />
    </Screen>
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
  phone: {
    ...typography.bodyBold,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
});
