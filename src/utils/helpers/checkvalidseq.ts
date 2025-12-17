import {
  TERRITORY_TYPES,
  SPECIAL_CHARACTERS,
  NUMERIC_CHARACTERS
} from "../constants";

const isValidMapSequence = (
  sequence: string,
  postalType = TERRITORY_TYPES.SINGLE_STORY
) => {
  if (!sequence) return false;
  const units = sequence.split(",").map((unit) => unit.trim());
  if (units.length === 0) return false;

  const isMultiStory = postalType === TERRITORY_TYPES.MULTIPLE_STORIES;

  return units.every((unit) => {
    if (!unit) return false;
    if (SPECIAL_CHARACTERS.test(unit)) return false;
    return !isMultiStory || NUMERIC_CHARACTERS.test(unit);
  });
};

export default isValidMapSequence;
