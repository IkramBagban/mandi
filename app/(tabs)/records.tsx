import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { EmptyState, Screen } from '@/components';
import { colors, spacing, typography } from '@/theme';

/**
 * Sale records shell.
 * TODO(feature:sale-entry): sale list → new-sale wizard (commodity chips →
 * weight → rate → expenses → photo → net confirmation).
 */
export default function RecordsScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('records.title')}</Text>
        <Text style={styles.subtitle}>{t('records.subtitle')}</Text>
      </View>
      <EmptyState
        icon="scale"
        title={t('records.emptyTitle')}
        body={t('records.emptyBody')}
        actionLabel={t('records.newSale')}
        onAction={() => {
          // TODO(feature:sale-entry): open the new-sale wizard.
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
