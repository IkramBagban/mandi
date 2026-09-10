import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { router, useFocusEffect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { BigButton, PersonAvatar, Screen } from '@/components';
import { listAllEntries } from '@/features/khata/repository';
import { summarizeUdhaari, type UdhaariSummary } from '@/features/khata/udhaari';
import { searchPeople } from '@/features/records/people';
import { todayISODate } from '@/features/records/dates';
import { formatINR } from '@/lib/format';
import { useSettingsStore } from '@/store/settings';
import { colors, radii, spacing, typography } from '@/theme';

/**
 * Home: Udhaari dashboard on top (computed ONLY from khata_entries), then the
 * three daily-job buttons. Big numerals, photo faces, one glance = the whole
 * day's money position.
 */
export default function HomeScreen() {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);

  const [summary, setSummary] = useState<UdhaariSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ people }, entries] = await Promise.all([searchPeople(''), listAllEntries()]);
      setSummary(summarizeUdhaari(entries, people, todayISODate()));
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('home.title')}</Text>
        <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
      </View>

      <Text style={styles.sectionLabel}>{t('home.udhaari')}</Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} testID="home-loading" />
      ) : summary && summary.peopleWithBalance > 0 ? (
        <View style={styles.dash} testID="home-dashboard">
          <View style={styles.cards}>
            <View style={[styles.card, styles.collectCard]}>
              <View style={styles.cardHead}>
                <MaterialIcons name="arrow-downward" size={28} color={colors.credit} />
                <Text style={styles.cardLabel}>{t('home.toCollect')}</Text>
              </View>
              <Text style={[styles.cardValue, styles.collectValue]} testID="home-to-collect">
                {formatINR(summary.toCollect, language)}
              </Text>
            </View>
            <View style={[styles.card, styles.payCard]}>
              <View style={styles.cardHead}>
                <MaterialIcons name="arrow-upward" size={28} color={colors.debit} />
                <Text style={styles.cardLabel}>{t('home.toPay')}</Text>
              </View>
              <Text style={[styles.cardValue, styles.payValue]} testID="home-to-pay">
                {formatINR(summary.toPay, language)}
              </Text>
            </View>
          </View>

          <View style={styles.todayStrip} testID="home-today-collection">
            <MaterialIcons name="payments" size={32} color={colors.primaryDark} />
            <Text style={styles.todayLabel}>{t('home.todayIn')}</Text>
            <Text style={styles.todayValue}>{formatINR(summary.todayCollection, language)}</Text>
          </View>

          {summary.debtors.length > 0 ? (
            <View style={styles.debtors}>
              <Text style={styles.debtorsLabel}>{t('home.topDebtors')}</Text>
              {summary.debtors.map(({ person, balance }) => (
                <View key={person.id} style={styles.debtorRow}>
                  <PersonAvatar name={person.name} photoUrl={person.photo_url} size={56} />
                  <Text style={styles.debtorName} numberOfLines={1}>
                    {person.name}
                  </Text>
                  <Text style={styles.debtorAmount}>{formatINR(balance, language)}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.clearBox} testID="home-no-debtors">
          <MaterialIcons name="check-circle" size={48} color={colors.primary} />
          <Text style={styles.clearText}>{t('home.noDebtors')}</Text>
        </View>
      )}

      <BigButton
        label={`${t('home.openPeople')} · ${t('home.openPeopleHint')}`}
        icon="people"
        onPress={() => router.push('/people')}
        testID="home-open-people"
      />
      <BigButton
        label={`${t('home.openKhata')} · ${t('home.openKhataHint')}`}
        icon="book"
        onPress={() => router.push('/khata')}
        testID="home-open-khata"
      />
      <BigButton
        label={`${t('home.openRecords')} · ${t('home.openRecordsHint')}`}
        icon="scale"
        onPress={() => router.push('/records')}
        testID="home-open-records"
      />
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
    ...typography.body,
    color: colors.textMuted,
  },
  sectionLabel: {
    ...typography.heading,
    color: colors.text,
  },
  dash: {
    gap: spacing.md,
  },
  cards: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  card: {
    flex: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 2,
  },
  collectCard: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  payCard: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardLabel: {
    ...typography.bodyBold,
    color: colors.text,
    flexShrink: 1,
  },
  cardValue: {
    ...typography.amount,
  },
  collectValue: {
    color: colors.credit,
  },
  payValue: {
    color: colors.debit,
  },
  todayStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 72,
  },
  todayLabel: {
    ...typography.bodyBold,
    color: colors.text,
    flex: 1,
  },
  todayValue: {
    ...typography.heading,
    color: colors.primaryDark,
  },
  debtors: {
    gap: spacing.sm,
  },
  debtorsLabel: {
    ...typography.bodyBold,
    color: colors.text,
  },
  debtorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 72,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  debtorName: {
    ...typography.bodyBold,
    color: colors.text,
    flex: 1,
  },
  debtorAmount: {
    ...typography.heading,
    color: colors.credit,
  },
  clearBox: {
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    padding: spacing.lg,
  },
  clearText: {
    ...typography.bodyBold,
    color: colors.primaryDark,
    textAlign: 'center',
  },
});
