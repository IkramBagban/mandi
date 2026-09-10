import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { formatINR } from '@/lib/format';
import { useSettingsStore } from '@/store/settings';
import { colors, radii, spacing, typography } from '@/theme';

interface BalanceHeaderProps {
  balance: number;
  testID?: string;
}

/**
 * Lifetime balance in huge numerals: green = they owe you, red = you owe
 * them, neutral = all clear. The single most important number on the screen.
 */
export function BalanceHeader({ balance, testID }: BalanceHeaderProps) {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  const state = balance > 0 ? 'in' : balance < 0 ? 'out' : 'clear';
  return (
    <View style={styles.card} testID={testID ?? 'balance-header'}>
      <Text style={styles.title}>{t('people.balanceTitle')}</Text>
      <Text style={[styles.amount, state === 'in' && styles.in, state === 'out' && styles.out]}>
        {formatINR(Math.abs(balance), language)}
      </Text>
      <View style={styles.stateRow}>
        <MaterialIcons
          name={state === 'clear' ? 'check-circle' : state === 'in' ? 'arrow-downward' : 'arrow-upward'}
          size={28}
          color={state === 'in' ? colors.credit : state === 'out' ? colors.debit : colors.textMuted}
        />
        <Text style={styles.state}>
          {state === 'in'
            ? t('khata.balanceOweMe')
            : state === 'out'
              ? t('khata.balanceYouOwe')
              : t('khata.balanceClear')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  title: {
    ...typography.bodyBold,
    color: colors.textMuted,
  },
  amount: {
    ...typography.display,
    color: colors.text,
  },
  in: {
    color: colors.credit,
  },
  out: {
    color: colors.debit,
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  state: {
    ...typography.heading,
    fontSize: 20,
    color: colors.text,
  },
});
