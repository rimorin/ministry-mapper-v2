import React, { useEffect, useRef } from "react";
import { useListRef } from "react-window";

const STORAGE_KEY = "mapListScroll";
const DEBOUNCE_MS = 150;

type ScrollRecord = { id: string; offset: number };

function readScrollRecord(): ScrollRecord | null {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
  } catch {
    return null;
  }
}

function writeScrollRecord(record: ScrollRecord) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(record satisfies ScrollRecord)
    );
  } catch {
    // Silently ignore storage errors (private browsing, quota exceeded)
  }
}

export function useScrollPersistence(id: string) {
  const listRef = useListRef(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stored = readScrollRecord();
    const offset = stored?.id === id ? (stored.offset ?? 0) : 0;
    // RAF needed: react-window's DOM element resolves in a second render cycle
    const rafId =
      offset > 0
        ? requestAnimationFrame(() => {
            if (listRef.current?.element)
              listRef.current.element.scrollTop = offset;
          })
        : 0;
    return () => {
      cancelAnimationFrame(rafId);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = (event.target as HTMLDivElement).scrollTop;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      writeScrollRecord({ id, offset: scrollTop });
    }, DEBOUNCE_MS);
  };

  return { listRef, onScroll };
}

export default useScrollPersistence;
