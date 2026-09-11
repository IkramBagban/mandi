import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radii, spacing, touchTargets, typography } from '@/theme';

interface AmountInputProps {
  value: string;
  onChangeText: (text: string) => void;
  /** Currency/unit prefix, e.g. "₹". Rendered large, never typed by the user. */
  prefix?: string;
  label: string;
  error?: string | null;
  testID?: string;
}

/**
 * Money/quantity entry: large (24sp) numerals with a numeric keyboard and
 * inline error. Big enough to read at arm's length, compact enough to keep
 * the form on screen. Always pair with `validateAmount` / `validateQuantity`
 * from `@/lib/validation`.
 */
export function AmountInput({
  value,
  onChangeText,
  prefix,
  label,
  error,
  testID,
}: AmountInputProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.row, error ? styles.rowError : null]}>
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          returnKeyType="done"
          accessibilityLabel={label}
          testID={testID}
          style={styles.input}
          placeholder="0"
          placeholderTextColor={colors.disabled}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
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
    borderWidth: 1,
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
    textAlign: 'left',
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
});
