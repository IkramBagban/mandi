import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { BigButton, EmptyState, PersonAvatar, Screen } from '@/components';
import { KhataLedger, type LedgerErrorKey } from '@/features/khata/components/KhataLedger';
import type { EntryFormValue } from '@/features/khata/components/EntryForm';
import {
  addEntry,
  deleteEntriesForPerson,
  deleteEntry,
  listEntries,
  updateEntry,
} from '@/features/khata/repository';
import { callPerson, shareKhataOnWhatsApp } from '@/features/khata/share';
import type { KhataEntry } from '@/features/khata/types';
import { deletePerson, getPerson } from '@/features/people/repository';
import type { Person } from '@/features/people/types';
import { mapDbErrorToKey } from '@/lib/dbErrors';
import { colors, radii, spacing, touchTargets, typography } from '@/theme';

function toErrorKey(error: unknown): LedgerErrorKey {
  return mapDbErrorToKey(error);
}

/**
 * Person detail: big photo + name, call/WhatsApp buttons, lifetime balance
 * ledger (add/edit/delete entries, WhatsApp share), delete person.
 */
export default function PersonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const [person, setPerson] = useState<Person | null>(null);
  const [entries, setEntries] = useState<KhataEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [errorKey, setErrorKey] = useState<LedgerErrorKey | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErrorKey(null);
    setMissing(false);
    try {
      const row = await getPerson(id);
      if (!row) {
        setMissing(true);
        return;
      }
      setPerson(row);
      setEntries(await listEntries(id));
    } catch (error) {
      setErrorKey(toErrorKey(error));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function withBusy<T>(work: () => Promise<T>): Promise<T> {
    setBusy(true);
    try {
      return await work();
    } finally {
      setBusy(false);
    }
  }

  async function handleAddEntry(value: EntryFormValue) {
    if (!person) return;
    await withBusy(async () => {
      await addEntry({ person_id: person.id, ...value });
      setEntries(await listEntries(person.id));
    });
  }

  async function handleUpdateEntry(entryId: string, value: EntryFormValue) {
    if (!person) return;
    await withBusy(async () => {
      await updateEntry(entryId, { ...value });
      setEntries(await listEntries(person.id));
    });
  }

  async function handleDeleteEntry(entryId: string) {
    if (!person) return;
    await withBusy(async () => {
      await deleteEntry(entryId);
      setEntries(await listEntries(person.id));
    });
  }

  async function handleCall() {
    if (!person?.phone) return;
    const status = await callPerson(person.phone);
    if (status !== 'opened') {
      Alert.alert(t('people.callNow'), t('errors.failed'));
    }
  }

  async function handleWhatsApp() {
    if (!person?.phone) return;
    const status = await shareKhataOnWhatsApp(person.phone);
    if (status === 'noApp') {
      Alert.alert(t('people.whatsappNow'), t('khata.shareNoApp'));
    } else if (status === 'failed') {
      Alert.alert(t('people.whatsappNow'), t('khata.shareFail'));
    }
  }

  function confirmDeletePerson() {
    if (!person) return;
    const personId = person.id;
    Alert.alert(t('people.deletePersonTitle'), t('people.deletePersonBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          void withBusy(async () => {
            await deletePerson(personId);
            await deleteEntriesForPerson(personId);
            router.replace('/people');
          }).catch((error: unknown) => {
            Alert.alert(t('people.deletePersonTitle'), t(mapDbErrorToKey(error)));
          });
        },
      },
    ]);
  }

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.muted}>{t('common.loading')}</Text>
        </View>
      </Screen>
    );
  }

  if (missing || (!person && errorKey)) {
    return (
      <Screen>
        <EmptyState
          icon="person-off"
          title={t('errors.failed')}
          body={t('people.emptyBody')}
          actionLabel={t('common.back')}
          onAction={() => router.replace('/people')}
        />
      </Screen>
    );
  }

  if (!person) {
    return (
      <Screen>
        <View style={styles.center}>
          <View style={styles.errorCircle}>
            <MaterialIcons name="signal-wifi-off" size={48} color={colors.primary} />
          </View>
          <Text style={styles.errorTitle}>{t(errorKey ?? 'errors.failed')}</Text>
          <BigButton label={t('common.retry')} icon="refresh" onPress={() => void load()} />
        </View>
      </Screen>
    );
  }

  const meta = [person.village].filter(Boolean).join(' · ');

  return (
    <Screen>
      <View style={styles.profile}>
        <PersonAvatar name={person.name} photoUrl={person.photo_url} size={104} />
        <Text style={styles.name}>{person.name}</Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        {person.phone ? <Text style={styles.phone}>{person.phone}</Text> : null}
        {person.notes ? <Text style={styles.notes}>{person.notes}</Text> : null}
        {person.phone ? (
          <View style={styles.contactRow}>
            <BigButton
              label={t('people.callNow')}
              icon="call"
              onPress={() => void handleCall()}
              style={styles.contactButton}
              testID="person-call"
            />
            <BigButton
              label={t('people.whatsappNow')}
              icon="chat"
              variant="secondary"
              onPress={() => void handleWhatsApp()}
              style={styles.contactButton}
              testID="person-whatsapp"
            />
          </View>
        ) : null}
      </View>

      <KhataLedger
        person={person}
        entries={entries}
        loading={false}
        errorKey={errorKey}
        busy={busy}
        onRetry={() => void load()}
        onAddEntry={handleAddEntry}
        onUpdateEntry={handleUpdateEntry}
        onDeleteEntry={handleDeleteEntry}
      />

      <BigButton
        label={t('people.deletePerson')}
        icon="delete-outline"
        variant="danger"
        onPress={confirmDeletePerson}
        disabled={busy}
        testID="person-delete"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
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
  profile: {
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  name: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
  },
  meta: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  phone: {
    ...typography.heading,
    color: colors.text,
  },
  notes: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  contactRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    paddingTop: spacing.sm,
  },
  contactButton: {
    flex: 1,
    minHeight: touchTargets.primary,
  },
});
