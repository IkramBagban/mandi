import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { colors, radii, spacing, touchTargets, typography } from '@/theme';

interface PasswordInputProps {
  /** Raw password as typed (never trimmed, never logged). */
  value: string;
  onChange: (password: string) => void;
  error?: string | null;
  autoFocus?: boolean;
  testID?: string;
}

/**
 * Password field with a big show/hide eye.
 *
 * Low-literacy users mistype blind passwords constantly, so the toggle is a
 * full 48dp+ thumb target and showing the password is one tap away. The hint
 * (`auth.passwordHint`) states the only rule — 6+ characters, digits alone
 * are fine — so nobody invents stricter rules than exist.
 */
export function PasswordInput({ value, onChange, error, autoFocus, testID }: PasswordInputProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{t('auth.passwordLabel')}</Text>
      <View style={[styles.row, error ? styles.rowError : null]}>
        <TextInput
          value={value}
          onChangeText={onChange}
          secureTextEntry={!visible}
          keyboardType="default"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType={visible ? 'none' : 'password'}
          autoComplete="password"
          autoFocus={autoFocus}
          returnKeyType="done"
          placeholder={t('auth.passwordPlaceholder')}
          placeholderTextColor={colors.disabled}
          accessibilityLabel={t('auth.passwordLabel')}
          testID={testID}
          style={styles.input}
        />
        <Pressable
          onPress={() => setVisible((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={visible ? t('auth.hidePassword') : t('auth.showPassword')}
          testID={testID ? `${testID}-toggle` : undefined}
          style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
        >
          <MaterialIcons
            name={visible ? 'visibility-off' : 'visibility'}
            size={28}
            color={colors.primary}
          />
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.hint}>{t('auth.passwordHint')}</Text>
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
    gap: spacing.xs,
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
  input: {
    flex: 1,
    ...typography.amount,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  toggle: {
    minWidth: touchTargets.minimum,
    minHeight: touchTargets.minimum,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  error: {
    ...typography.body,
    color: colors.danger,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
