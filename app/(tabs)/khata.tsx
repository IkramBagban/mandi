import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { EmptyState, Screen } from '@/components';
import { colors, spacing, typography } from '@/theme';

/**
 * Khata shell.
 * TODO(feature:khata-ledger): person picker → balance header → entry list →
 * new-entry form (AmountInput + cash/UPI/udhaar chips).
 */
export default function KhataScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('khata.title')}</Text>
        <Text style={styles.subtitle}>{t('khata.subtitle')}</Text>
      </View>
      <EmptyState
        icon="book"
        title={t('khata.emptyTitle')}
        body={t('khata.emptyBody')}
        actionLabel={t('khata.newEntry')}
        onAction={() => {
          // TODO(feature:khata-ledger): open the new-entry sheet.
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
