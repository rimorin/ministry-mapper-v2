import { SPECIAL_CHARACTERS, ALPHANUMERIC_HYPHEN } from "../constants";

const isValidMapSequence = (sequence: string) => {
  if (!sequence) return false;
  const units = sequence.split(",").map((unit) => unit.trim());
  if (units.length === 0) return false;

  return units.every((unit) => {
    if (!unit) return false;
    if (SPECIAL_CHARACTERS.test(unit)) return false;
    return ALPHANUMERIC_HYPHEN.test(unit);
  });
};

export default isValidMapSequence;
