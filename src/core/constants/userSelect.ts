// ─── Canonical Prisma select for safe user responses ─────
// Single source of truth used by both auth.service and user.service.
// Sensitive fields (password, refreshToken, otp, otpExpires,
// otpVerified, resetExpires) are intentionally absent.

const SAFE_USER_SELECT = {
  id:                     true,
  name:                   true,
  email:                  true,
  username:               true,
  dob:                    true,
  phone:                  true,
  gender:                 true,
  role:                   true,
  stripeAccountId:        true,
  bio:                    true,
  addressCountry:         true,
  addressCityState:       true,
  addressRoadArea:        true,
  addressPostalCode:      true,
  addressTaxId:           true,
  profileImage:           true,
  multiProfileImage:      true,
  pdfFile:                true,
  isVerified:             true,
  hasActiveSubscription:  true,
  subscriptionExpireDate: true,
  blockedUsers:           true,
  language:               true,
  createdAt:              true,
  updatedAt:              true,
} as const;

export default SAFE_USER_SELECT;