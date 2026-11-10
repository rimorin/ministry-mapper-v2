import { ClientResponseError } from "pocketbase";
import { callFunction } from "./pocketbase";
import { safeStorage } from "./safeStorage";

// Ratings and card outcomes for /assistant/feedback, kept in the browser until
// the backend has them, so history still shows a link made offline, or just
// before the tab closed. Each report replaces an earlier one with the same key:
// only a card's last outcome, or an answer's last rating, counts.
const STORE = "assistant-feedback-outbox";

type Outbox = Record<string, Record<string, unknown>>;

const read = (): Outbox => {
  try {
    return JSON.parse(safeStorage.get(STORE) ?? "{}") as Outbox;
  } catch {
    return {};
  }
};

// Storage blocked or full: the report is tried this once.
const write = (outbox: Outbox) => {
  if (Object.keys(outbox).length) {
    safeStorage.set(STORE, JSON.stringify(outbox));
  } else safeStorage.remove(STORE);
};

// Removes a sent report, unless a newer one took its key meanwhile.
const settle = (key: string, sent: Record<string, unknown>) => {
  const outbox = read();
  if (JSON.stringify(outbox[key]) !== JSON.stringify(sent)) return;
  delete outbox[key];
  write(outbox);
};

// A refusal that sending again would not change, such as a question that is
// gone; signed out (401), timed out (408), too fast (429) or offline (0) are
// tried again later.
const refused = (error: unknown) =>
  error instanceof ClientResponseError &&
  error.status >= 400 &&
  error.status < 500 &&
  error.status !== 401 &&
  error.status !== 408 &&
  error.status !== 429;

let flushing = false;
let again = false;

// Sends what is waiting, oldest first; what fails for now stays for next time.
const flushFeedback = async () => {
  if (flushing) {
    again = true;
    return;
  }
  flushing = true;
  try {
    do {
      again = false;
      for (const [key, body] of Object.entries(read())) {
        try {
          await callFunction("/assistant/feedback", {
            method: "POST",
            body,
            requestKey: key
          });
          settle(key, body);
        } catch (error) {
          if (refused(error)) settle(key, body);
        }
      }
    } while (again);
  } finally {
    flushing = false;
  }
};

export const sendFeedback = (key: string, body: Record<string, unknown>) => {
  write({ ...read(), [key]: body });
  void flushFeedback();
};

// Reports left from before a reload go now, and those held offline once back.
void flushFeedback();
window.addEventListener("online", () => void flushFeedback());
