import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { router, useFocusEffect } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { BigButton, EmptyState, ListRow, PersonAvatar, Screen } from '@/components';
import type { Person } from '@/features/people/types';
import { commodityLabel } from '@/features/records/commodities';
import { shiftDateKey, todayKey } from '@/features/khata/types';
import { searchPeople } from '@/features/records/people';
import { listSalesByDay } from '@/features/records/repository';
import type { SaleRecord } from '@/features/records/types';
import { formatDate, formatINR, formatKg } from '@/lib/format';
import { RepoError } from '@/lib/offline';
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

  const [date, setDate] = useState(todayKey());
  const [query, setQuery] = useState('');
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [people, setPeople] = useState<Map<string, Person>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(
    async (day: string) => {
      setLoading(true);
      setLoadError(null);
      try {
        // Sequential on purpose: searchPeople may run the first-launch demo
        // seed, and the sales read must see the seeded rows.
        const { people: all } = await searchPeople('');
        const daySales = await listSalesByDay(day);
        setSales(daySales);
        setPeople(new Map(all.map((p) => [p.id, p])));
      } catch (err) {
        setSales([]);
        setLoadError(
          err instanceof RepoError && err.code === 'offline'
            ? t('errors.offline')
            : t('errors.failed'),
        );
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  // Initial load + refresh after saving a sale in the form.
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

  const dateLabel =
    date === todayKey()
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
          onPress={() => setDate((d) => shiftDateKey(d, -1))}
          accessibilityRole="button"
          accessibilityLabel="−1"
          testID="records-day-prev"
          style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
        >
          <MaterialIcons name="chevron-left" size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.dateLabel}>{dateLabel}</Text>
        <Pressable
          onPress={() => setDate((d) => shiftDateKey(d, 1))}
          accessibilityRole="button"
          accessibilityLabel="+1"
          testID="records-day-next"
          style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
        >
          <MaterialIcons name="chevron-right" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        <MaterialIcons name="search" size={20} color={colors.textMuted} />
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
      ) : (
        <View style={styles.list}>
          {loadError ? (
            <View style={styles.errorBox} testID="records-error">
              <MaterialIcons name="cloud-off" size={28} color={colors.danger} />
              <Text style={styles.errorText}>{loadError}</Text>
            </View>
          ) : null}
          {visible.length === 0 && !loadError ? (
            <EmptyState
              icon="scale"
              title={t('records.noSalesForDay')}
              body={t('records.emptyBody')}
            />
          ) : null}
          {visible.length > 0 ? (
            <View style={styles.list}>
              <View style={styles.totalCard} testID="records-day-total">
                <Text style={styles.totalLabel}>{t('records.dayNet')}</Text>
                <Text style={styles.totalValue}>{formatINR(dayNet, language)}</Text>
              </View>
              {visible.map((sale) => {
                const person = sale.person_id ? people.get(sale.person_id) : undefined;
                const sub = `${commodityLabel(t, sale.commodity)}${sale.variety ? ` ${sale.variety}` : ''} · ${formatKg(sale.qty_kg, language)}`;
                return (
                  <ListRow
                    key={sale.id}
                    avatar={
                      <PersonAvatar
                        name={person?.name ?? '?'}
                        photoUrl={person?.photo_url}
                        size={40}
                      />
                    }
                    title={person?.name ?? '?'}
                    subtitle={sub}
                    right={<Text style={styles.rowNet}>{formatINR(sale.net, language)}</Text>}
                    testID={`records-row-${sale.id}`}
                  />
                );
              })}
            </View>
          ) : null}
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
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  stepBtn: {
    minWidth: 52,
    minHeight: 44,
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
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
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
  totalCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: 2,
  },
  totalLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  totalValue: {
    ...typography.amount,
    color: colors.primary,
  },
  rowNet: {
    ...typography.heading,
    color: colors.primary,
  },
});
