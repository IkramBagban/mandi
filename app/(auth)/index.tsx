import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { BigButton, Screen, ScreenSpacer } from '@/components';
import { mapAuthErrorToKey, requestOtp } from '@/features/auth';
import { normalizeDigits, validateIndianPhone } from '@/lib/validation';
import { colors, radii, spacing, touchTargets, typography } from '@/theme';

const MAX_PHONE_CHARS = 13;

/**
 * Step 1 — phone number. "+91" is fixed (Indian traders only); the user types
 * just 10 huge digits. Validation reuses the shared `validateIndianPhone`
 * (accepts Devanagari/Arabic-Indic digits, stray spaces, +91, leading 0).
 */
export default function PhoneScreen() {
  const { t } = useTranslation();
  const [raw, setRaw] = useState('');
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const phone = validateIndianPhone(raw);
  const fieldError = touched && !phone.ok ? t(phone.errorKey) : sendError ? t(sendError) : null;

  const send = async () => {
    setTouched(true);
    if (!phone.ok || sending) return;
    setSending(true);
    setSendError(null);
    try {
      const { channel } = await requestOtp({ phone: phone.value });
      router.push({ pathname: '/(auth)/verify', params: { phone: phone.value, channel } });
    } catch (error) {
      setSendError(mapAuthErrorToKey(error));
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('auth.title')}</Text>
        <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>
      </View>

      <Text style={styles.label}>{t('auth.phoneLabel')}</Text>
      <View style={[styles.row, fieldError ? styles.rowError : null]}>
        <Text style={styles.prefix}>+91</Text>
        <TextInput
          value={raw}
          onChangeText={(text) => {
            setRaw(normalizeDigits(text).replace(/[^\d]/g, '').slice(0, MAX_PHONE_CHARS));
            if (sendError) setSendError(null);
          }}
          keyboardType="number-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          maxLength={MAX_PHONE_CHARS}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={() => void send()}
          placeholder={t('auth.phonePlaceholder')}
          placeholderTextColor={colors.disabled}
          accessibilityLabel={t('auth.phoneLabel')}
          testID="auth-phone-input"
          style={styles.input}
        />
      </View>
      {fieldError ? <Text style={styles.error}>{fieldError}</Text> : null}

      <ScreenSpacer size={spacing.sm} />
      <BigButton
        label={sending ? t('auth.sendingCode') : t('auth.sendCode')}
        icon="sms"
        onPress={() => void send()}
        disabled={sending}
        testID="auth-send-code"
      />
      <Text style={styles.note}>{t('auth.channelNote')}</Text>
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
  label: {
    ...typography.bodyBold,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touchTargets.primary,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
  },
  rowError: {
    borderColor: colors.danger,
  },
  prefix: {
    ...typography.amount,
    color: colors.textMuted,
  },
  input: {
    flex: 1,
    ...typography.amount,
    color: colors.text,
    paddingVertical: spacing.sm,
    fontVariant: ['tabular-nums'],
  },
  error: {
    ...typography.body,
    color: colors.danger,
  },
  note: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
