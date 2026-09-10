import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { AmountInput, BigButton, Screen } from '@/components';
import type { Person } from '@/features/people/types';
import {
  calculateSale,
  parseCommissionPct,
  parseOptionalMoney,
  type OptionalNumber,
  type SaleCalc,
} from '@/features/records/calculations';
import { CalcCard, ChipRow, ConfirmSheet, PersonPicker } from '@/features/records/components';
import {
  COMMODITIES,
  commodityLabel,
  defaultGradeFor,
  gradesFor,
} from '@/features/records/commodities';
import { shiftDateKey, todayKey } from '@/features/khata/types';
import { saveSaleWithKhata } from '@/features/records/saveSale';
import { tv, validateSaleForm, type SaleFormValues } from '@/features/records/validate';
import { formatDate } from '@/lib/format';
import { useSettingsStore } from '@/store/settings';
import { colors, radii, spacing, touchTargets, typography } from '@/theme';
import { validateAmount, validateQuantityKg } from '@/lib/validation';

/**
 * New-sale form: person → date → commodity/quality → weight/rate → expenses →
 * photo → live bill → confirm sheet → save (sale row + khata mirror in one
 * `saveSaleWithKhata` call). One primary action: the green Save button.
 */

function safeNum(parsed: OptionalNumber): number {
  return parsed.ok ? parsed.value : 0;
}

/** Lenient live preview: unparseable fields count as zero until fixed. */
function previewCalc(values: SaleFormValues): SaleCalc {
  const qty = validateQuantityKg(values.qty);
  const rate = validateAmount(values.rate);
  return calculateSale({
    qtyKg: qty.ok ? qty.value : 0,
    ratePerKg: rate.ok ? rate.value : 0,
    hamali: safeNum(parseOptionalMoney(values.hamali)),
    tolai: safeNum(parseOptionalMoney(values.tolai)),
    commissionPct: safeNum(parseCommissionPct(values.commissionPct)),
    transport: safeNum(parseOptionalMoney(values.transport)),
    other: safeNum(parseOptionalMoney(values.other)),
  });
}

