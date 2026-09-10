import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { normalizeDigits } from '@/lib/validation';
import { colors, radii, spacing, touchTargets, typography } from '@/theme';

export const MAX_PHONE_CHARS = 13;

interface PhoneFieldProps {
  /** Raw digits as typed (ASCII-normalised by this field). */
  value: string;
  onChange: (raw: string) => void;
  /** Local validation error already translated, or null. */
  error?: string | null;
  autoFocus?: boolean;
  testID?: string;
}

/**
 * Shared "+91 + 10 huge digits" phone field.
 *
 * "+91" is fixed (Indian traders only); validation reuses
 * `validateIndianPhone` (Devanagari/Arabic-Indic digits, stray spaces, +91,
 * leading 0 all accepted). Controlled — parents own the value and decide
 * what the submit button does.
 */
export function PhoneField({ value, onChange, error, autoFocus, testID }: PhoneFieldProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{t('auth.phoneLabel')}</Text>
      <View style={[styles.row, error ? styles.rowError : null]}>
        <Text style={styles.prefix}>+91</Text>
        <TextInput
          value={value}
          onChangeText={(text) => {
            onChange(normalizeDigits(text).replace(/[^\d]/g, '').slice(0, MAX_PHONE_CHARS));
          }}
          keyboardType="number-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          maxLength={MAX_PHONE_CHARS}
          autoFocus={autoFocus}
          returnKeyType="done"
          placeholder={t('auth.phonePlaceholder')}
          placeholderTextColor={colors.disabled}
          accessibilityLabel={t('auth.phoneLabel')}
          testID={testID}
          style={styles.input}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
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
});
