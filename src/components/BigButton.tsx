import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors, radii, spacing, touchTargets, typography } from '@/theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface BigButtonProps {
  label: string;
  onPress: () => void;
  /** Icon shown before the label — icon-first is the point of this button. */
  icon?: keyof typeof MaterialIcons.glyphMap;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

/**
 * The one primary action per screen. 52dp tall with icon + label so it stays
 * unmissable for low-literacy users without dominating the layout.
 */
export function BigButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled = false,
  style,
  testID,
}: BigButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon ? (
        <MaterialIcons
          name={icon}
          size={20}
          color={variant === 'secondary' ? colors.primary : colors.background}
        />
      ) : null}
      <Text style={[styles.label, variant === 'secondary' && styles.labelSecondary]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTargets.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    backgroundColor: colors.disabled,
    borderColor: colors.disabled,
  },
  label: {
    ...typography.button,
    color: colors.background,
    textAlign: 'center',
  },
  labelSecondary: {
    color: colors.primaryDark,
  },
});
