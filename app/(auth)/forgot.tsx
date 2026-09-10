import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen, ScreenSpacer } from '@/components';
import { PhoneEntry } from '@/features/auth';
import { colors, spacing, touchTargets, typography } from '@/theme';

/**
 * Forgot password step 1 — prove the number is yours with a code.
 *
 * Same OTP entry as signup/login; the verify screen routes to set-password
 * in `recovery` mode, which replaces the password on the OTP-established
 * session. No email, no links, no extra SMS beyond this one code.
 */
export default function ForgotScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('auth.forgotTitle')}</Text>
        <Text style={styles.subtitle}>{t('auth.forgotSubtitle')}</Text>
      </View>

      <PhoneEntry purpose="recovery" autoFocus testIDPrefix="auth-forgot" />

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
