import type { TFunction } from "i18next";

type PbFieldError = { code?: string };
type PbError = {
  status?: number;
  response?: {
    data?: Record<string, PbFieldError>;
    message?: string;
  };
};

// Maps field → error code → friendly translated message.
// Covers every validation_* code that can realistically come from the auth forms.
const FIELD_CODE_MAP: Record<
  string,
  Record<string, (t: TFunction) => string>
> = {
  email: {
    validation_required: (t) => t("auth.emailRequired", "Email is required."),
    validation_not_unique: (t) => t("auth.duplicateEmail"),
    validation_invalid_format: (t) =>
      t("auth.invalidEmail", "Please enter a valid email address."),
    validation_email_domain_not_allowed: (t) =>
      t("auth.emailDomainNotAllowed", "This email domain is not allowed.")
  },
  name: {
    validation_required: (t) => t("auth.nameRequired", "Name is required."),
    validation_invalid_format: (t) =>
      t(
        "auth.invalidName",
        "Name must start with a letter and may only contain letters, numbers, spaces, hyphens, periods, or apostrophes."
      ),
    validation_min_text_constraint: (t) =>
      t("auth.nameTooShort", "Name must be at least 2 characters."),
    validation_max_text_constraint: (t) =>
      t("auth.nameTooLong", "Name must be no more than 50 characters.")
  },
  password: {
    validation_required: (t) =>
      t("auth.passwordRequired", "Password is required."),
    validation_min_text_constraint: (t) =>
      t("auth.passwordTooShort", "Password must be at least 6 characters.")
  },
  passwordConfirm: {
    validation_required: (t) =>
      t("auth.confirmPasswordRequired", "Please confirm your password."),
    validation_values_mismatch: (t) =>
      t("auth.passwordsMismatch", "Passwords do not match.")
  }
};

/**
 * Maps a raw PocketBase ClientResponseError to a user-friendly string.
 * Returns null for unrecognised errors so callers can fall back to raw display.
 *
 * Error shape (from PocketBase Go backend + JS SDK):
 *   err.status                  — HTTP status code
 *   err.response.data           — field-level validation errors { field: { code, message } }
 *   err.response.message        — top-level human-readable message
 */
export function mapPbAuthError(err: unknown, t: TFunction): string | null {
  const pb = err as PbError;
  const status = pb?.status;
  const data = pb?.response?.data;
  const message = pb?.response?.message ?? "";

  // 1. Field-level validation errors (data has entries)
  if (data && typeof data === "object" && Object.keys(data).length > 0) {
    for (const [field, fieldErr] of Object.entries(data)) {
      const code = fieldErr?.code;
      if (!code) continue;
      const msg = FIELD_CODE_MAP[field]?.[code];
      if (msg) return msg(t);
    }
  }

  // 2. Non-validation HTTP errors (data is empty {})

  // 400 — wrong credentials (login)
  if (status === 400 && /authenticate/i.test(message)) {
    return t("auth.invalidCredentials", "Incorrect email or password.");
  }

  // 400 — invalid/expired OTP or MFA session
  if (status === 400 && /otp|mfa session/i.test(message)) {
    return t(
      "auth.invalidOtp",
      "Invalid or expired code. Please request a new one."
    );
  }

  // 400 — invalid/expired verification or email-change token (usermgmt page)
  if (status === 400 && /token/i.test(message)) {
    return t(
      "auth.invalidToken",
      "This link is invalid or has expired. Please request a new one."
    );
  }

  // 401 — no/expired auth token (accessing protected resource)
  if (status === 401) {
    return t(
      "auth.sessionExpired",
      "Your session has expired. Please sign in again."
    );
  }

  // 403 — auth method disabled or collection rules not met
  if (status === 403) {
    if (/password authentication/i.test(message)) {
      return t(
        "auth.passwordAuthDisabled",
        "Password sign-in is not enabled for this account."
      );
    }
    if (/oauth2/i.test(message)) {
      return t(
        "auth.oauthDisabled",
        "Google sign-in is not enabled for this account."
      );
    }
    if (/otp/i.test(message)) {
      return t(
        "auth.otpDisabled",
        "One-time password sign-in is not available."
      );
    }
    return t(
      "auth.accessDenied",
      "Access denied. You are not allowed to perform this action."
    );
  }

  // 429 — rate limited
  if (status === 429) {
    return t(
      "auth.tooManyAttempts",
      "Too many attempts. Please try again later."
    );
  }

  // 500 — server error
  if (status && status >= 500) {
    return t(
      "errors.serverError",
      "A server error occurred. Please try again later."
    );
  }

  return null;
}
