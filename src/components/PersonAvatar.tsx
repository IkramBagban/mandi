import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme';

interface PersonAvatarProps {
  name: string;
  photoUrl?: string | null;
  /** Diameter in dp. List rows use 40; pickers/detail use 48+. */
  size?: number;
}

const FALLBACK_COLORS = ['#1B7A43', '#6A3FB5', '#B26A00', '#0E6E8C', '#A1346B'] as const;

/** Photo-first identity: real photo when present, else big readable initials. */
export function PersonAvatar({ name, photoUrl, size = 44 }: PersonAvatarProps) {
  if (photoUrl) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={[styles.photo, { width: size, height: size, borderRadius: size / 2 }]}
        contentFit="cover"
        accessibilityLabel={name}
      />
    );
  }
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase();
  const colorIndex = Math.abs(hash(name)) % FALLBACK_COLORS.length;
  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: FALLBACK_COLORS[colorIndex],
        },
      ]}
      accessibilityLabel={name}
    >
      <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials || '?'}</Text>
    </View>
  );
}

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return h;
}

const styles = StyleSheet.create({
  photo: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.background,
    fontWeight: '700',
  },
});
