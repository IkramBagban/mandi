import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { BigButton, PersonAvatar } from '@/components';
import type { Person } from '@/features/people/types';
import type { AppLanguage } from '@/i18n';
import { formatDate, formatINR, formatKg } from '@/lib/format';
import { colors, radii, spacing, touchTargets, typography } from '@/theme';

import type { SaleCalc } from '../calculations';

interface ConfirmSheetProps {
  visible: boolean;
  person: Person | null;
  commodityLabel: string;
  variety: string;
  dateISO: string;
  qtyKg: number;
  ratePerKg: number;
  calc: SaleCalc;
  photoUri: string | null;
  language: AppLanguage;
  saving: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Confirm-before-save: a readable bill summary in big type. The trader checks
 * the photo-face, the numbers, then taps ONE green button. Nothing here edits
 * — Cancel goes back to the form with everything intact.
 */
export function ConfirmSheet({
  visible,
  person,
  commodityLabel,
  variety,
  dateISO,
  qtyKg,
  ratePerKg,
  calc,
  photoUri,
  language,
  saving,
  error,
  onCancel,
  onConfirm,
}: ConfirmSheetProps) {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{t('sale.review')}</Text>

          <View style={styles.personRow}>
            <PersonAvatar name={person?.name ?? '?'} photoUrl={person?.photo_url} size={64} />
            <View style={styles.personText}>
              <Text style={styles.personName}>{person?.name}</Text>
              <Text style={styles.personSub}>
                {commodityLabel} {variety} · {formatDate(dateISO, language)}
              </Text>
              <Text style={styles.personSub}>
                {formatKg(qtyKg, language)} @ {formatINR(ratePerKg, language)}
              </Text>
            </View>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.thumb} contentFit="cover" />
            ) : null}
          </View>

          <View style={styles.nums}>
            <View style={styles.numRow}>
              <Text style={styles.numLabel}>{t('sale.total')}</Text>
              <Text style={styles.numValue}>{formatINR(calc.total, language)}</Text>
            </View>
            <View style={styles.numRow}>
              <Text style={styles.numLabel}>− {t('sale.expensesTotal')}</Text>
              <Text style={styles.numMinus}>−{formatINR(calc.expensesTotal, language)}</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.netLabel}>{t('sale.netPayable')}</Text>
            <Text style={styles.netValue}>{formatINR(calc.net, language)}</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <MaterialIcons name="error" size={24} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <BigButton
            label={saving ? t('sale.saving') : t('sale.confirm')}
            icon="check"
            onPress={onConfirm}
            disabled={saving}
            testID="sale-confirm-yes"
          />
          <Pressable
            onPress={onCancel}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
            testID="sale-confirm-no"
            style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
          >
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
    maxHeight: '92%',
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  personText: {
    flex: 1,
    gap: 2,
  },
  personName: {
    ...typography.heading,
    color: colors.text,
  },
  personSub: {
    ...typography.body,
    color: colors.textMuted,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  nums: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  numRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  numLabel: {
    ...typography.body,
    color: colors.textMuted,
  },
  numValue: {
    ...typography.heading,
    color: colors.text,
  },
  numMinus: {
    ...typography.heading,
    color: colors.debit,
  },
  divider: {
    height: 2,
    backgroundColor: colors.border,
  },
  netLabel: {
    ...typography.bodyBold,
    color: colors.primaryDark,
  },
  netValue: {
    ...typography.display,
    color: colors.primary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    flex: 1,
  },
  cancel: {
    minHeight: touchTargets.minimum,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  cancelText: {
    ...typography.button,
    color: colors.textMuted,
  },
});
