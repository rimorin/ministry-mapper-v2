import { TERRITORY_TYPES } from "../constants";

const processPropertyNumber = (unitNo: string, propertyType: string) => {
  if (!unitNo) return "";
  unitNo = unitNo.trim();
  if (propertyType === TERRITORY_TYPES.SINGLE_STORY) {
    return unitNo.toUpperCase();
  }
  return parseInt(unitNo).toString();
};

export default processPropertyNumber;
