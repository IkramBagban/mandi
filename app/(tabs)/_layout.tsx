import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { ColorValue } from 'react-native';

import { colors } from '@/theme';

function TabIcon({
  name,
  color,
}: {
  name: keyof typeof MaterialIcons.glyphMap;
  color: ColorValue;
  size?: number;
}) {
  return <MaterialIcons name={name} size={22} color={color as string} />;
}

/**
 * Five tabs, icon + one-word label each. Order follows the daily flow:
 * Home → People → Khata → Sales → Settings.
 */
export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { minHeight: 56, paddingBottom: 6, paddingTop: 4 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        tabBarIconStyle: { marginBottom: 0 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: (props) => <TabIcon name="home" {...props} />,
        }}
      />
      <Tabs.Screen
        name="people"
        options={{
          title: t('tabs.people'),
          tabBarIcon: (props) => <TabIcon name="people" {...props} />,
        }}
      />
      <Tabs.Screen
        name="khata"
        options={{
          title: t('tabs.khata'),
          tabBarIcon: (props) => <TabIcon name="book" {...props} />,
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: t('tabs.records'),
          tabBarIcon: (props) => <TabIcon name="scale" {...props} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: (props) => <TabIcon name="settings" {...props} />,
        }}
      />
    </Tabs>
  );
}
