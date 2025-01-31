const processSequence = (value: string, isMulti = false): string => {
  let SPECIAL_CHARACTERS = /[^a-zA-Z0-9-]/g;
  if (isMulti) {
    SPECIAL_CHARACTERS = /[^0-9-]/g;
  }
  return value
    .split(",")
    .map((item) => item.trim().replace(SPECIAL_CHARACTERS, ""))
    .join(",");
};
export default processSequence;
