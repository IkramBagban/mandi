import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { colors, radii, spacing, touchTargets, typography } from '@/theme';

interface PersonSearchBarProps {
  value: string;
  onChange: (text: string) => void;
}

/** Compact search box: icon + text + one-tap clear. 48dp minimum. */
export function PersonSearchBar({ value, onChange }: PersonSearchBarProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      <MaterialIcons name="search" size={20} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={t('people.searchPlaceholder')}
        placeholderTextColor={colors.disabled}
        accessibilityLabel={t('people.searchPlaceholder')}
        returnKeyType="search"
        testID="people-search"
        style={styles.input}
      />
      {value ? (
        <Pressable
          onPress={() => onChange('')}
          accessibilityRole="button"
          accessibilityLabel={t('people.clearSearch')}
          testID="people-search-clear"
          style={styles.clear}
        >
          <MaterialIcons name="close" size={24} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touchTargets.primary,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  clear: {
    minWidth: touchTargets.minimum,
    minHeight: touchTargets.minimum,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
