import PocketBase, {
  AuthRecord,
  ClientResponseError,
  RecordListOptions,
  RecordModel,
  RecordOptions,
  RecordSubscribeOptions,
  RecordSubscription,
  SendOptions
} from "pocketbase";
import { PB_SECURITY_HEADER_KEY } from "./constants";

const { VITE_POCKETBASE_URL } = import.meta.env;

const pb = new PocketBase(VITE_POCKETBASE_URL);

// Auto-logout when the admin JWT expires mid-session.
// Checks the outgoing request headers directly: if PB_SECURITY_HEADER_KEY is present,
// this is a publisher map request — a 401 there means the link expired, not the admin
// session, so we leave the admin auth store untouched.
pb.afterSend = (response, data, options?: SendOptions) => {
  const isPublisherRequest = !!(options?.headers as Record<string, string>)?.[
    PB_SECURITY_HEADER_KEY
  ];
  if (response.status === 401 && pb.authStore.record && !isPublisherRequest) {
    pb.authStore.clear();
  }
  return data;
};

// Statuses that indicate a transient failure safe to retry.
// Defined at module level to avoid re-allocating the Set on every withRetry call.
const RETRYABLE_STATUSES = new Set([0, 408, 429]);

/**
 * Returns true for any abort — both PocketBase SDK auto-cancellations
 * (ClientResponseError.isAbort) and native browser AbortController aborts
 * (DOMException with name "AbortError").
 */
const isAbortError = (error: unknown): boolean =>
  !!(error as { isAbort?: boolean })?.isAbort ||
  (error as { name?: string })?.name === "AbortError";

/**
 * Retries transient PocketBase failures with exponential backoff + full jitter.
 * Retries status 0/408/429 and 5xx responses, but never client errors or aborts.
 */
const withRetry = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  baseDelay = 300,
  maxDelay = 10_000
): Promise<T> => {
  const maxAttempts = Math.max(1, retries);
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;
      const status = (error as { status?: number })?.status;
      const isTransient =
        (status !== undefined &&
          RETRYABLE_STATUSES.has(status) &&
          !isAbortError(error)) ||
        (status !== undefined && status >= 500 && status < 600);
      if (!isTransient) throw error;
      if (import.meta.env.DEV) {
        console.warn(
          `[withRetry] transient error (status ${status}), attempt ${attempt + 1}/${maxAttempts}`
        );
      }
      if (attempt < maxAttempts - 1) {
        const backoff = Math.min(baseDelay * 2 ** attempt, maxDelay);
        await new Promise((res) => setTimeout(res, Math.random() * backoff));
      }
    }
  }
  throw lastError;
};

const isUnauthorizedError = (error: unknown): boolean =>
  error instanceof ClientResponseError && error.status === 401;

/**
 * Wraps an async function so that any abort — PocketBase auto-cancellation or
 * native AbortController — is silently swallowed. All other errors are re-thrown.
 *
 * Use this for fire-and-forget fetch functions called from useEffect, where
 * PocketBase may auto-cancel duplicate requests sharing the same requestKey.
 */
const ignoreAbort =
  <TArgs extends unknown[]>(fn: (...args: TArgs) => Promise<unknown>) =>
  async (...args: TArgs): Promise<void> => {
    try {
      await fn(...args);
    } catch (err) {
      if (!isAbortError(err)) throw err;
    }
  };

const authenticateEmailAndPassword = async (
  email: string,
  password: string
) => {
  return pb.collection("users").authWithPassword(email, password, {
    requestKey: `login-${email}`
  });
};

/**
 * Returns null when there is no valid auth session; otherwise returns either the
 * full auth record or the requested string field.
 */
const getUser = (
  field?: "id" | "name" | "email"
): AuthRecord | string | null => {
  const user = pb.authStore?.record;
  if (!user || !pb.authStore.isValid) return null;

  if (field === "id") return user.id || "";
  if (field === "name") return user.name || "";
  if (field === "email") return user.email || "";

  return user;
};

/**
 * Uses the provided email, or falls back to the current user's email.
 */
const requestPasswordReset = async (email?: string) => {
  const requestEmail = email || (getUser("email") as string);
  return pb.collection("users").requestPasswordReset(requestEmail, {
    requestKey: `reset-password-${requestEmail}`
  });
};

const cleanupSession = () => {
  pb.authStore.clear();
};

/**
 * Refreshes auth so returning admins get a rolling session window instead of a
 * fixed expiry counted from their last login.
 */
const refreshAuth = () => {
  return pb.collection("users").authRefresh();
};

const verifyEmail = async (email: string) => {
  return pb.collection("users").requestVerification(email, {
    requestKey: `verify-email-${email}`
  });
};

/**
 * Returns the PocketBase OTP session id needed by authenticateOTP.
 */
