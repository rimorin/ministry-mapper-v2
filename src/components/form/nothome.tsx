import { InputGroup, ToggleButtonGroup, ToggleButton } from "react-bootstrap";
import { NOT_HOME_STATUS_CODES } from "../../utils/constants";
import { FormProps } from "../../utils/interface";
import { useTranslation } from "react-i18next";

const HHNotHomeField = ({ handleGroupChange, changeValue }: FormProps) => {
  const { t } = useTranslation();

  return (
    <div className="mb-1">
      <div className="mb-2 inline-block">
        {t("household.numberOfTries", "Number of tries")}
      </div>
      <InputGroup className="justify-content-center">
        <ToggleButtonGroup
          name="nhcount"
          type="radio"
          value={changeValue}
          className="mb-3 group-wrap"
          onChange={handleGroupChange}
        >
          <ToggleButton
            id="nh-status-tb-0"
            variant="outline-secondary"
            value={NOT_HOME_STATUS_CODES.DEFAULT}
          >
            {t("household.firstTry", "1st")}
          </ToggleButton>
          <ToggleButton
            id="nh-status-tb-1"
            variant="outline-secondary"
            value={NOT_HOME_STATUS_CODES.SECOND_TRY}
          >
            {t("household.secondTry", "2nd")}
          </ToggleButton>
          <ToggleButton
            id="nh-status-tb-2"
            variant="outline-secondary"
            value={NOT_HOME_STATUS_CODES.THIRD_TRY}
          >
            {t("household.thirdTry", "3rd")}
          </ToggleButton>
          <ToggleButton
            id="nh-status-tb-3"
            variant="outline-secondary"
            value={NOT_HOME_STATUS_CODES.FOURTH_TRY}
          >
            {t("household.fourthTry", "4th")}
          </ToggleButton>
        </ToggleButtonGroup>
      </InputGroup>
    </div>
  );
};

export default HHNotHomeField;
