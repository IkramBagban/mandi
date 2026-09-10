import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { colors, radii, spacing, touchTargets, typography } from '@/theme';

interface BigTextFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  /** Static adornment before the input, e.g. "+91" — never typed by hand. */
  prefix?: string;
  /** Small hint after the label, e.g. "Optional". */
  hint?: string;
  error?: string | null;
  multiline?: boolean;
  testID?: string;
}

/**
 * Labeled text entry with a 56dp+ target and inline error — the sibling of
 * `AmountInput` for names, villages and notes. Always translated: pass
 * `t('…')` for every string prop.
 */
export function BigTextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  prefix,
  hint,
  error,
  multiline = false,
  testID,
}: BigTextFieldProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <View style={[styles.row, error ? styles.rowError : null, multiline && styles.rowMulti]}>
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.disabled}
          keyboardType={keyboardType}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          accessibilityLabel={label}
          testID={testID}
          style={[styles.input, multiline && styles.inputMulti]}
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  label: {
    ...typography.bodyBold,
    color: colors.text,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
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
  rowMulti: {
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  rowError: {
    borderColor: colors.danger,
  },
  prefix: {
    ...typography.bodyBold,
    color: colors.textMuted,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  inputMulti: {
    minHeight: 88,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
});
