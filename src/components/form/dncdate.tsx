import Calendar from "react-calendar";
import { FormProps } from "../../utils/interface";
import { useTranslation } from "react-i18next";

const DncDateField = ({ handleDateChange, changeDate }: FormProps) => {
  const { t } = useTranslation();
  const dateValue = changeDate ? new Date(changeDate) : new Date();

  return (
    <div className="mb-1">
      <div className="mb-2 inline-block">
        {t("address.dncDate", "Date of DNC")}
      </div>
      <Calendar
        onChange={handleDateChange}
        className="w-100 mb-3"
        value={dateValue}
      />
    </div>
  );
};

export default DncDateField;
