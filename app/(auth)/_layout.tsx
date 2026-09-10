import { Stack } from 'expo-router';

/**
 * Logged-out stack: login (password-first tabs) → code → set-password,
 * plus the signup and forgot-password entries that feed the same code
 * screen with a purpose. The root layout redirects here whenever there is
 * no session (and away from here once signed in — except set-password,
 * which NEEDS the fresh OTP session to authorise the password write).
 */
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot" />
      <Stack.Screen name="password" />
    </Stack>
  );
}
