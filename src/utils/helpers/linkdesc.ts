import { LINK_TYPES } from "../constants";
import i18n from "../../i18n";

const LinkTypeDescription = (linkType: string) => {
  let linkTranslationKey = "";

  switch (linkType) {
    case LINK_TYPES.PERSONAL:
      linkTranslationKey = "links.personal";
      break;
    case LINK_TYPES.ASSIGNMENT:
      linkTranslationKey = "links.assignment";
      break;
    default:
      linkTranslationKey = "links.view";
  }

  // Use i18n.t directly since this is not a React component
  return i18n.t(linkTranslationKey, {
    defaultValue:
      linkType === LINK_TYPES.PERSONAL
        ? "Personal"
        : linkType === LINK_TYPES.ASSIGNMENT
          ? "Assign"
          : "View"
  });
};

export default LinkTypeDescription;
