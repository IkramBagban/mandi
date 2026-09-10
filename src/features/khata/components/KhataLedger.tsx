import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { BigButton, EmptyState } from '@/components';
import type { Person } from '@/features/people/types';
import { mapDbErrorToKey } from '@/lib/dbErrors';
import { formatDate, formatINR } from '@/lib/format';
import { useSettingsStore } from '@/store/settings';
import { colors, spacing, typography } from '@/theme';

import { computeBalance } from '../repository';
import { shareKhataOnWhatsApp } from '../share';
import { groupEntriesByDate, parseDateKey, totalsByKind, type KhataEntry } from '../types';
import { BalanceHeader } from './BalanceHeader';
import { EntryForm, type EntryFormValue } from './EntryForm';
import { EntryRow } from './EntryRow';

/** Any failure key the central mapper can return (offline, login, generic). */
export type LedgerErrorKey = string;

interface KhataLedgerProps {
  person: Person;
  entries: KhataEntry[];
  loading: boolean;
  errorKey: LedgerErrorKey | null;
  busy: boolean;
  onRetry: () => void;
  onAddEntry: (value: EntryFormValue) => Promise<void>;
  onUpdateEntry: (id: string, value: EntryFormValue) => Promise<void>;
  onDeleteEntry: (id: string) => Promise<void>;
}

/**
 * Full per-person ledger: big balance → share → new/edit entry form →
 * date-wise history with edit/delete. Shared by the Khata tab and the
 * person detail screen so the ledger looks the same everywhere.
 */
export function KhataLedger({
  person,
  entries,
  loading,
  errorKey,
  busy,
  onRetry,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
}: KhataLedgerProps) {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  const appName = t('common.appName');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<KhataEntry | null>(null);

  const balance = computeBalance(entries);

  function buildShareMessage(): string {
    const totals = totalsByKind(entries);
    const inr = (n: number) => formatINR(n, language);
    const balanceLine =
      balance > 0
        ? t('khata.shareIn', { amount: inr(balance) })
        : balance < 0
          ? t('khata.shareOut', { amount: inr(Math.abs(balance)) })
          : t('khata.shareClear');
    return [
      t('khata.shareHeader', { name: person.name }),
      balanceLine,
      t('khata.shareTotals', {
        given: inr(totals.credit),
        taken: inr(totals.debit),
        settled: inr(totals.payment),
        count: entries.length,
      }),
      t('khata.shareFooter', { app: appName }),
    ].join('\n');
  }

  async function handleShare() {
    const status = await shareKhataOnWhatsApp(person.phone, buildShareMessage());
    if (status === 'noApp') {
      Alert.alert(t('khata.shareTitle'), t('khata.shareNoApp'));
    } else if (status === 'failed') {
      Alert.alert(t('khata.shareTitle'), t('khata.shareFail'));
    }
  }

  async function handleAdd(value: EntryFormValue) {
    try {
      await onAddEntry(value);
      setShowForm(false);
    } catch (error) {
      Alert.alert(t('khata.addEntryTitle'), t(mapDbErrorToKey(error)));
    }
  }

  async function handleUpdate(value: EntryFormValue) {
    if (!editing) return;
    try {
      await onUpdateEntry(editing.id, value);
      setEditing(null);
    } catch (error) {
      Alert.alert(t('khata.editEntryTitle'), t(mapDbErrorToKey(error)));
    }
  }

  function confirmDelete(entry: KhataEntry) {
    Alert.alert(t('khata.deleteEntryTitle'), t('khata.deleteEntryBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          void onDeleteEntry(entry.id).catch((error: unknown) => {
            Alert.alert(t('khata.deleteEntryTitle'), t(mapDbErrorToKey(error)));
          });
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.muted}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (errorKey) {
    return (
      <View style={styles.center}>
        <View style={styles.errorCircle}>
          <MaterialIcons name="signal-wifi-off" size={48} color={colors.primary} />
        </View>
        <Text style={styles.errorTitle}>{t(errorKey)}</Text>
        <BigButton label={t('common.retry')} icon="refresh" onPress={onRetry} />
      </View>
    );
  }

  const groups = groupEntriesByDate(entries);
  const formOpen = showForm || editing !== null;

  return (
    <View style={styles.ledger}>
      <BalanceHeader balance={balance} />
      <View style={styles.actions}>
        {!formOpen ? (
          <BigButton
            label={t('khata.newEntry')}
            icon="add"
            onPress={() => setShowForm(true)}
            disabled={busy}
            testID="ledger-new-entry"
          />
        ) : null}
        {showForm ? (
          <EntryForm
            mode="add"
            submitting={busy}
            onSubmit={(v) => void handleAdd(v)}
            onCancel={() => setShowForm(false)}
          />
        ) : null}
        {editing ? (
          <EntryForm
            mode="edit"
            initial={editing}
            submitting={busy}
            onSubmit={(v) => void handleUpdate(v)}
            onCancel={() => setEditing(null)}
          />
        ) : null}
      </View>

      <View style={styles.historyHead}>
        <Text style={styles.historyTitle}>{t('khata.historyTitle')}</Text>
      </View>
      {groups.length === 0 && !formOpen ? (
        <EmptyState
          icon="book"
          title={t('khata.emptyLedgerTitle')}
          body={t('khata.emptyLedgerBody')}
        />
      ) : (
        groups.map((group) => (
          <View key={group.date} style={styles.day}>
            <View style={styles.dayHead}>
              <Text style={styles.dayDate}>{formatDate(parseDateKey(group.date), language)}</Text>
              {group.dayTotal !== 0 ? (
                <Text style={[styles.dayTotal, group.dayTotal > 0 ? styles.dayIn : styles.dayOut]}>
                  {group.dayTotal > 0 ? '+' : '−'}
                  {formatINR(Math.abs(group.dayTotal), language)}
                </Text>
              ) : null}
            </View>
            {group.items.map((entry) => (
              <EntryRow key={entry.id} entry={entry} onEdit={setEditing} onDelete={confirmDelete} />
            ))}
          </View>
        ))
      )}

      {entries.length > 0 ? (
        <BigButton
          label={t('khata.shareTitle')}
          icon="share"
          variant="secondary"
          onPress={() => void handleShare()}
          testID="ledger-share"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ledger: {
    gap: spacing.md,
  },
  actions: {
    gap: spacing.md,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  muted: {
    ...typography.body,
    color: colors.textMuted,
  },
  errorCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    ...typography.heading,
    color: colors.text,
    textAlign: 'center',
  },
  historyHead: {
    paddingTop: spacing.sm,
  },
  historyTitle: {
    ...typography.heading,
    color: colors.text,
  },
  day: {
    gap: spacing.sm,
  },
  dayHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  dayDate: {
    ...typography.bodyBold,
    color: colors.textMuted,
  },
  dayTotal: {
    ...typography.bodyBold,
  },
  dayIn: {
    color: colors.credit,
  },
  dayOut: {
    color: colors.debit,
  },
});
