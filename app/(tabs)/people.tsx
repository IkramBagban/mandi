import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { EmptyState, Screen } from '@/components';
import { colors, spacing, typography } from '@/theme';

/**
 * People shell.
 * TODO(feature:people-list): search box + photo grid + add-person flow.
 */
export default function PeopleScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('people.title')}</Text>
        <Text style={styles.subtitle}>{t('people.subtitle')}</Text>
      </View>
      <EmptyState
        icon="people"
        title={t('people.emptyTitle')}
        body={t('people.emptyBody')}
        actionLabel={t('people.addPerson')}
        onAction={() => {
          // TODO(feature:people-list): open the add-person sheet.
        }}
      />
      <Text style={styles.soon}>{t('common.comingSoon')}</Text>
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
  soon: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
