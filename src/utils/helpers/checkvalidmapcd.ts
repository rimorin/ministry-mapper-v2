import { MINIMUM_POSTAL_LENGTH, SPECIAL_CHARACTERS } from "../constants";

const isValidMapCode = (mapCode: string) => {
  if (!mapCode) return false;

  if (isNaN(Number(mapCode))) return false;

  if (mapCode.length < MINIMUM_POSTAL_LENGTH) return false;

  if (SPECIAL_CHARACTERS.test(mapCode)) return false;

  return true;
};

export default isValidMapCode;
