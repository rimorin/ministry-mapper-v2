// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, browserLocalPersistence } from "firebase/auth";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider
} from "firebase/app-check";
import { getFunctions } from "firebase/functions";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";
import { getRemoteConfig } from "firebase/remote-config";
import {
  DEFAULT_FB_CLOUD_FUNCTIONS_REGION,
  REMOTE_CONFIG_FETCH_INTERVAL_MS_DEFAULT
} from "./utils/constants";

declare global {
  // eslint-disable-next-line no-var
  var FIREBASE_APPCHECK_DEBUG_TOKEN: boolean | string | undefined;
}
const {
  VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_DB_URL,
  VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_BUCKET,
  VITE_FIREBASE_SENDER_ID,
  VITE_FIREBASE_APP_ID,
  VITE_FIREBASE_APPCHECK_DEBUG_TOKEN,
  VITE_FIREBASE_RECAPTCHA_ENTERPRISE_SITE_KEY,
  VITE_FIREBASE_FUNCTIONS_REGION,
  VITE_FIREBASE_MAINTENANCE_MODE_KEY,
  VITE_FIREBASE_REMOTE_CONFIG_FETCH_INTERVAL,
  VITE_FIRESTORE_DATABASE_ID
} = import.meta.env;
global.FIREBASE_APPCHECK_DEBUG_TOKEN =
  VITE_FIREBASE_APPCHECK_DEBUG_TOKEN || false;

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: VITE_FIREBASE_API_KEY,
  authDomain: VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: VITE_FIREBASE_DB_URL,
  projectId: VITE_FIREBASE_PROJECT_ID,
  storageBucket: VITE_FIREBASE_BUCKET,
  messagingSenderId: VITE_FIREBASE_SENDER_ID,
  appId: VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: browserLocalPersistence
  // No popupRedirectResolver defined
});
const firestore = initializeFirestore(
  app,
  {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  },
  VITE_FIRESTORE_DATABASE_ID
);

const functions = getFunctions(
  app,
  VITE_FIREBASE_FUNCTIONS_REGION || DEFAULT_FB_CLOUD_FUNCTIONS_REGION
);

if (VITE_FIREBASE_RECAPTCHA_ENTERPRISE_SITE_KEY !== undefined) {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(
      VITE_FIREBASE_RECAPTCHA_ENTERPRISE_SITE_KEY
    ),
    isTokenAutoRefreshEnabled: true
  });
}

const config = getRemoteConfig(app);
config.settings.minimumFetchIntervalMillis =
  VITE_FIREBASE_REMOTE_CONFIG_FETCH_INTERVAL ||
  REMOTE_CONFIG_FETCH_INTERVAL_MS_DEFAULT;
config.defaultConfig = {
  [VITE_FIREBASE_MAINTENANCE_MODE_KEY]: false
};

export { auth, functions, firestore, config };
