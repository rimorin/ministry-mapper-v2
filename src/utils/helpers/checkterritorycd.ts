const isValidTerritoryCode = (territoryCd: string) => {
  // check if code is not alphanumeric, space, dash, or parentheses
  if (!/^[a-zA-Z0-9- ()]*$/.test(territoryCd)) {
    return false;
  }
  return true;
};

export default isValidTerritoryCode;
