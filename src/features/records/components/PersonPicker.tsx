import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { ListRow, PersonAvatar } from '@/components';
import type { Person } from '@/features/people/types';
import { colors, radii, spacing, touchTargets, typography } from '@/theme';

import { searchPeople } from '../people';

interface PersonPickerProps {
  selected: Person | null;
  onSelect: (person: Person) => void;
  error?: string | null;
}

/**
 * "Whose maal?" — search box + photo rows. Search matches name or village.
 * Single tap selects (green ring + check). Read-only use of the people
 * feature: the add-person UI belongs to another worker.
 */
export function PersonPicker({ selected, onSelect, error }: PersonPickerProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      searchPeople(query)
        .then(({ people }) => {
          if (!cancelled) setResults(people.slice(0, 6));
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const onQueryChange = (text: string) => {
    setQuery(text);
    setLoading(true);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{t('sale.person')}</Text>
      <View style={[styles.searchRow, error ? styles.searchError : null]}>
        <MaterialIcons name="search" size={20} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder={t('sale.searchPerson')}
          placeholderTextColor={colors.disabled}
          accessibilityLabel={t('sale.searchPerson')}
          testID="sale-person-search"
          style={styles.searchInput}
          returnKeyType="search"
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {selected ? (
        <ListRow
          avatar={<PersonAvatar name={selected.name} photoUrl={selected.photo_url} size={40} />}
          title={selected.name}
          subtitle={selected.village}
          selected
          right={<MaterialIcons name="check-circle" size={20} color={colors.primary} />}
          testID={`sale-person-selected-${selected.id}`}
        />
      ) : null}
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} testID="sale-person-loading" />
      ) : (
        <View style={styles.list}>
          {results
            .filter((p) => p.id !== selected?.id)
            .map((person) => (
              <ListRow
                key={person.id}
                avatar={<PersonAvatar name={person.name} photoUrl={person.photo_url} size={40} />}
                title={person.name}
                subtitle={person.village}
                onPress={() => onSelect(person)}
                testID={`sale-person-${person.id}`}
              />
            ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  label: {
    ...typography.bodyBold,
    color: colors.text,
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
  searchError: {
    borderColor: colors.danger,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
  list: {
    gap: spacing.sm,
  },
});
