import PocketBase, {
  AuthRecord,
  RecordListOptions,
  RecordModel,
  RecordOptions,
  RecordSubscribeOptions,
  RecordSubscription,
  SendOptions
} from "pocketbase";
import { PB_SECURITY_HEADER_KEY } from "./constants";

const { VITE_POCKETBASE_URL } = import.meta.env;

/**
 * PocketBase client instance configured with the application's PocketBase URL
 */
const pb = new PocketBase(VITE_POCKETBASE_URL);

// Statuses that indicate a transient failure safe to retry.
// Defined at module level to avoid re-allocating the Set on every withRetry call.
const RETRYABLE_STATUSES = new Set([0, 408, 429]);

/**
 * Retries an async operation with exponential backoff + full jitter on transient errors.
 *
 * Retryable:  network failures (status 0, !isAbort), timeouts (408),
 *             rate limits (429), and server errors (5xx).
 * Not retried: client errors (400/401/403/404/422…), intentional aborts (isAbort).
 *
 * Full jitter (Math.random() * backoff) is used to decorrelate concurrent retries
 * and avoid thundering-herd spikes — see AWS "Exponential Backoff and Jitter" guidance.
 *
 * @param fn        - The async operation to retry
 * @param retries   - Maximum number of attempts; must be >= 1 (default: 3)
 * @param baseDelay - Base delay in ms; doubles each attempt before jitter (default: 300)
 * @param maxDelay  - Upper bound on delay in ms to prevent unbounded waits (default: 10000)
 * @returns The result of the successful operation
 * @throws The last error once retries are exhausted, or any non-retryable error immediately
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      lastError = error;
      const isTransient =
        (RETRYABLE_STATUSES.has(error?.status) && !error?.isAbort) ||
        (error?.status >= 500 && error?.status < 600);
      if (!isTransient) throw error;
      if (import.meta.env.DEV) {
        console.warn(
          `[withRetry] transient error (status ${error?.status}), attempt ${attempt + 1}/${maxAttempts}`
        );
      }
      // Skip the delay after the last attempt — there is nothing left to wait for.
      if (attempt < maxAttempts - 1) {
        const backoff = Math.min(baseDelay * 2 ** attempt, maxDelay);
        await new Promise((res) => setTimeout(res, Math.random() * backoff));
      }
    }
  }
  throw lastError;
};

/**
 * Returns true when a caught error is a PocketBase auto-cancellation abort.
 * Use this in catch blocks to silently ignore intentionally cancelled requests.
 */
const isAbortError = (error: unknown): boolean =>
  (error as { isAbort?: boolean })?.isAbort === true;

/**
 * Wraps an async function so that PocketBase auto-cancellation AbortErrors are
 * silently ignored. All other errors are re-thrown normally.
 *
 * Use this for fire-and-forget fetch functions called from useEffect, where
 * PocketBase may auto-cancel duplicate requests sharing the same requestKey.
 *
 * @example
 * const fetchData = ignoreAbort(async () => {
 *   const result = await getList("maps", { requestKey: "setup-maps" });
 *   setMaps(result);
 * });
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

/**
 * Authenticates a user with email and password
 * @param email User's email address
 * @param password User's password
 * @throws Will throw an error if authentication fails
 */
const authenticateEmailAndPassword = async (
  email: string,
  password: string
) => {
  return pb.collection("users").authWithPassword(email, password, {
    requestKey: `login-${email}`
  });
};

/**
 * Get current authenticated user information
 * @param field Optional specific field to retrieve (id, name, email)
 * @returns User data based on requested field, or complete AuthRecord if no field specified
 */
const getUser = (
  field?: "id" | "name" | "email"
): AuthRecord | string | null => {
  const user = pb.authStore?.record || null;

  if (!user) return null;

  if (!pb.authStore.isValid) return null;

  if (field === "id") return user.id || "";
  if (field === "name") return user.name || "";
  if (field === "email") return user.email || "";

  return user;
};

/**
 * Request a password reset for a user
 * @param email Optional email address to reset password for. If not provided,
 * uses the currently authenticated user's email
 * @throws Will throw an error if the request fails
 */
