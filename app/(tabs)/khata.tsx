import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { BigButton, EmptyState, Screen } from '@/components';
import { KhataLedger, type LedgerErrorKey } from '@/features/khata/components/KhataLedger';
import type { EntryFormValue } from '@/features/khata/components/EntryForm';
import { PersonPicker } from '@/features/khata/components/PersonPicker';
import { addEntry, deleteEntry, listEntries, updateEntry } from '@/features/khata/repository';
import type { KhataEntry } from '@/features/khata/types';
import { listPeople } from '@/features/people/repository';
import type { Person } from '@/features/people/types';
import { RepoError } from '@/lib/offline';
import { colors, spacing, typography } from '@/theme';

function toErrorKey(error: unknown): LedgerErrorKey {
  return error instanceof RepoError && error.code === 'offline'
    ? 'errors.offline'
    : 'errors.failed';
}

/**
 * Khata tab: pick a face → lifetime balance → add/edit entries → history →
 * WhatsApp share. The ledger itself is `KhataLedger`, shared with the
 * person detail screen.
 */
export default function KhataScreen() {
  const { t } = useTranslation();
  const [people, setPeople] = useState<Person[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(true);
  const [peopleError, setPeopleError] = useState<LedgerErrorKey | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [entries, setEntries] = useState<KhataEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entriesError, setEntriesError] = useState<LedgerErrorKey | null>(null);
  const [busy, setBusy] = useState(false);

  const loadPeople = useCallback(async () => {
    setPeopleLoading(true);
    setPeopleError(null);
    try {
      const rows = await listPeople();
      setPeople(rows);
      setSelectedId((current) => {
        if (current && rows.some((p) => p.id === current)) return current;
        return rows[0]?.id ?? null;
      });
    } catch (error) {
      setPeopleError(toErrorKey(error));
    } finally {
      setPeopleLoading(false);
    }
  }, []);

  const loadEntries = useCallback(async (personId: string) => {
    setEntriesLoading(true);
    setEntriesError(null);
    try {
      setEntries(await listEntries(personId));
    } catch (error) {
      setEntriesError(toErrorKey(error));
    } finally {
      setEntriesLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPeople();
    }, [loadPeople]),
  );

  useFocusEffect(
    useCallback(() => {
      if (selectedId) void loadEntries(selectedId);
    }, [loadEntries, selectedId]),
  );

  const selected = people.find((p) => p.id === selectedId) ?? null;

  async function withBusy<T>(work: () => Promise<T>): Promise<T> {
    setBusy(true);
    try {
      return await work();
    } finally {
      setBusy(false);
    }
  }

  async function handleAddEntry(value: EntryFormValue) {
    if (!selectedId) return;
    const personId = selectedId;
    await withBusy(async () => {
      await addEntry({ person_id: personId, ...value });
      setEntries(await listEntries(personId));
    });
  }

  async function handleUpdateEntry(entryId: string, value: EntryFormValue) {
    if (!selectedId) return;
    const personId = selectedId;
    await withBusy(async () => {
      await updateEntry(entryId, { ...value });
      setEntries(await listEntries(personId));
    });
  }

  async function handleDeleteEntry(entryId: string) {
    if (!selectedId) return;
    const personId = selectedId;
    await withBusy(async () => {
      await deleteEntry(entryId);
      setEntries(await listEntries(personId));
    });
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('khata.title')}</Text>
        <Text style={styles.subtitle}>{t('khata.subtitle')}</Text>
      </View>

      {peopleLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.muted}>{t('common.loading')}</Text>
        </View>
      ) : peopleError ? (
        <View style={styles.center}>
          <View style={styles.errorCircle}>
            <MaterialIcons name="signal-wifi-off" size={48} color={colors.primary} />
          </View>
          <Text style={styles.errorTitle}>{t(peopleError)}</Text>
          <BigButton label={t('common.retry')} icon="refresh" onPress={() => void loadPeople()} />
        </View>
      ) : people.length === 0 ? (
        <EmptyState
          icon="book"
          title={t('khata.emptyTitle')}
          body={t('khata.emptyBody')}
          actionLabel={t('people.addPerson')}
          onAction={() => router.push('/people')}
        />
      ) : (
        <>
          <Text style={styles.pickerHint}>{t('khata.selectPersonHint')}</Text>
          <PersonPicker
            people={people}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              void loadEntries(id);
            }}
          />
          {selected ? (
            <KhataLedger
              person={selected}
              entries={entries}
              loading={entriesLoading}
              errorKey={entriesError}
              busy={busy}
              onRetry={() => selectedId && void loadEntries(selectedId)}
              onAddEntry={handleAddEntry}
              onUpdateEntry={handleUpdateEntry}
              onDeleteEntry={handleDeleteEntry}
            />
          ) : null}
        </>
      )}
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
  pickerHint: {
    ...typography.bodyBold,
    color: colors.text,
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
});
