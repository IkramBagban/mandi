import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/theme';

export interface ChipOption {
  value: string;
  label: string;
}

interface ChipRowProps {
  label: string;
  options: ChipOption[];
  selected: string;
  onSelect: (value: string) => void;
  testIDPrefix?: string;
}

/**
 * Big wrap-grid of single-select chips. 56dp tall each — thumb-friendly for
 * commodity / quality picking with zero typing.
 */
export function ChipRow({ label, options, selected, onSelect, testIDPrefix }: ChipRowProps) {
  return (
    <View style={styles.wrapper} accessibilityLabel={label}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((opt) => {
          const active = opt.value === selected;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onSelect(opt.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={opt.label}
              testID={testIDPrefix ? `${testIDPrefix}-${opt.value}` : undefined}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
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
    minHeight: 56,
    minWidth: 72,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  pressed: {
    opacity: 0.8,
  },
  chipText: {
    ...typography.bodyBold,
    color: colors.text,
  },
  chipTextActive: {
    color: colors.background,
  },
});
