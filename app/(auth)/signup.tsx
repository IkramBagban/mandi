import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen, ScreenSpacer } from '@/components';
import { PhoneEntry } from '@/features/auth';
import { colors, spacing, touchTargets, typography } from '@/theme';

/**
 * Signup step 1 — confirm the number with ONE code.
 *
 * `signInWithOtp` creates the account when the number is new (or signs the
 * owner back in when it already exists); the verify screen then routes to
 * set-password, so every account ends here with a phone+password login and
 * exactly one SMS was ever spent on it.
 */
export default function SignupScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('auth.signupTitle')}</Text>
        <Text style={styles.subtitle}>{t('auth.signupSubtitle')}</Text>
      </View>

      <PhoneEntry purpose="signup" autoFocus testIDPrefix="auth-signup" />

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
