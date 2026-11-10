// localStorage that private windows, blocked or full storage cannot break:
// a read comes back null and a write is skipped.
export const safeStorage = {
  get: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Not kept; it lasts until the page reloads.
    }
  },
  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // As above.
    }
  }
};
