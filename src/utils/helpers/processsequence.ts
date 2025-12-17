const processSequence = (value: string, isMulti = false): string => {
  const pattern = isMulti ? /[^0-9-]/g : /[^a-zA-Z0-9-]/g;
  return value
    .split(",")
    .map((item) => item.trim().replace(pattern, ""))
    .join(",");
};
export default processSequence;
