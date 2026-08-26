interface UmamiPayload {
  url?: string;
  title?: string;
  [key: string]: unknown;
}

interface Umami {
  track: {
    (
      eventName: string,
      eventData?: Record<string, string | number | boolean>
    ): void;
    // Payload form: the tracker passes its own defaults in, so spreading
    // `props` keeps the website id, referrer, screen size and so on.
    (payload: (props: UmamiPayload) => UmamiPayload): void;
  };
  identify: (sessionData: Record<string, string | number | boolean>) => void;
}

declare global {
  interface Window {
    umami?: Umami;
  }
}

const ANALYTICS_EVENTS = {
  SIGNUP: "signup",
  LOGIN: "login",
  LOGIN_OAUTH: "login-oauth",
  OTP_VERIFIED: "otp-verified",
  REPORT_GENERATED: "report-generated",
  MESSAGES_OPENED: "messages-opened",
  MESSAGE_SENT: "message-sent",
  MESSAGE_DELETED: "message-deleted",
  MESSAGE_PINNED: "message-pinned",
  THEME_CHANGED: "theme-changed",
  LANGUAGE_CHANGED: "language-changed",
  QUICK_LINK_GENERATED: "quick-link-generated",
  QUICK_LINK_SHARED: "quick-link-shared",
  MAP_VIEW_TOGGLED: "map-view-toggled",
  ADDRESS_VIEW_TOGGLED: "address-view-toggled",
  TERRITORY_LIST_VIEW_TOGGLED: "territory-list-view-toggled",
  TERRITORY_BOUNDARY_DRAW_STARTED: "territory-boundary-draw-started",
  TERRITORY_BOUNDARY_DRAW_COMPLETED: "territory-boundary-draw-completed",
  TERRITORY_BOUNDARY_SAVED: "territory-boundary-saved",
  ADDRESS_GEOLOCATION_UPDATED: "address-geolocation-updated",
  TRAVEL_MODE_CHANGED: "travel-mode-changed",
  DIRECTIONS_OPENED: "directions-opened",
  ADDRESS_DIRECTIONS_OPENED: "address-directions-opened",
  // Core work loop. Fired from TRACKED_ROUTES below, not from call sites.
  ADDRESS_STATUS_UPDATED: "address-status-updated",
  ADDRESS_CREATED: "address-created",
  LINK_MAP_OPENED: "link-map-opened",
  MAP_CREATED: "map-created",
  MAP_RESET: "map-reset",
  MAP_FLOOR_ADDED: "map-floor-added",
  MAP_FLOOR_REMOVED: "map-floor-removed",
  MAP_SEQUENCE_UPDATED: "map-sequence-updated",
  MAP_TERRITORY_CHANGED: "map-territory-changed",
  UNIT_ADDED: "unit-added",
  UNIT_DELETED: "unit-deleted",
  UNIT_SEQUENCE_UPDATED: "unit-sequence-updated",
  TERRITORY_RESET: "territory-reset",
  TERRITORY_DELETED: "territory-deleted",
  CONGREGATION_OPTIONS_UPDATED: "congregation-options-updated",
  // Collection CRUD rather than a custom route: the collection name alone
  // would not identify the intent, so these are tracked at their call sites.
  TERRITORY_CREATED: "territory-created",
  MAP_DELETED: "map-deleted",
  USER_INVITED: "user-invited",
  ASSIGNMENT_DELETED: "assignment-deleted",
  // Only meaningful as a pair: the offer is the denominator for the use.
  NEXT_ADDRESS_OFFERED: "next-address-offered",
  NEXT_ADDRESS_USED: "next-address-used"
} as const;

type EventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
type EventData = Record<string, string | number | boolean>;

type PendingCall = (umami: Umami) => void;

// Holds calls made before the injected script finishes loading, which would
// otherwise be dropped — most visibly the OAuth callback, which tracks on
// mount. Non-null only while a script is in flight, so with analytics
// unconfigured (tests, missing env vars) calls are discarded rather than piling up.
let pending: PendingCall[] | null = null;
const MAX_PENDING_CALLS = 20;

// The tracker is third-party code called from inside callFunction and from
// click handlers, so a throw here would surface a committed mutation as a
// failure or leave a button dead. Analytics never propagates.
function invoke(call: PendingCall, umami: Umami): void {
  try {
    call(umami);
  } catch (error) {
    if (import.meta.env.MODE === "development") {
      console.error("Analytics call failed:", error);
    }
  }
}

function flushPending(): void {
  const queued = pending;
  pending = null;
  const umami = window.umami;
  if (!queued || !umami) return;
  for (const call of queued) invoke(call, umami);
}

function send(call: PendingCall): void {
  const umami = window.umami;
  if (!umami) {
    if (pending && pending.length < MAX_PENDING_CALLS) pending.push(call);
    return;
  }
  flushPending();
  invoke(call, umami);
}