const requestPasswordReset = async (email?: string) => {
  const requestEmail = email || (getUser("email") as string);
  return pb.collection("users").requestPasswordReset(requestEmail, {
    requestKey: `reset-password-${requestEmail}`
  });
};

/**
 * Clears the authentication session and logs the user out
 */
const cleanupSession = () => {
  pb.authStore.clear();
};

/**
 * Sends an email verification request to the specified email address
 * @param email The email address to verify
 * @throws Will throw an error if the verification request fails
 */
const verifyEmail = async (email: string) => {
  return pb.collection("users").requestVerification(email, {
    requestKey: `verify-email-${email}`
  });
};

/**
 * Requests a one-time password (OTP) for authentication
 * @param email The email address to send the OTP to
 * @returns The OTP session ID for use in authenticateOTP
 * @throws Will throw an error if the OTP request fails
 */
const requestOTP = async (email: string) => {
  const result = await pb.collection("users").requestOTP(email, {
    requestKey: `otp-${email}`
  });
  return result.otpId;
};

/**
 * Confirms a password reset operation using the provided action code and new password.
 *
 * @param actionCode - The action code received from the password reset email
 * @param newPassword - The new password to set for the user
 * @param confirmPassword - Confirmation of the new password (must match newPassword)
 * @throws Will throw an error if the password reset confirmation fails
 * @returns A Promise that resolves when the password reset is successful
 */
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

/**
 * Confirms email verification using an action code
 * @param actionCode The verification code received via email
 * @throws Will throw an error if the confirmation fails
 */
const confirmVerification = async (actionCode: string) => {
  return pb.collection("users").confirmVerification(actionCode, {
    requestKey: `verify-email-${actionCode}`
  });
};

/**
 * Authenticates a user with a one-time password
 * @param otpSessionId The OTP session ID returned from requestOTP
 * @param otpCode The one-time password code received by the user
 * @param mfaId The multi-factor authentication ID
 * @throws Will throw an error if authentication fails
 */
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

/**
 * Authenticates a user with OAuth2 provider
 * This method opens a popup window with the OAuth2 vendor page
 * @param provider The OAuth2 provider name (e.g., "google")
 * @throws Will throw an error if authentication fails
 * @returns The authentication data including user record
 */
const authenticateOAuth2 = async (provider: string) => {
  return pb.collection("users").authWithOAuth2({ provider });
};

/**
 * Sets up a listener for authentication state changes
 * @param callback Function to call when auth state changes
 * @returns Cleanup function to remove the listener
 */
const authListener = (callback: (model: AuthRecord) => void) => {
  const unsub = pb.authStore.onChange((_: string, model: AuthRecord) => {
    callback(model);
  });
  return () => {
    unsub();
  };
};

/**
 * Configures the Pocketbase instance to include a security token in the headers of all requests.
 *
 * This function sets up a beforeSend hook on the Pocketbase client that adds
 * a custom security header to each outgoing request.
 *
 * Note: The beforeSend function does not apply to realtime subscriptions, only to REST API requests.
 * Therefore, headers must be set manually for realtime subscriptions.
 *
 * @param token - The security token to be included in the request headers
 * @returns void
 *
 * @example
 * ```
 * const authToken = "your-security-token";
 * configureHeader(authToken);
 * ```
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

/**
 * Calls a PocketBase backend function (hook)
 *
 * @param functionName - The name of the function to call
 * @param options - Send options for the request
 * @returns The response from the function call
 * @throws Will throw any errors that occur
 */
const callFunction = async (functionName: string, options: SendOptions) => {
  return pb.send(functionName, options);
};

/**
 * Creates a new record in the specified collection
 *
 * @param collectionName - The name of the collection to create a record in
 * @param body - The data to create the record with
 * @param options - Optional record options for the request
 * @returns The created record
 * @throws Will throw any errors that occur
 */
const createData = async (
  collectionName: string,
  body:
    | {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
      }
    | FormData,
  options?: RecordOptions
) => {
  return pb.collection(collectionName).create(body, options);
};

/**
 * Deletes a record by ID from the specified collection
 *
 * @param collectionName - The name of the collection to delete from
 * @param id - The ID of the record to delete
 * @param options - Optional record options for the request
 * @returns True if deletion was successful
 * @throws Will throw errors except for abort or 404 errors which return false
 */
