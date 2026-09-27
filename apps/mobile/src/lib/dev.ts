/**
 * Dev-only shortcuts. Must match the API's DEV_FIXED_OTP. Stripped from release builds
 * because every use is guarded by __DEV__.
 */
export const DEV_SKIP_EMAIL_CODE = __DEV__;
export const DEV_FIXED_OTP = "000000";
