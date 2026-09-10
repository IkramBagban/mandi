import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PersonAvatar } from '@/components';
import type { PersonType } from '@/lib/database.types';
import { colors, radii, spacing, typography } from '@/theme';

import type { Person } from '../types';

type TypeLabelKey =
  | 'people.typeFarmer'
  | 'people.typeBuyer'
  | 'people.typeSeller'
  | 'people.typeTransporter'
  | 'people.typeOther';

/**
 * Legacy DB rows may carry `trader`/`labour` (pre-feature check values);
 * show them under the closest current role instead of raw codes.
 */
function typeLabelKey(type: PersonType): TypeLabelKey {
  switch (type) {
    case 'farmer':
      return 'people.typeFarmer';
    case 'buyer':
    case 'trader':
      return 'people.typeBuyer';
    case 'seller':
      return 'people.typeSeller';
    case 'transporter':
      return 'people.typeTransporter';
    case 'labour':
    case 'other':
    default:
      return 'people.typeOther';
  }
}

/**
 * One row in the people list: huge photo first, name big, role + village
 * small. Whole row (88dp+) is the touch target — one tap opens the person.
 */
export function PersonCard({ person, onPress }: { person: Person; onPress: () => void }) {
  const { t } = useTranslation();
  const meta = [t(typeLabelKey(person.type)), person.village].filter(Boolean).join(' · ');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={person.name}
      testID={`person-card-${person.id}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <PersonAvatar name={person.name} photoUrl={person.photo_url} size={72} />
      <View style={styles.texts}>
        <Text style={styles.name} numberOfLines={1}>
          {person.name}
        </Text>
        {meta ? (
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
        {person.phone ? (
          <View style={styles.phoneRow}>
            <MaterialIcons name="call" size={16} color={colors.textMuted} />
            <Text style={styles.phone}>{person.phone}</Text>
          </View>
        ) : null}
      </View>
      <MaterialIcons name="chevron-right" size={32} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 96,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  pressed: {
    opacity: 0.8,
    borderColor: colors.primary,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.bodyBold,
    fontSize: 20,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phone: {
    ...typography.caption,
    color: colors.text,
  },
});