const deleteDataById = async (
  collectionName: string,
  id: string,
  options?: RecordOptions
) => {
  try {
    return await pb.collection(collectionName).delete(id, options);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.isAbort || error.status === 404) {
      return false;
    }
    throw error;
  }
};

/**
 * Retrieves a single record by ID from the specified collection
 *
 * @param collectionName - The name of the collection to retrieve from
 * @param id - The ID of the record to retrieve
 * @param options - Optional record options for the request
 * @returns The retrieved record or null if not found
 * @throws Will throw errors except for 404 errors which return null
 */
const getDataById = async (
  collectionName: string,
  id: string,
  options?: RecordOptions
) => {
  try {
    return await withRetry(() =>
      pb.collection(collectionName).getOne(id, options)
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
};

/**
 * Fetches the first item in a collection that matches a query.
 *
 * @param collectionName - The name of the collection to query
 * @param query - The filter query to apply
 * @param options - Optional parameters for the list operation
 * @returns The first item that matches the query
 * @throws Will throw any errors that occur
 */
/**
 * Retrieves the first item from a collection that matches the specified query.
 *
 * @param collectionName - The name of the collection to query
 * @param query - The query string to filter records
 * @param options - Optional RecordListOptions for the query
 * @returns A Promise that resolves to the first matching record, or null if no records match
 * @throws Will rethrow any error except 404 (Not Found) errors
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
};

/**
 * Retrieves all records from the specified collection
 *
 * @param collectionName - The name of the collection to retrieve from
 * @param options - Optional record options for the request including filters
 * @returns An array of all matching records
 * @throws Will throw any errors that occur
 */
const getList = async (collectionName: string, options?: RecordOptions) => {
  return withRetry(() => pb.collection(collectionName).getFullList(options));
};

/**
 * Retrieves a paginated list of records from the specified collection
 *
 * @param collectionName - The name of the collection to retrieve from
 * @param page - The page number to retrieve
 * @param perPage - The number of records per page
 * @param options - Optional record options for the request including filters
 * @returns A paginated list response with items and pagination info
 * @throws Will throw any errors that occur
 */
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
 * Sets up a realtime subscription for a collection
 *
 * Note: When using this function with configureHeader, you need to manually
 * set headers for realtime subscriptions as the beforeSend hook doesn't apply.
 *
 * @param collectionName - The name of the collection to subscribe to
 * @param callback - Function to call when subscription data is received
 * @param options - Subscription options
 * @param topic - The subscription topic (default "*" for all changes)
 * @throws Will throw errors except for aborted subscriptions
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
 * Creates a new PocketBase batch instance for atomic multi-record operations.
 * All queued operations are sent in a single transactional HTTP request via batch.send().
 * @returns A BatchService instance for queuing create/update/upsert/delete operations
 */
const createBatch = () => pb.createBatch();

/**
 * Updates a record by ID in the specified collection
 *
 * @param collectionName - The name of the collection to update
 * @param id - The ID of the record to update
 * @param body - The data to update the record with
 * @param options - Optional record options for the request
 * @returns The updated record or undefined if record not found
 * @throws Will throw errors except for abort or 404 errors
 */
const updateDataById = async (
  collectionName: string,
  id: string,
  body:
    | {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
      }
    | FormData,
  options?: RecordOptions
) => {
  try {
    return await withRetry(() =>
      pb.collection(collectionName).update(id, body, options)
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.isAbort) {
      return;
    }
    throw error;
  }
};

export {
  pb,
  createBatch,
  withRetry,
  getUser,
  requestPasswordReset,
  cleanupSession,
  verifyEmail,
  requestOTP,
  confirmVerification,
  authenticateOTP,
  authenticateOAuth2,
  authListener,
  configureHeader,
  callFunction,
  createData,
  deleteDataById,
  getDataById,
  getList,
  getPaginatedList,
  setupRealtimeListener,
  updateDataById,
  getFirstItemOfList,
  authenticateEmailAndPassword,
  confirmPasswordReset,
  isAbortError,
  ignoreAbort
};
