import { Form } from "react-bootstrap";
import { MIN_START_FLOOR, MAX_TOP_FLOOR } from "../../utils/constants";
import { FloorProps } from "../../utils/interface";
import { useTranslation } from "react-i18next";

const suffixes = ["th", "st", "nd", "rd"];

const FloorField = ({ handleChange, changeValue }: FloorProps) => {
  const { t } = useTranslation();

  const getOrdinalNumber = (n: number): string => {
    const v = n % 100;
    return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  };
  return (
    <Form.Group className="mb-3" controlId="formBasicFloorRange">
      <Form.Label>{t("floors.numberOfFloors", "No. of floors")}</Form.Label>
      <div className="d-flex align-items-center gap-3">
        <Form.Range
          min={MIN_START_FLOOR}
          max={MAX_TOP_FLOOR}
          value={changeValue}
          onChange={handleChange}
        />
        <Form.Text
          className="text-muted d-flex align-items-center"
          style={{
            minWidth: "50px",
            fontSize: "1.1rem",
            paddingBottom: "0.25rem"
          }}
        >
          {getOrdinalNumber(changeValue)}
        </Form.Text>
      </div>
    </Form.Group>
  );
};

export default FloorField;
