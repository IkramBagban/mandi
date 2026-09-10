import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { router, useFocusEffect } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { BigButton, EmptyState, PersonAvatar, Screen } from '@/components';
import type { Person } from '@/features/people/types';
import { commodityLabel } from '@/features/records/commodities';
import { addDaysISO, isTodayISO, todayISODate } from '@/features/records/dates';
import { searchPeople } from '@/features/records/people';
import { listSalesByDay } from '@/features/records/repository';
import type { SaleRecord } from '@/features/records/types';
import { formatDate, formatINR, formatKg } from '@/lib/format';
import { useSettingsStore } from '@/store/settings';
import { colors, radii, spacing, touchTargets, typography } from '@/theme';

/**
 * Sales tab: one day at a time (stepper) + person search filter.
 * Each row is photo-face first; the day total sits in big numerals on top.
 * The ONE primary action is "New sale" → the form at `/record/new`.
 */
export default function RecordsScreen() {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);

  const [date, setDate] = useState(todayISODate());
  const [query, setQuery] = useState('');
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [people, setPeople] = useState<Map<string, Person>>(new Map());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (day: string) => {
    setLoading(true);
    try {
      const [daySales, { people: all }] = await Promise.all([
        listSalesByDay(day),
        searchPeople(''),
      ]);
      setSales(daySales);
      setPeople(new Map(all.map((p) => [p.id, p])));
    } catch {
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(date);
  }, [date, load]);

  // Refresh after saving a sale in the form.
  useFocusEffect(
    useCallback(() => {
      void load(date);
    }, [date, load]),
  );

  const q = query.trim().toLowerCase();
  const visible = sales.filter((s) => {
    if (!q) return true;
    const person = s.person_id ? people.get(s.person_id) : undefined;
    return (
      person?.name.toLowerCase().includes(q) || (person?.village ?? '').toLowerCase().includes(q)
    );
  });
  const dayNet = visible.reduce((sum, s) => sum + s.net, 0);

  const dateLabel = isTodayISO(date)
    ? `${t('records.today')} · ${formatDate(date, language)}`
    : formatDate(date, language);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('records.title')}</Text>
        <Text style={styles.subtitle}>{t('records.subtitle')}</Text>
      </View>

      <BigButton
        label={t('records.newSale')}
        icon="add"
        onPress={() => router.push('/record/new')}
        testID="records-new-sale"
      />

      <View style={styles.stepper}>
        <Pressable
          onPress={() => setDate((d) => addDaysISO(d, -1))}
          accessibilityRole="button"
          accessibilityLabel="−1"
          testID="records-day-prev"
          style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
        >
          <MaterialIcons name="chevron-left" size={36} color={colors.primary} />
        </Pressable>
        <Text style={styles.dateLabel}>{dateLabel}</Text>
        <Pressable
          onPress={() => setDate((d) => addDaysISO(d, 1))}
          accessibilityRole="button"
          accessibilityLabel="+1"
          testID="records-day-next"
          style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
        >
          <MaterialIcons name="chevron-right" size={36} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        <MaterialIcons name="search" size={28} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('records.searchPlaceholder')}
          placeholderTextColor={colors.disabled}
          accessibilityLabel={t('records.searchPlaceholder')}
          testID="records-search"
          style={styles.searchInput}
          returnKeyType="search"
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} testID="records-loading" />
      ) : visible.length === 0 ? (
        <EmptyState
          icon="scale"
          title={t('records.noSalesForDay')}
          body={t('records.emptyBody')}
        />
      ) : (
        <View style={styles.list}>
          <View style={styles.totalCard} testID="records-day-total">
            <Text style={styles.totalLabel}>{t('records.dayNet')}</Text>
            <Text style={styles.totalValue}>{formatINR(dayNet, language)}</Text>
          </View>
          {visible.map((sale) => {
            const person = sale.person_id ? people.get(sale.person_id) : undefined;
            return (
              <View key={sale.id} style={styles.row} testID={`records-row-${sale.id}`}>
                <PersonAvatar
                  name={person?.name ?? '?'}
                  photoUrl={person?.photo_url}
                  size={56}
                />
                <View style={styles.rowText}>
                  <Text style={styles.rowName}>{person?.name ?? '?'}</Text>
                  <Text style={styles.rowSub}>
                    {commodityLabel(t, sale.commodity)}
                    {sale.variety ? ` ${sale.variety}` : ''} · {formatKg(sale.qty_kg, language)}
                  </Text>
                </View>
                <Text style={styles.rowNet}>{formatINR(sale.net, language)}</Text>
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  pressed: {
    opacity: 0.7,
  },
  dateLabel: {
    ...typography.bodyBold,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touchTargets.primary,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
  totalCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  totalLabel: {
    ...typography.bodyBold,
    color: colors.primaryDark,
  },
  totalValue: {
    ...typography.display,
    color: colors.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 72,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
  },
  rowText: {
    flex: 1,
  },
  rowName: {
    ...typography.bodyBold,
    color: colors.text,
  },
  rowSub: {
    ...typography.caption,
    color: colors.textMuted,
  },
  rowNet: {
    ...typography.heading,
    color: colors.primary,
  },
});
