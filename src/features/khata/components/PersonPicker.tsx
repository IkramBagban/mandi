import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { PersonAvatar } from '@/components';
import { colors, radii, spacing, touchTargets, typography } from '@/theme';
import type { Person } from '@/features/people/types';

interface PersonPickerProps {
  people: Person[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/**
 * Horizontal photo-first person picker for the Khata tab: big avatars with
 * names underneath, selected face ringed in brand green. 72dp+ targets.
 */
export function PersonPicker({ people, selectedId, onSelect }: PersonPickerProps) {
  return (
    <FlatList
      data={people}
      keyExtractor={(item) => item.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      testID="khata-person-picker"
      renderItem={({ item }) => {
        const active = item.id === selectedId;
        return (
          <Pressable
            onPress={() => onSelect(item.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={item.name}
            testID={`khata-pick-${item.id}`}
            style={styles.item}
          >
            <View style={[styles.ring, active && styles.ringActive]}>
              <PersonAvatar name={item.name} photoUrl={item.photo_url} size={72} />
            </View>
            <Text style={[styles.name, active && styles.nameActive]} numberOfLines={2}>
              {item.name}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  item: {
    width: 88,
    minHeight: touchTargets.avatar + 40,
    alignItems: 'center',
    gap: spacing.xs,
  },
  ring: {
    borderRadius: radii.full,
    borderWidth: 3,
    borderColor: 'transparent',
    padding: 2,
  },
  ringActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  name: {
    ...typography.caption,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  nameActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
});
