import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { BigButton, ScreenSpacer } from '@/components';
import { validateIndianPhone } from '@/lib/validation';
import { colors, spacing, typography } from '@/theme';

import { mapAuthErrorToKey, requestOtp } from './index';
import { PhoneField } from './PhoneField';
import type { VerifyPurpose } from './types';

interface PhoneEntryProps {
  /** Where verify-success goes: login → tabs, signup/recovery → set-password. */
  purpose: VerifyPurpose;
  autoFocus?: boolean;
  testIDPrefix: string;
}

/**
 * Phone number → send code → verify screen, shared by the Login OTP tab,
 * the Signup screen, and the Forgot-password screen.
 *
 * The only difference between those entries is `purpose`, which rides along
 * to `/verify` and decides where a correct code lands. One component keeps
 * the phone UX (and its validation) identical everywhere.
 */
export function PhoneEntry({ purpose, autoFocus, testIDPrefix }: PhoneEntryProps) {
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
      router.push({
        pathname: '/(auth)/verify',
        params: { phone: phone.value, channel, purpose },
      });
    } catch (error) {
      setSendError(mapAuthErrorToKey(error));
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <PhoneField
        value={raw}
        onChange={(text) => {
          setRaw(text);
          if (sendError) setSendError(null);
        }}
        error={fieldError}
        autoFocus={autoFocus}
        testID={`${testIDPrefix}-phone-input`}
      />
      <ScreenSpacer size={spacing.sm} />
      <BigButton
        label={sending ? t('auth.sendingCode') : t('auth.sendCode')}
        icon="sms"
        onPress={() => void send()}
        disabled={sending}
        testID={`${testIDPrefix}-send-code`}
      />
      <Text style={styles.note}>{t('auth.channelNote')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  note: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
