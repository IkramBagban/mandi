import { StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '@/i18n';
import { formatINR } from '@/lib/format';
import { colors, radii, spacing, typography } from '@/theme';

import type { SaleCalc } from '../calculations';

interface CalcCardProps {
  calc: SaleCalc;
  language: AppLanguage;
  totalLabel: string;
  expensesLabel: string;
  netLabel: string;
}

/**
 * The live bill: total → minus expenses → net payable in huge green numerals.
 * Same `SaleCalc` object that `saveSaleWithKhata` persists, so what the
 * trader sees is what gets saved. Labels come from i18n (props, no hooks —
 * keeps this card reusable in the confirm sheet too).
 */
export function CalcCard({ calc, language, totalLabel, expensesLabel, netLabel }: CalcCardProps) {
  return (
    <View style={styles.card} testID="sale-calc-card">
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{totalLabel}</Text>
        <Text style={styles.rowValue}>{formatINR(calc.total, language)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>− {expensesLabel}</Text>
        <Text style={styles.rowValueMinus}>−{formatINR(calc.expensesTotal, language)}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.netRow}>
        <Text style={styles.netLabel}>{netLabel}</Text>
        <Text style={styles.netValue} testID="sale-net-value">
          {formatINR(calc.net, language)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: {
    ...typography.body,
    color: colors.textMuted,
  },
  rowValue: {
    ...typography.heading,
    color: colors.text,
  },
  rowValueMinus: {
    ...typography.heading,
    color: colors.debit,
  },
  divider: {
    height: 2,
    backgroundColor: colors.border,
  },
  netRow: {
    gap: spacing.xs,
  },
  netLabel: {
    ...typography.bodyBold,
    color: colors.primaryDark,
  },
  netValue: {
    ...typography.display,
    color: colors.primary,
  },
});
