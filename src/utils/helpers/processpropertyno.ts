import { TERRITORY_TYPES } from "../constants";

export const PROPERTY_CODE_PATTERN = /[^a-zA-Z0-9-]/g;

export const sanitizePropertyCode = (value: string): string =>
  value.replace(PROPERTY_CODE_PATTERN, "");

const processPropertyNumber = (unitNo: string, propertyType: string) => {
  if (!unitNo) return "";
  unitNo = unitNo.trim();
  if (propertyType === TERRITORY_TYPES.SINGLE_STORY) {
    return unitNo.toUpperCase();
  }
  return parseInt(unitNo).toString();
};

export default processPropertyNumber;
