import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDate, formatINR } from '@/lib/format';
import { useSettingsStore } from '@/store/settings';
import { colors, radii, spacing, touchTargets, typography } from '@/theme';

import { parseDateKey, type KhataEntry } from '../types';

interface EntryRowProps {
  entry: KhataEntry;
  onEdit: (entry: KhataEntry) => void;
  onDelete: (entry: KhataEntry) => void;
}

const KIND_STYLE = {
  credit: { icon: 'arrow-upward', fg: colors.credit, bg: colors.primarySoft },
  debit: { icon: 'arrow-downward', fg: colors.debit, bg: colors.dangerSoft },
  payment: { icon: 'check-circle', fg: colors.warning, bg: colors.warningSoft },
} as const;

/**
 * One khata entry: kind icon first, big colored amount, method + note small.
 * Edit/delete are 48dp icon targets on the right.
 */
export function EntryRow({ entry, onEdit, onDelete }: EntryRowProps) {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  const style = KIND_STYLE[entry.kind];
  const amount = Number(entry.amount);
  const kindLabel =
    entry.kind === 'credit'
      ? t('khata.kindCredit')
      : entry.kind === 'debit'
        ? t('khata.kindDebit')
        : t('khata.kindPayment');
  const methodLabel =
    entry.method === 'cash'
      ? t('khata.methodCash')
      : entry.method === 'upi'
        ? t('khata.methodUpi')
        : t('khata.methodUdhaar');

  return (
    <View style={styles.row} testID={`entry-row-${entry.id}`}>
      <View style={[styles.iconCircle, { backgroundColor: style.bg }]}>
        <MaterialIcons name={style.icon} size={28} color={style.fg} />
      </View>
      <View style={styles.middle}>
        <Text style={styles.kind} numberOfLines={1}>
          {kindLabel}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {methodLabel} · {formatDate(parseDateKey(entry.date), language)}
        </Text>
        {entry.note ? (
          <Text style={styles.note} numberOfLines={2}>
            {entry.note}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.amount, { color: style.fg }]}>
        {entry.kind === 'debit' ? '−' : '+'}
        {formatINR(amount, language)}
      </Text>
      <View style={styles.actions}>
        <Pressable
          onPress={() => onEdit(entry)}
          accessibilityRole="button"
          accessibilityLabel={t('common.edit')}
          testID={`entry-edit-${entry.id}`}
          style={styles.action}
        >
          <MaterialIcons name="edit" size={24} color={colors.primary} />
        </Pressable>
        <Pressable
          onPress={() => onDelete(entry)}
          accessibilityRole="button"
          accessibilityLabel={t('common.delete')}
          testID={`entry-delete-${entry.id}`}
          style={styles.action}
        >
          <MaterialIcons name="delete-outline" size={24} color={colors.danger} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 88,
    padding: spacing.sm,
    paddingLeft: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: {
    flex: 1,
    gap: 2,
  },
  kind: {
    ...typography.bodyBold,
    color: colors.text,
  },
  sub: {
    ...typography.caption,
    color: colors.textMuted,
  },
  note: {
    ...typography.caption,
    color: colors.text,
  },
  amount: {
    ...typography.bodyBold,
    fontSize: 19,
  },
  actions: {
    flexDirection: 'row',
  },
  action: {
    minWidth: touchTargets.minimum,
    minHeight: touchTargets.minimum,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
