import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  /** Wrap content in a ScrollView (default true — most screens scroll). */
  scroll?: boolean;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Standard screen shell: safe area + brand background + consistent padding.
 * Every tab screen uses this so spacing never drifts.
 */
export function Screen({ children, scroll = true, style, testID }: ScreenProps) {
  if (!scroll) {
    return (
      <SafeAreaView style={[styles.safe, style]} testID={testID}>
        {children}
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.safe} testID={testID}>
      <ScrollView
        contentContainerStyle={[styles.content, style]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
});

export function ScreenSpacer({ size = spacing.md }: { size?: number }) {
  return <View style={{ height: size }} />;
}
