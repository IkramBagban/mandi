export { AuthProvider, useAuth } from './AuthProvider';
export { isNetworkError, mapAuthErrorToKey } from './errors';
export { formatIndianPhoneDisplay, toE164Indian } from './phone';
export { getSessionUser, requestOtp, signOut, subscribeToAuthChanges, verifyOtp } from './repository';
export { MAX_VERIFY_ATTEMPTS, OTP_CHANNEL_ORDER, OTP_LENGTH, RESEND_COOLDOWN_SECONDS } from './types';
export type { AuthUser, OtpChannel, RequestOtpInput, VerifyOtpInput } from './types';
