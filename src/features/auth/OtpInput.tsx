import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { normalizeDigits } from '@/lib/validation';
import { colors, radii, spacing, typography } from '@/theme';

import { OTP_LENGTH } from './types';

interface OtpInputProps {
  /** Digits typed so far (ASCII, max `OTP_LENGTH`). */
  value: string;
  onChange: (code: string) => void;
  /** Fired once the last box fills — screens verify immediately. */
  onComplete?: (code: string) => void;
  error?: string | null;
  testID?: string;
}

function onlyDigits(raw: string): string {
  return normalizeDigits(raw).replace(/[^\d]/g, '').slice(0, OTP_LENGTH);
}

/**
 * 6 compact boxes, one invisible input behind them.
 *
 * A single `TextInput` owns the keyboard so typing auto-advances, backspace
 * steps back, and long-press paste fills every box — no ref-juggling across
 * six inputs (fragile on low-end Android). Tapping any box focuses it.
 * Digits stay large (24sp) — this is a read-the-code surface.
 */
export function OtpInput({ value, onChange, onComplete, error, testID }: OtpInputProps) {
  const { t } = useTranslation();
  const inputRef = useRef<TextInput>(null);
  const cells = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? '');
  const focus = () => inputRef.current?.focus();

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={focus}
        accessibilityRole="button"
        accessibilityLabel={t('auth.codeLabel')}
        testID={testID ? `${testID}-boxes` : undefined}
        style={styles.row}
      >
        {cells.map((digit, i) => {
          const filled = digit !== '';
          const active = i === value.length;
          return (
            <View
              key={i}
              style={[
                styles.box,
                filled && styles.boxFilled,
                active && styles.boxActive,
                error ? styles.boxError : null,
              ]}
            >
              <Text style={styles.digit}>{digit}</Text>
            </View>
          );
        })}
      </Pressable>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => {
          const next = onlyDigits(text);
          onChange(next);
          if (next.length === OTP_LENGTH) onComplete?.(next);
        }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={OTP_LENGTH}
        autoFocus
        caretHidden
        style={styles.hidden}
        accessibilityLabel={t('auth.codeLabel')}
        testID={testID}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  box: {
    flex: 1,
    aspectRatio: 0.9,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.card,
  },
  boxFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  boxActive: {
    borderColor: colors.primaryDark,
  },
  boxError: {
    borderColor: colors.danger,
  },
  digit: {
    ...typography.amount,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  hidden: {
    position: 'absolute',
    opacity: 0,
    height: 1,
    width: 1,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
});
