import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BigButton, Screen, ScreenSpacer } from '@/components';
import {
  formatIndianPhoneDisplay,
  mapAuthErrorToKey,
  MAX_VERIFY_ATTEMPTS,
  OTP_LENGTH,
  requestOtp,
  RESEND_COOLDOWN_SECONDS,
  verifyOtp,
} from '@/features/auth';
import type { OtpChannel } from '@/features/auth';
import { OtpInput } from '@/features/auth/OtpInput';
import { colors, spacing, touchTargets, typography } from '@/theme';

function isOtpChannel(value: string | undefined): value is OtpChannel {
  return value === 'whatsapp' || value === 'sms';
}

/**
 * Step 2 — 6-digit code. Boxes auto-advance and verify the moment the last
 * digit lands; resend is one big thumb target with a 30s countdown so users
 * never hammer the SMS gateway. After `MAX_VERIFY_ATTEMPTS` wrong codes the
 * screen stops guessing and pushes a fresh code instead (no lockout).
 */
export default function VerifyScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ phone?: string; channel?: string }>();
  const phone = typeof params.phone === 'string' ? params.phone : '';
  const [channel, setChannel] = useState<OtpChannel>(
    isOtpChannel(params.channel) ? params.channel : 'sms',
  );

  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!phone) router.replace('/(auth)');
  }, [phone]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const lockedOut = wrongCount >= MAX_VERIFY_ATTEMPTS;
  const attemptsLeft = MAX_VERIFY_ATTEMPTS - wrongCount;

  const verify = async (candidate: string) => {
    if (verifying || candidate.length !== OTP_LENGTH || !phone) return;
    setVerifying(true);
    setErrorKey(null);
    try {
      await verifyOtp({ phone, code: candidate });
      router.replace('/(tabs)');
    } catch (error) {
      const key = mapAuthErrorToKey(error);
      if (key === 'auth.errorCodeInvalid') {
        const next = wrongCount + 1;
        setWrongCount(next);
        setErrorKey(next >= MAX_VERIFY_ATTEMPTS ? 'auth.errorMaxAttempts' : key);
        setCode('');
      } else {
        setErrorKey(key);
      }
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0 || resending || !phone) return;
    setResending(true);
    setErrorKey(null);
    try {
      const result = await requestOtp({ phone, channel });
      setChannel(result.channel);
      setCode('');
      setWrongCount(0);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      setErrorKey(mapAuthErrorToKey(error));
    } finally {
      setResending(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('auth.codeLabel')}</Text>
        <Text style={styles.subtitle}>
          {t('auth.codeSentTo', { phone: formatIndianPhoneDisplay(phone) })}
        </Text>
        <Text style={styles.channel}>
          {channel === 'whatsapp' ? t('auth.sentViaWhatsapp') : t('auth.sentViaSms')}
        </Text>
      </View>

      <OtpInput
        value={code}
        onChange={setCode}
        onComplete={(complete) => void verify(complete)}
        error={errorKey ? t(errorKey) : null}
        testID="auth-otp-input"
      />
      {!lockedOut && wrongCount > 0 && !errorKey ? (
        <Text style={styles.attempts}>{t('auth.attemptsLeft', { count: attemptsLeft })}</Text>
      ) : null}

      <ScreenSpacer size={spacing.sm} />
      <BigButton
        label={verifying ? t('auth.verifying') : t('auth.verify')}
        icon="check-circle"
        onPress={() => void verify(code)}
        disabled={verifying || code.length !== OTP_LENGTH}
        testID="auth-verify"
      />

      {cooldown > 0 ? (
        <Text style={styles.cooldown}>{t('auth.resendIn', { seconds: cooldown })}</Text>
      ) : (
        <BigButton
          label={resending ? t('auth.sendingCode') : t('auth.resend')}
          icon="refresh"
          variant="secondary"
          onPress={() => void resend()}
          disabled={resending}
          testID="auth-resend"
        />
      )}

      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={t('auth.changeNumber')}
        testID="auth-change-number"
        style={styles.changeNumber}
      >
        <Text style={styles.changeNumberLabel}>{t('auth.changeNumber')}</Text>
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
    ...typography.bodyBold,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  channel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  attempts: {
    ...typography.body,
    color: colors.warning,
  },
  cooldown: {
    ...typography.bodyBold,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  changeNumber: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    minHeight: touchTargets.minimum,
  },
  changeNumberLabel: {
    ...typography.bodyBold,
    color: colors.primaryDark,
    textDecorationLine: 'underline',
  },
});
