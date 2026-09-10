import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { PersonAvatar } from '@/components';
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
    setLoading(true);
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

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{t('sale.person')}</Text>
      <View style={[styles.searchRow, error ? styles.searchError : null]}>
        <MaterialIcons name="search" size={28} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
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
        <View style={styles.selectedRow}>
          <PersonAvatar name={selected.name} photoUrl={selected.photo_url} size={56} />
          <View style={styles.selectedText}>
            <Text style={styles.name}>{selected.name}</Text>
            {selected.village ? <Text style={styles.village}>{selected.village}</Text> : null}
          </View>
          <MaterialIcons name="check-circle" size={32} color={colors.primary} />
        </View>
      ) : null}
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} testID="sale-person-loading" />
      ) : (
        <View style={styles.list}>
          {results
            .filter((p) => p.id !== selected?.id)
            .map((person) => (
              <Pressable
                key={person.id}
                onPress={() => onSelect(person)}
                accessibilityRole="radio"
                accessibilityLabel={person.name}
                testID={`sale-person-${person.id}`}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <PersonAvatar name={person.name} photoUrl={person.photo_url} size={56} />
                <View style={styles.rowText}>
                  <Text style={styles.name}>{person.name}</Text>
                  {person.village ? <Text style={styles.village}>{person.village}</Text> : null}
                </View>
              </Pressable>
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
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
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
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 72,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primarySoft,
  },
  selectedText: {
    flex: 1,
  },
  list: {
    gap: spacing.sm,
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
  pressed: {
    opacity: 0.8,
  },
  rowText: {
    flex: 1,
  },
  name: {
    ...typography.bodyBold,
    color: colors.text,
  },
  village: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
