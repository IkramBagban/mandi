import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BigButton, Screen } from '@/components';
import { colors, spacing, typography } from '@/theme';

/**
 * Home: greeting + the three daily jobs as giant buttons.
 * One tap → the right tab. Nothing else competes for attention.
 */
export default function HomeScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('home.title')}</Text>
        <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
      </View>
      <BigButton
        label={`${t('home.openPeople')} · ${t('home.openPeopleHint')}`}
        icon="people"
        onPress={() => router.push('/people')}
        testID="home-open-people"
      />
      <BigButton
        label={`${t('home.openKhata')} · ${t('home.openKhataHint')}`}
        icon="book"
        onPress={() => router.push('/khata')}
        testID="home-open-khata"
      />
      <BigButton
        label={`${t('home.openRecords')} · ${t('home.openRecordsHint')}`}
        icon="scale"
        onPress={() => router.push('/records')}
        testID="home-open-records"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
  },
});
