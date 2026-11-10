import {
  ACCESS_LEVEL_MAPPING,
  USER_ACCESS_LEVELS
} from "../../utils/constants";

const READ_ONLY = USER_ACCESS_LEVELS.READ_ONLY.CODE;
const CONDUCTOR = USER_ACCESS_LEVELS.CONDUCTOR.CODE;
const ADMIN = USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE;

interface StarterQuestion {
  key: string;
  fallback: string;
  // The lowest role the assistant answers this for (see policy.go in the
  // backend), so nobody is offered a question it would refuse.
  role: string;
}

// Questions an admin, conductor or read-only helper might really ask, across
// what the assistant can look up and change. The panel shows a few at random.
export const STARTER_QUESTIONS: StarterQuestion[] = [
  // Territories and maps
  {
    key: "notCompleted",
    fallback: "Which territories have not been completed in 6 months?",
    role: READ_ONLY
  },
  {
    key: "closestToDone",
    fallback: "Which territory is closest to being completed?",
    role: READ_ONLY
  },
  {
    key: "completedThisYear",
    fallback: "Which territories were completed this year?",
    role: READ_ONLY
  },
  {
    key: "noVisits",
    fallback: "Which territories had no visits in the last 3 months?",
    role: READ_ONLY
  },
  {
    key: "freeMaps",
    fallback: "Which maps are free to assign?",
    role: READ_ONLY
  },
  {
    key: "mostNotDone",
    fallback: "Which maps have the most homes not done?",
    role: READ_ONLY
  },
  { key: "nearMe", fallback: "What is free to work near me?", role: READ_ONLY },
  // Visits
  {
    key: "reachedThisMonth",
    fallback: "How many homes did we reach this month?",
    role: READ_ONLY
  },
  {
    key: "bestDay",
    fallback: "Which day of the week do we reach the most people?",
    role: READ_ONLY
  },
  {
    key: "bestHour",
    fallback: "What time of day are people most often home?",
    role: READ_ONLY
  },
  // Homes
  {
    key: "atLimit",
    fallback: "Which homes have reached the try limit?",
    role: READ_ONLY
  },
  {
    key: "oldDnc",
    fallback: "Which do-not-call homes are over a year old?",
    role: READ_ONLY
  },
  {
    key: "householdTypes",
    fallback: "Which map has the most homes of each household type?",
    role: READ_ONLY
  },
  // Messages and notes
  {
    key: "reportsThisWeek",
    fallback: "What did publishers report this week?",
    role: READ_ONLY
  },
  {
    key: "dogNotes",
    fallback: "Are there any notes about dogs?",
    role: READ_ONLY
  },
  // Setup
  {
    key: "noLocation",
    fallback: "Which maps do not have a location yet?",
    role: READ_ONLY
  },
  {
    key: "noBoundary",
    fallback: "Which territories do not have a boundary?",
    role: READ_ONLY
  },
  {
    key: "manyInvalid",
    fallback: "Which maps have many invalid homes?",
    role: READ_ONLY
  },

  // Field service
  { key: "whoCameOut", fallback: "Who came out today?", role: CONDUCTOR },
  {
    key: "mostOften",
    fallback: "Who came out most often this month?",
    role: CONDUCTOR
  },
  { key: "mapsOut", fallback: "Who has a map out right now?", role: CONDUCTOR },
  {
    key: "linksThisWeek",
    fallback: "Which links were given out this week?",
    role: CONDUCTOR
  },
  {
    key: "changesThisWeek",
    fallback: "What changed on the maps this week?",
    role: CONDUCTOR
  },
  {
    key: "tryLimit",
    fallback: "What is our nobody-home try limit?",
    role: CONDUCTOR
  },
  {
    key: "resetAtLimit",
    fallback: "Reset the homes that reached the nobody-home limit",
    role: CONDUCTOR
  },

  // The congregation
  { key: "admins", fallback: "Who are our administrators?", role: ADMIN },
  {
    key: "notSignedIn",
    fallback: "Who has not signed in for 3 months?",
    role: ADMIN
  },
  { key: "roleChanges", fallback: "Who changed roles recently?", role: ADMIN },
  {
    key: "markRead",
    fallback: "Mark all unread messages as read",
    role: ADMIN
  },
  { key: "emailReport", fallback: "Email me the report", role: ADMIN }
];

// How many starter questions the panel shows at a time.
export const STARTER_COUNT = 4;

// Picks a few questions the role may ask, in random order (Fisher-Yates).
export function pickStarters(role: string | undefined): StarterQuestion[] {
  const level = ACCESS_LEVEL_MAPPING[role ?? ""] ?? 0;
  const eligible = STARTER_QUESTIONS.filter(
    (question) => level >= ACCESS_LEVEL_MAPPING[question.role]
  );
  for (let i = eligible.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
  }
  return eligible.slice(0, STARTER_COUNT);
}
