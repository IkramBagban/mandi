import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen, ScreenSpacer } from '@/components';
import { PhoneEntry } from '@/features/auth';
import { isOtpEnabled } from '@/lib/authFlags';
import { colors, radii, spacing, touchTargets, typography } from '@/theme';

/**
 * Forgot password — flag-gated.
 *
 * OTP ON: phone → code → new password (the usual recovery flow).
 * OTP OFF (default): there is deliberately NO form here — a reset needs a
 * code and codes are switched off, so the screen says exactly that plus a
 * way back, instead of a dead button that burns a tap and delivers nothing.
 */
export default function ForgotScreen() {
  const { t } = useTranslation();
  const otpOn = isOtpEnabled();

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('auth.forgotTitle')}</Text>
        <Text style={styles.subtitle}>{t('auth.forgotSubtitle')}</Text>
      </View>

      {otpOn ? (
        <PhoneEntry purpose="recovery" autoFocus testIDPrefix="auth-forgot" />
      ) : (
        <Text style={styles.unavailable}>{t('auth.forgotUnavailable')}</Text>
      )}

      <ScreenSpacer size={spacing.sm} />
      <Pressable
        onPress={() => router.replace('/(auth)')}
        accessibilityRole="button"
        accessibilityLabel={t('auth.backToLogin')}
        testID="auth-forgot-back"
        style={({ pressed }) => [styles.link, pressed && styles.pressed]}
      >
        <Text style={styles.linkLabel}>{t('auth.backToLogin')}</Text>
      </Pressable>
    </Screen>
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
  unavailable: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
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
