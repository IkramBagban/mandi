import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { AmountInput, BigButton, BigTextField, ChipSelect } from '@/components';
import { formatDate } from '@/lib/format';
import { validateAmount } from '@/lib/validation';
import { useSettingsStore } from '@/store/settings';
import { colors, radii, spacing, touchTargets, typography } from '@/theme';

import {
  KHATA_KINDS,
  PAY_METHODS,
  parseDateKey,
  shiftDateKey,
  todayKey,
  type KhataEntry,
  type KhataKind,
  type PayMethod,
} from '../types';

export interface EntryFormValue {
  kind: KhataKind;
  amount: number;
  method: PayMethod;
  date: string;
  note: string | null;
}

interface EntryFormProps {
  mode: 'add' | 'edit';
  initial?: KhataEntry | null;
  submitting: boolean;
  onSubmit: (value: EntryFormValue) => void;
  onCancel: () => void;
}

type KindKey = 'kindCredit' | 'kindDebit' | 'kindPayment';
type MethodKey = 'methodCash' | 'methodUpi' | 'methodUdhaar';

const KIND_META: Record<KhataKind, { key: KindKey; icon: keyof typeof MaterialIcons.glyphMap }> = {
  credit: { key: 'kindCredit', icon: 'arrow-upward' },
  debit: { key: 'kindDebit', icon: 'arrow-downward' },
  payment: { key: 'kindPayment', icon: 'check-circle' },
};

const METHOD_META: Record<
  PayMethod,
  { key: MethodKey; icon: keyof typeof MaterialIcons.glyphMap }
> = {
  cash: { key: 'methodCash', icon: 'payments' },
  upi: { key: 'methodUpi', icon: 'smartphone' },
  udhaar: { key: 'methodUdhaar', icon: 'book' },
};

/**
 * Khata entry form: kind chips → big amount → method chips → day stepper →
 * note. One primary action: Save. Edit mode pre-fills from `initial`.
 */
export function EntryForm({ mode, initial, submitting, onSubmit, onCancel }: EntryFormProps) {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  const [kind, setKind] = useState<KhataKind>(initial?.kind ?? 'credit');
  const [amountText, setAmountText] = useState(initial ? String(initial.amount) : '');
  const [amountError, setAmountError] = useState<string | null>(null);
  const [method, setMethod] = useState<PayMethod>(initial?.method ?? 'cash');
  const [date, setDate] = useState(initial?.date ?? todayKey());
  const [note, setNote] = useState(initial?.note ?? '');

  const today = todayKey();
  const isToday = date === today;

  function handleSave() {
    const checked = validateAmount(amountText);
    if (!checked.ok) {
      const key =
        checked.errorKey === 'validation.amountInvalid'
          ? ('validation.amountInvalid' as const)
          : checked.errorKey === 'validation.amountNotPositive'
            ? ('validation.amountNotPositive' as const)
            : checked.errorKey === 'validation.amountTooLarge'
              ? ('validation.amountTooLarge' as const)
              : ('validation.amountRequired' as const);
      setAmountError(t(key));
      return;
    }
    setAmountError(null);
    onSubmit({
      kind,
      amount: checked.value,
      method,
      date,
      note: note.trim() ? note.trim() : null,
    });
  }

  return (
    <View style={styles.form}>
      <Text style={styles.title}>
        {mode === 'add' ? t('khata.addEntryTitle') : t('khata.editEntryTitle')}
      </Text>
      <ChipSelect
        label={t('khata.kindLabel')}
        options={KHATA_KINDS.map((value) => ({
          value,
          label: t(`khata.${KIND_META[value].key}`),
          icon: KIND_META[value].icon,
        }))}
        selected={kind}
        onSelect={setKind}
        testID="entry-kind"
      />
      <AmountInput
        label={t('khata.amountLabel')}
        value={amountText}
        onChangeText={setAmountText}
        prefix="₹"
        error={amountError}
        testID="entry-amount"
      />
      <ChipSelect
        label={t('khata.methodLabel')}
        options={PAY_METHODS.map((value) => ({
          value,
          label: t(`khata.${METHOD_META[value].key}`),
          icon: METHOD_META[value].icon,
        }))}
        selected={method}
        onSelect={setMethod}
        testID="entry-method"
      />
      <View style={styles.dateBlock}>
        <Text style={styles.fieldLabel}>{t('khata.dateLabel')}</Text>
        <View style={styles.dateRow}>
          <Pressable
            onPress={() => setDate((d) => shiftDateKey(d, -1))}
            accessibilityRole="button"
            accessibilityLabel={t('khata.datePrev')}
            testID="entry-date-prev"
            style={({ pressed }) => [styles.stepper, pressed && styles.pressed]}
          >
            <MaterialIcons name="chevron-left" size={24} color={colors.primary} />
          </Pressable>
          <View style={styles.dateCenter}>
            <Text style={styles.dateText}>{formatDate(parseDateKey(date), language)}</Text>
            {isToday ? <Text style={styles.todayTag}>{t('common.today')}</Text> : null}
          </View>
          <Pressable
            onPress={() => setDate((d) => shiftDateKey(d, 1))}
            disabled={date >= today}
            accessibilityRole="button"
            accessibilityLabel={t('khata.dateNext')}
            testID="entry-date-next"
            style={({ pressed }) => [
              styles.stepper,
              pressed && styles.pressed,
              date >= today && styles.stepperDisabled,
            ]}
          >
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={date >= today ? colors.disabled : colors.primary}
            />
          </Pressable>
        </View>
      </View>
      <BigTextField
        label={t('khata.noteLabel')}
        value={note}
        onChangeText={setNote}
        placeholder={t('khata.notePlaceholder')}
        hint={t('common.optional')}
        multiline
        testID="entry-note"
      />
      <BigButton
        label={t('khata.saveEntry')}
        icon="check"
        onPress={handleSave}
        disabled={submitting}
        testID="entry-save"
      />
      <Pressable
        onPress={onCancel}
        disabled={submitting}
        accessibilityRole="button"
        accessibilityLabel={t('common.cancel')}
        testID="entry-cancel"
        style={styles.cancel}
      >
        <Text style={styles.cancelLabel}>{t('common.cancel')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  fieldLabel: {
    ...typography.bodyBold,
    color: colors.text,
  },
  dateBlock: {
    gap: spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepper: {
    minWidth: touchTargets.minimum,
    minHeight: touchTargets.minimum,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.card,
  },
  stepperDisabled: {
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.8,
  },
  dateCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateText: {
    ...typography.heading,
    color: colors.text,
  },
  todayTag: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  cancel: {
    minHeight: touchTargets.minimum,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    ...typography.bodyBold,
    color: colors.textMuted,
  },
});
