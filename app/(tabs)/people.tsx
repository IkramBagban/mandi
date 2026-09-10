import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';

import { BigButton, EmptyState, Screen } from '@/components';
import { PersonCard } from '@/features/people/components/PersonCard';
import { PersonForm } from '@/features/people/components/PersonForm';
import { PersonSearchBar } from '@/features/people/components/PersonSearchBar';
import { RepoError } from '@/lib/offline';
import { colors, spacing, typography } from '@/theme';

import { createPerson, listPeople } from '@/features/people/repository';
import { persistPersonPhoto } from '@/features/people/photo';
import { filterPeople, type Person, type PersonDraft } from '@/features/people/types';

type PeopleErrorKey = 'errors.offline' | 'errors.failed';

function toErrorKey(error: unknown): PeopleErrorKey {
  return error instanceof RepoError && error.code === 'offline'
    ? 'errors.offline'
    : 'errors.failed';
}

/**
 * People tab: photo-first list + name/phone search + add-person form.
 * One primary action per state: Add person (list) or Save (form).
 */
export default function PeopleScreen() {
  const { t } = useTranslation();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<PeopleErrorKey | null>(null);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorKey(null);
    try {
      setPeople(await listPeople());
    } catch (error) {
      setErrorKey(toErrorKey(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!showForm) void load();
    }, [load, showForm]),
  );

  const visible = useMemo(() => filterPeople(people, query), [people, query]);

  async function handleSubmit(draft: PersonDraft) {
    setSubmitting(true);
    try {
      const photoUrl = draft.photo_url ? await persistPersonPhoto(draft.photo_url) : null;
      await createPerson({ ...draft, photo_url: photoUrl });
      setShowForm(false);
      setQuery('');
      await load();
    } catch (error) {
      Alert.alert(t('people.addTitle'), t(toErrorKey(error)));
    } finally {
      setSubmitting(false);
    }
  }

  if (showForm) {
    return (
      <Screen>
        <Text style={styles.title}>{t('people.addTitle')}</Text>
        <PersonForm
          submitting={submitting}
          onSubmit={(draft) => void handleSubmit(draft)}
          onCancel={() => setShowForm(false)}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('people.title')}</Text>
        <Text style={styles.subtitle}>{t('people.subtitle')}</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.muted}>{t('common.loading')}</Text>
        </View>
      ) : errorKey ? (
        <View style={styles.center}>
          <View style={styles.errorCircle}>
            <MaterialIcons name="signal-wifi-off" size={48} color={colors.primary} />
          </View>
          <Text style={styles.errorTitle}>{t(errorKey)}</Text>
          <BigButton label={t('common.retry')} icon="refresh" onPress={() => void load()} />
        </View>
      ) : people.length === 0 ? (
        <EmptyState
          icon="people"
          title={t('people.emptyTitle')}
          body={t('people.emptyBody')}
          actionLabel={t('people.addPerson')}
          onAction={() => setShowForm(true)}
        />
      ) : (
        <>
          <PersonSearchBar value={query} onChange={setQuery} />
          {visible.length === 0 ? (
            <EmptyState
              icon="search-off"
              title={t('people.searchEmptyTitle')}
              body={t('people.searchEmptyBody')}
            />
          ) : (
            <FlatList
              data={visible}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              testID="people-list"
              renderItem={({ item }) => (
                <PersonCard
                  person={item}
                  onPress={() =>
                    router.push({ pathname: '/person/[id]', params: { id: item.id } })
                  }
                />
              )}
            />
          )}
          <BigButton
            label={t('people.addPerson')}
            icon="add"
            onPress={() => setShowForm(true)}
            testID="people-add"
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: spacing.lg,
    gap: spacing.md,
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
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
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
});
