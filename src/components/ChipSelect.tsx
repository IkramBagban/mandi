import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, touchTargets, typography } from '@/theme';

export interface ChipOption<T extends string> {
  value: T;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

interface ChipSelectProps<T extends string> {
  label?: string;
  options: ChipOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  testID?: string;
}

/**
 * Big single-choice chips (person type, entry kind, pay method). Every chip
 * is ≥48dp with icon + label so low-literacy users tap pictures, not text.
 */
export function ChipSelect<T extends string>({
  label,
  options,
  selected,
  onSelect,
  testID,
}: ChipSelectProps<T>) {
  return (
    <View style={styles.wrapper} testID={testID}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        {options.map((option) => {
          const active = option.value === selected;
          return (
            <Pressable
              key={option.value}
              onPress={() => onSelect(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={option.label}
              testID={testID ? `${testID}-${option.value}` : undefined}
              style={[styles.chip, active && styles.chipActive]}
            >
              <MaterialIcons
                name={option.icon}
                size={26}
                color={active ? colors.background : colors.primary}
              />
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
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
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minHeight: touchTargets.minimum,
    minWidth: touchTargets.minimum,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.card,
    flexGrow: 1,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  chipLabel: {
    ...typography.bodyBold,
    color: colors.primaryDark,
  },
  chipLabelActive: {
    color: colors.background,
  },
});
