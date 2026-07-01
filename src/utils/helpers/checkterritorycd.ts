const isValidTerritoryCode = (territoryCd: string) =>
  /^[a-zA-Z0-9- ()]*$/.test(territoryCd);

export default isValidTerritoryCode;