export default function NewSaleScreen() {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);

  const [person, setPerson] = useState<Person | null>(null);
  const [date, setDate] = useState(todayKey());
  const [commodity, setCommodity] = useState(COMMODITIES[0]?.id ?? 'mosambi');
  const [variety, setVariety] = useState(defaultGradeFor(COMMODITIES[0]?.id ?? 'mosambi'));
  const [qty, setQty] = useState('');
  const [crates, setCrates] = useState('');
  const [rate, setRate] = useState('');
  const [hamali, setHamali] = useState('');
  const [tolai, setTolai] = useState('');
  const [commissionPct, setCommissionPct] = useState('');
  const [transport, setTransport] = useState('');
  const [other, setOther] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [tried, setTried] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const values: SaleFormValues = useMemo(
    () => ({
      personId: person?.id ?? null,
      date,
      commodity,
      variety,
      qty,
      crates,
      rate,
      hamali,
      tolai,
      commissionPct,
      transport,
      other,
    }),
    [
      person,
      date,
      commodity,
      variety,
      qty,
      crates,
      rate,
      hamali,
      tolai,
      commissionPct,
      transport,
      other,
    ],
  );

  const { errors, parsed } = useMemo(() => validateSaleForm(values), [values]);
  const preview = useMemo(() => previewCalc(values), [values]);
  const netNegative = parsed ? calculateSale(parsed).net < 0 : false;
  const showError = (key: keyof typeof errors) => (tried ? tv(t, errors[key]) : null);

  const pickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });
      if (!result.canceled) setPhotoUri(result.assets[0]?.uri ?? null);
    } catch {
      // Photo is optional — a picker failure must never block the sale.
    }
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/records');
  };

  /** Save button → validate → open the readable confirm sheet. */
  const onSavePress = () => {
    setTried(true);
    if (!parsed || netNegative) return;
    setSaveError(null);
    setSheetVisible(true);
  };

  /** Confirm sheet → persist sale + khata mirror, then back to the list. */
  const onConfirm = async () => {
    if (!parsed || !person) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveSaleWithKhata({
        person_id: person.id,
        date,
        commodity,
        variety,
        crates: parsed.crates,
        qtyKg: parsed.qtyKg,
        ratePerKg: parsed.ratePerKg,
        hamali: parsed.hamali,
        tolai: parsed.tolai,
        commissionPct: parsed.commissionPct,
        transport: parsed.transport,
        other: parsed.other,
        photoLocalUri: photoUri,
      });
      setSheetVisible(false);
      router.replace('/records');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const dateLabel =
    date === todayKey()
      ? `${t('sale.today')} · ${formatDate(date, language)}`
      : formatDate(date, language);

  return (
    <Screen>
      <Pressable
        onPress={goBack}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        testID="sale-back"
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}
      >
        <MaterialIcons name="arrow-back" size={28} color={colors.primary} />
        <Text style={styles.backText}>{t('common.back')}</Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.title}>{t('sale.title')}</Text>
        <Text style={styles.subtitle}>{t('sale.subtitle')}</Text>
      </View>

      <PersonPicker selected={person} onSelect={setPerson} error={showError('person')} />

      <View style={styles.section}>
        <Text style={styles.label}>{t('sale.date')}</Text>
        <View style={styles.stepper}>
          <Pressable
            onPress={() => setDate((d) => shiftDateKey(d, -1))}
            accessibilityRole="button"
            accessibilityLabel="−1"
            testID="sale-day-prev"
            style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
          >
            <MaterialIcons name="chevron-left" size={36} color={colors.primary} />
          </Pressable>
          <Text style={styles.dateLabel}>{dateLabel}</Text>
          <Pressable
            onPress={() => setDate((d) => shiftDateKey(d, 1))}
            accessibilityRole="button"
            accessibilityLabel="+1"
            testID="sale-day-next"
            style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
          >
            <MaterialIcons name="chevron-right" size={36} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <ChipRow
        label={t('sale.commodity')}
        options={COMMODITIES.map((c) => ({ value: c.id, label: commodityLabel(t, c.id) }))}
        selected={commodity}
        onSelect={(id) => {
          setCommodity(id);
          setVariety(defaultGradeFor(id));
        }}
        testIDPrefix="sale-commodity"
      />

      <ChipRow
        label={t('sale.variety')}
        options={gradesFor(commodity).map((g) => ({ value: g, label: g }))}
        selected={variety}
        onSelect={setVariety}
        testIDPrefix="sale-variety"
      />

      <AmountInput
        label={t('sale.qtyKg')}
        value={qty}
        onChangeText={setQty}
        error={showError('qty')}
        testID="sale-qty"
      />
      <AmountInput
        label={t('sale.crates')}
        value={crates}
        onChangeText={setCrates}
        error={showError('crates')}
        testID="sale-crates"
      />
      <AmountInput
        label={t('sale.rate')}
        value={rate}
        onChangeText={setRate}
        prefix="₹"
        error={showError('rate')}
        testID="sale-rate"
      />

      <View style={styles.section}>
        <Text style={styles.label}>{t('sale.expenses')}</Text>
        <AmountInput
          label={t('sale.hamali')}
          value={hamali}
          onChangeText={setHamali}
          prefix="₹"
          error={showError('hamali')}
          testID="sale-hamali"
        />
        <AmountInput
          label={t('sale.tolai')}
          value={tolai}
          onChangeText={setTolai}
          prefix="₹"
          error={showError('tolai')}
          testID="sale-tolai"
        />
        <AmountInput
          label={t('sale.commissionPct')}
          value={commissionPct}
          onChangeText={setCommissionPct}
          prefix="%"
          error={showError('commissionPct')}
          testID="sale-commission"
        />
        <AmountInput
          label={t('sale.transport')}
          value={transport}
          onChangeText={setTransport}
          prefix="₹"
          error={showError('transport')}
          testID="sale-transport"
        />
        <AmountInput
          label={t('sale.other')}
          value={other}
          onChangeText={setOther}
          prefix="₹"
          error={showError('other')}
          testID="sale-other"
        />
      </View>

      <CalcCard
        calc={preview}
        language={language}
        totalLabel={t('sale.total')}
        expensesLabel={t('sale.expensesTotal')}
        netLabel={t('sale.netPayable')}
      />

      <View style={styles.section}>
        <View style={styles.photoHeader}>
          <Text style={styles.label}>{t('sale.photo')}</Text>
          <Text style={styles.optional}>{t('sale.photoOptional')}</Text>
        </View>
        {photoUri ? (
          <View style={styles.photoRow}>
            <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
            <View style={styles.photoBtn}>
              <BigButton
                label={t('sale.changePhoto')}
                icon="photo-camera"
                variant="secondary"
                onPress={pickPhoto}
                testID="sale-photo-change"
              />
            </View>
          </View>
        ) : (
          <BigButton
            label={t('sale.addPhoto')}
            icon="photo-camera"
            variant="secondary"
            onPress={pickPhoto}
            testID="sale-photo-add"
          />
        )}
      </View>

      {tried && (!parsed || netNegative) ? (
        <Text style={styles.banner}>{t('sale.fixErrors')}</Text>
      ) : null}

      <BigButton label={t('sale.confirm')} icon="check" onPress={onSavePress} testID="sale-save" />

      <ConfirmSheet
        visible={sheetVisible && parsed != null}
        person={person}
        commodityLabel={commodityLabel(t, commodity)}
        variety={variety}
        dateISO={date}
        qtyKg={parsed?.qtyKg ?? 0}
        ratePerKg={parsed?.ratePerKg ?? 0}
        calc={parsed ? calculateSale(parsed) : preview}
        photoUri={photoUri}
        language={language}
        saving={saving}
        error={saveError}
        onCancel={() => (saving ? undefined : setSheetVisible(false))}
        onConfirm={onConfirm}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: touchTargets.minimum,
    alignSelf: 'flex-start',
    paddingRight: spacing.md,
  },
  backText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  pressed: {
    opacity: 0.7,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
  },
  section: {
    gap: spacing.sm,
  },
  label: {
    ...typography.bodyBold,
    color: colors.text,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  stepBtn: {
    minWidth: 64,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateLabel: {
    ...typography.bodyBold,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  photoHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  optional: {
    ...typography.caption,
    color: colors.textMuted,
  },
  photoRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  photoBtn: {
    flex: 1,
  },
  banner: {
    ...typography.bodyBold,
    color: colors.danger,
    textAlign: 'center',
  },
});