function trackEvent(event: EventName, data?: EventData): void {
  send((umami) => umami.track(event, data));
}

// Segments events by congregation and role. Pass no name or email: unlike the
// LaunchDarkly context, Umami is meant to stay free of personal data.
function identify(sessionData: EventData): void {
  send((umami) => umami.identify(sessionData));
}

// Auto-pageview is off, so this is the only source of pageviews.
function trackPageview(url: string, title?: string): void {
  send((umami) =>
    umami.track((props) => ({ ...props, url, ...(title && { title }) }))
  );
}

interface TrackedRoute {
  event: EventName;
  data?: (body: Record<string, unknown>) => EventData | undefined;
}

const statusData = (body: Record<string, unknown>) =>
  typeof body.status === "string" ? { status: body.status } : undefined;

/**
 * Custom Go routes whose path is a 1:1 signature of a user action, so the
 * event can be derived at the data layer instead of at every call site.
 *
 * Absent on purpose: read-only routes (`/map/addresses`, `/map/codes`), and
 * routes already tracked at their call site (`/territory/link` fires
 * QUICK_LINK_GENERATED, `/report/generate` fires REPORT_GENERATED). Listing
 * either here would double-count.
 */
const TRACKED_ROUTES: Record<string, TrackedRoute> = {
  "/address/update": {
    event: ANALYTICS_EVENTS.ADDRESS_STATUS_UPDATED,
    data: statusData
  },
  "/address/add": {
    event: ANALYTICS_EVENTS.ADDRESS_CREATED,
    data: statusData
  },
  "/link/map": { event: ANALYTICS_EVENTS.LINK_MAP_OPENED },
  "/map/add": { event: ANALYTICS_EVENTS.MAP_CREATED },
  "/map/reset": { event: ANALYTICS_EVENTS.MAP_RESET },
  "/map/floor/add": { event: ANALYTICS_EVENTS.MAP_FLOOR_ADDED },
  "/map/floor/remove": { event: ANALYTICS_EVENTS.MAP_FLOOR_REMOVED },
  "/map/code/add": { event: ANALYTICS_EVENTS.UNIT_ADDED },
  "/map/code/delete": { event: ANALYTICS_EVENTS.UNIT_DELETED },
  "/map/codes/update": { event: ANALYTICS_EVENTS.UNIT_SEQUENCE_UPDATED },
  "/maps/sequence": { event: ANALYTICS_EVENTS.MAP_SEQUENCE_UPDATED },
  "/map/territory/update": { event: ANALYTICS_EVENTS.MAP_TERRITORY_CHANGED },
  "/territory/reset": { event: ANALYTICS_EVENTS.TERRITORY_RESET },
  "/territory/delete": { event: ANALYTICS_EVENTS.TERRITORY_DELETED },
  // No leading slash: this is how congoptions.tsx calls it. Paths are matched
  // exactly, so it has to be written the way the call site writes it.
  "options/update": { event: ANALYTICS_EVENTS.CONGREGATION_OPTIONS_UPDATED }
};

// Called by callFunction once a mutation has committed. Unknown paths are
// ignored, so adding a route above is the only step needed to track it.
function trackRoute(path: string, body: unknown): void {
  const route = TRACKED_ROUTES[path];
  if (!route) return;
  const data =
    route.data && body !== null && typeof body === "object"
      ? route.data(body as Record<string, unknown>)
      : undefined;
  trackEvent(route.event, data);
}

function initAnalytics(): void {
  const siteId = import.meta.env.VITE_UMAMI_WEBSITE_ID;
  const srcUrl = import.meta.env.VITE_UMAMI_SRC_URL;

  if (!siteId || !srcUrl) return;
  if (document.querySelector(`script[data-website-id="${siteId}"]`)) return;

  const script = document.createElement("script");
  script.defer = true;
  script.src = srcUrl;
  script.dataset.websiteId = siteId;
  script.dataset.performance = "true";
  // The OAuth callback and the password-reset screen both carry single-use
  // codes in the query string. Those must not be recorded as pageview URLs.
  script.dataset.excludeSearch = "true";
  // Several screens share the "/" URL, so pageviews are reported by the app
  // instead — see trackPageview callers in router.tsx and frontpage.tsx.
  script.dataset.autoPageview = "false";

  const domains = import.meta.env.VITE_UMAMI_DOMAINS;
  if (domains) script.dataset.domains = domains;

  // Stamps every event and pageview with the release that produced it, so a
  // behaviour change can be compared across deploys rather than guessed at.
  const version = import.meta.env.VITE_APP_VERSION;
  if (version) script.dataset.tag = version;

  pending = [];
  script.addEventListener("load", flushPending);
  // Blocked or failed script: drop the queue rather than hold it forever.
  script.addEventListener("error", () => {
    pending = null;
  });

  document.head.appendChild(script);
}

export {
  ANALYTICS_EVENTS,
  identify,
  initAnalytics,
  trackEvent,
  trackPageview,
  trackRoute
};
