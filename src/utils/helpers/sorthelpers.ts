const sortByCode = <T>(items: T[]): T[] =>
  [...items].sort((a, b) =>
    ((a as { code?: string }).code ?? "").localeCompare(
      (b as { code?: string }).code ?? ""
    )
  );

const sortBySequence = <T>(items: T[]): T[] =>
  [...items].sort(
    (a, b) =>
      ((a as { sequence?: number }).sequence ?? 0) -
      ((b as { sequence?: number }).sequence ?? 0)
  );

export { sortByCode, sortBySequence };
