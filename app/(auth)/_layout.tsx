import { Stack } from 'expo-router';

/**
 * Logged-out stack: phone → code. The root layout redirects here whenever
 * there is no session (and away from here once signed in).
 */
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="verify" />
    </Stack>
  );
}
