import { pb } from "../../pocketbase";
import { HHOptionProps } from "../interface";

const getOptions = async (code: string) => {
  const householdTypes = new Array<HHOptionProps>();

  const data = await pb.collection("options").getFullList({
    filter: `congregation="${code}"`,
    requestKey: `options-${code}`,
    sort: "sequence"
  });

  data.forEach((option) => {
    householdTypes.push({
      id: option.id,
      code: option.code,
      description: option.description,
      isCountable: option.is_countable,
      isDefault: option.is_default,
      sequence: option.sequence
    });
  });
  return householdTypes;
};

export { getOptions };
