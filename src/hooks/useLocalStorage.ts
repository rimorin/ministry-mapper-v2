import { useState, useEffect, useCallback } from "react";

export function useLocalStorage<T = string | boolean>(
  key: string,
  initialValue: T
) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      setStoredValue((prev) => {
        try {
          const valueToStore = value instanceof Function ? value(prev) : value;
          if (valueToStore === null || valueToStore === "") {
            window.localStorage.removeItem(key);
            return initialValue;
          }
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          return valueToStore;
        } catch (error) {
          console.error(`Error setting localStorage key "${key}":`, error);
          return prev;
        }
      });
    },
    [key, initialValue]
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Sync state across browser tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch {
          setStoredValue(initialValue);
        }
      } else if (e.key === key && e.newValue === null) {
        setStoredValue(initialValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
}

export default useLocalStorage;