const requestOTP = async (email: string) => {
  const result = await pb.collection("users").requestOTP(email, {
    requestKey: `otp-${email}`
  });
  return result.otpId;
};

const confirmPasswordReset = async (
  actionCode: string,
  newPassword: string,
  confirmPassword: string
) => {
  return pb
    .collection("users")
    .confirmPasswordReset(actionCode, newPassword, confirmPassword, {
      requestKey: `reset-password-${actionCode}`
    });
};

const confirmVerification = async (actionCode: string) => {
  return pb.collection("users").confirmVerification(actionCode, {
    requestKey: `verify-email-${actionCode}`
  });
};

const authenticateOTP = async (
  otpSessionId: string,
  otpCode: string,
  mfaId: string
) => {
  return pb.collection("users").authWithOTP(otpSessionId, otpCode, {
    mfaId: mfaId,
    requestKey: `otp-auth-${otpSessionId}`
  });
};

const authenticateOAuth2 = async (provider: string) => {
  return pb.collection("users").authWithOAuth2({ provider });
};

const authListener = (callback: (model: AuthRecord) => void) => {
  const unsub = pb.authStore.onChange((_: string, model: AuthRecord) => {
    callback(model);
  });
  return () => {
    unsub();
  };
};

/**
 * Applies the security header to REST requests only; realtime subscriptions
 * still need headers set manually.
 */
const configureHeader = (token: string) => {
  pb.beforeSend = (url, options) => {
    options.headers = {
      ...options.headers,
      [PB_SECURITY_HEADER_KEY]: token
    };
    return { url, options };
  };
};

const clearHeader = () => {
  pb.beforeSend = undefined;
};

const callFunction = async (functionName: string, options: SendOptions) => {
  return pb.send(functionName, options);
};

const createData = async (
  collectionName: string,
  body: Record<string, unknown> | FormData,
  options?: RecordOptions
) => {
  return pb.collection(collectionName).create(body, options);
};

const swallowNotFound = (error: unknown): null => {
  if (error instanceof ClientResponseError && error.status === 404) return null;
  throw error;
};

/**
 * Returns false for aborts and missing records; otherwise re-throws PocketBase errors.
 */
const deleteDataById = async (
  collectionName: string,
  id: string,
  options?: RecordOptions
) => {
  try {
    return await pb.collection(collectionName).delete(id, options);
  } catch (error: unknown) {
    if (
      error instanceof ClientResponseError &&
      (error.isAbort || error.status === 404)
    ) {
      return false;
    }
    throw error;
  }
};

/**
 * Returns null when no record matches; re-throws any other PocketBase error.
 */
const getFirstItemOfList = async (
  collectionName: string,
  query: string,
  options?: RecordListOptions
) => {
  try {
    return await withRetry(() =>
      pb.collection(collectionName).getFirstListItem(query, options)
    );
  } catch (error: unknown) {
    return swallowNotFound(error);
  }
};

const getList = async (collectionName: string, options?: RecordOptions) => {
  return withRetry(() => pb.collection(collectionName).getFullList(options));
};

const getPaginatedList = async (
  collectionName: string,
  page: number,
  perPage: number,
  options?: RecordOptions
) => {
  return withRetry(() =>
    pb.collection(collectionName).getList(page, perPage, {
      skipTotal: true,
      ...options
    })
  );
};

/**
 * Realtime subscriptions do not inherit headers from configureHeader.
 */
const setupRealtimeListener = (
  collectionName: string,
  callback: (data: RecordSubscription<RecordModel>) => void,
  options?: RecordSubscribeOptions,
  topic = "*"
) => {
  return pb.collection(collectionName).subscribe(topic, callback, options);
};

/**
 * Returns undefined for aborts; otherwise re-throws PocketBase update errors.
 */
const updateDataById = async (
  collectionName: string,
  id: string,
  body: Record<string, unknown> | FormData,
  options?: RecordOptions
) => {
  try {
    return await withRetry(() =>
      pb.collection(collectionName).update(id, body, options)
    );
  } catch (error: unknown) {
    if (error instanceof ClientResponseError && error.isAbort) {
      return;
    }
    throw error;
  }
};

export {
  pb,
  withRetry,
  getUser,
  requestPasswordReset,
  cleanupSession,
  refreshAuth,
  verifyEmail,
  requestOTP,
  confirmVerification,
  authenticateOTP,
  authenticateOAuth2,
  authListener,
  configureHeader,
  clearHeader,
  callFunction,
  createData,
  deleteDataById,
  getList,
  getPaginatedList,
  setupRealtimeListener,
  updateDataById,
  getFirstItemOfList,
  authenticateEmailAndPassword,
  confirmPasswordReset,
  isAbortError,
  isUnauthorizedError,
  ignoreAbort
};
