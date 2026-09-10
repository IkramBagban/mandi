import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import appJson from '../../app.json';
import { BigButton, Screen, ScreenSpacer } from '@/components';
import { formatIndianPhoneDisplay, useAuth } from '@/features/auth';
import { changeAppLanguage, isRtlLanguage, SUPPORTED_LANGUAGES } from '@/i18n';
import type { AppLanguage } from '@/i18n';
import { useSettingsStore } from '@/store/settings';
import { colors, radii, spacing, touchTargets, typography } from '@/theme';

/**
 * Settings shell: account (logout), language switcher, about.
 * Switching to/from Urdu flips the whole layout to RTL after one restart.
 */
export default function SettingsScreen() {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const { configured, user, signOut } = useAuth();
  const [switching, setSwitching] = useState<AppLanguage | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);

  const select = async (next: AppLanguage) => {
    if (next === language || switching) return;
    setSwitching(next);
    try {
      await changeAppLanguage(next, setLanguage);
    } finally {
      setSwitching(null);
    }
  };

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError(false);
    try {
      await signOut();
    } catch {
      setLogoutError(true);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings.title')}</Text>
      </View>

      <Text style={styles.sectionLabel}>{t('settings.language')}</Text>
      <View style={styles.card} role="radiogroup" aria-label={t('settings.language')}>
        {SUPPORTED_LANGUAGES.map((code) => {
          const selected = code === language;
          return (
            <Pressable
              key={code}
              onPress={() => void select(code)}
              disabled={switching !== null}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={t(`languages.${code}`)}
              style={({ pressed }) => [
                styles.row,
                selected && styles.rowSelected,
                pressed && styles.pressed,
              ]}
            >
              <MaterialIcons
                name={isRtlLanguage(code) ? 'format-textdirection-r-to-l' : 'language'}
                size={28}
                color={selected ? colors.primaryDark : colors.textMuted}
              />
              <Text style={[styles.rowLabel, selected && styles.rowLabelSelected]}>
                {t(`languages.${code}`)}
              </Text>
              <MaterialIcons
                name={selected ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={28}
                color={selected ? colors.primary : colors.disabled}
              />
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.note}>{t('settings.restartNote')}</Text>

      {configured ? (
        <>
          <Text style={styles.sectionLabel}>{t('settings.account')}</Text>
          <View style={styles.card}>
            <Text style={styles.body}>
              {user?.phone
                ? t('settings.signedInAs', {
                    phone: formatIndianPhoneDisplay(user.phone),
                  })
                : t('settings.notLoggedIn')}
            </Text>
          </View>
          {user ? (
            <>
              <BigButton
                label={t('settings.logout')}
                icon="logout"
                variant="danger"
                onPress={() => void logout()}
                disabled={loggingOut}
                testID="settings-logout"
              />
              {logoutError ? <Text style={styles.error}>{t('auth.errorGeneric')}</Text> : null}
            </>
          ) : null}
          <ScreenSpacer />
        </>
      ) : null}

      <Text style={styles.sectionLabel}>{t('settings.about')}</Text>
      <View style={styles.card}>
        <Text style={styles.body}>{t('settings.aboutBody')}</Text>
        <Text style={styles.version}>
          {t('settings.version')} {appJson.expo.version}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  sectionLabel: {
    ...typography.bodyBold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  row: {
    minHeight: touchTargets.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowSelected: {
    backgroundColor: colors.primarySoft,
  },
  pressed: {
    opacity: 0.7,
  },
  rowLabel: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  rowLabelSelected: {
    fontWeight: '700',
    color: colors.primaryDark,
  },
  note: {
    ...typography.caption,
    color: colors.textMuted,
  },
  error: {
    ...typography.body,
    color: colors.danger,
  },
  body: {
    ...typography.body,
    color: colors.text,
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  version: {
    ...typography.caption,
    color: colors.textMuted,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
});
