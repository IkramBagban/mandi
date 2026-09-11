import { MaterialIcons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, shadows, spacing, typography } from '@/theme';

interface ListRowProps {
  /** Photo or icon shown first — recognition over recall. */
  avatar?: ReactNode;
  title: string;
  subtitle?: string | null;
  /** Right-hand content, e.g. a balance or amount. */
  right?: ReactNode;
  /** Show a navigation chevron (tappable rows that open a detail). */
  chevron?: boolean;
  /** Highlight ring for the selected state (pickers). */
  selected?: boolean;
  onPress?: () => void;
  testID?: string;
}

/**
 * The one shared list row: people, picker results, sales, debtors.
 * Dense and scannable (64dp) with photo first, name + one muted line,
 * optional right amount. Touch target stays ≥44dp via the full-row press.
 */
export function ListRow({
  avatar,
  title,
  subtitle,
  right,
  chevron = false,
  selected = false,
  onPress,
  testID,
}: ListRowProps) {
  const body = (
    <>
      {avatar}
      <View style={styles.texts}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
      {chevron ? <MaterialIcons name="chevron-right" size={20} color={colors.textFaint} /> : null}
    </>
  );
  if (!onPress) {
    return (
      <View style={[styles.row, selected && styles.selected]} testID={testID}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      testID={testID}
      style={({ pressed }) => [styles.row, selected && styles.selected, pressed && styles.pressed]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 64,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.card,
    ...shadows.card,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  pressed: {
    opacity: 0.75,
  },
  texts: {
    flex: 1,
    gap: 1,
  },
  title: {
    ...typography.bodyBold,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
