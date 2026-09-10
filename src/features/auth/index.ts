export { AuthProvider, useAuth } from './AuthProvider';
export { isNetworkError, mapAuthErrorToKey } from './errors';
export { MIN_PASSWORD_LENGTH, validatePassword } from './password';
export type { PasswordResult } from './password';
export { PasswordInput } from './PasswordInput';
export { PhoneEntry } from './PhoneEntry';
export { MAX_PHONE_CHARS, PhoneField } from './PhoneField';
export {
  SYNTHETIC_EMAIL_DOMAIN,
  formatIndianPhoneDisplay,
  phoneFromSyntheticEmail,
  syntheticEmailFor,
  toE164Indian,
} from './phone';
export {
  getSessionUser,
  linkPhoneNumber,
  requestOtp,
  setPassword,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  subscribeToAuthChanges,
  verifyOtp,
} from './repository';
export {
  MAX_VERIFY_ATTEMPTS,
  OTP_CHANNEL_ORDER,
  OTP_LENGTH,
  RESEND_COOLDOWN_SECONDS,
} from './types';
export type {
  AuthUser,
  OtpChannel,
  RequestOtpInput,
  SetPasswordInput,
  SetPasswordMode,
  SignInWithPasswordInput,
  VerifyOtpInput,
  VerifyPurpose,
} from './types';
