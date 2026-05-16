const isValidTerritoryCode = (territoryCd: string) => {
  if (!/^[a-zA-Z0-9- ()]*$/.test(territoryCd)) {
    return false;
  }
  return true;
};

export default isValidTerritoryCode;
