import { Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import {
  GenericDropdownButton,
  GenericDropdownItem
} from "../../../components/navigation/dropdownbutton";

interface TerritoryDropdownProps {
  isProcessingTerritory: boolean;
  onCreateNew: () => void;
  onChangeCode: () => Promise<void>;
  onChangeName: () => Promise<void>;
  onChangeSequence: () => void;
  onDelete: () => void;
  onReset: () => void;
}

export default function TerritoryDropdown({
  isProcessingTerritory,
  onCreateNew,
  onChangeCode,
  onChangeName,
  onChangeSequence,
  onDelete,
  onReset
}: TerritoryDropdownProps) {
  const { t } = useTranslation();

  return (
    <GenericDropdownButton
      className="dropdown-btn"
      variant="outline-primary"
      size="sm"
      label={
        isProcessingTerritory ? (
          <>
            <Spinner size="sm" /> {t("territory.territory", "Territory")}
          </>
        ) : (
          t("territory.territory", "Territory")
        )
      }
      align={{ lg: "end" }}
    >
      <GenericDropdownItem onClick={onCreateNew}>
        {t("territory.createNew", "Create New")}
      </GenericDropdownItem>
      <GenericDropdownItem onClick={onChangeCode}>
        {t("territory.changeCode", "Change Code")}
      </GenericDropdownItem>
      <GenericDropdownItem onClick={onChangeName}>
        {t("territory.changeName", "Change Name")}
      </GenericDropdownItem>
      <GenericDropdownItem onClick={onChangeSequence}>
        {t("territory.changeSequence", "Change Sequence")}
      </GenericDropdownItem>
      <GenericDropdownItem onClick={onDelete}>
        {t("territory.deleteCurrent", "Delete Current")}
      </GenericDropdownItem>
      <GenericDropdownItem onClick={onReset}>
        {t("territory.resetStatus", "Reset status")}
      </GenericDropdownItem>
    </GenericDropdownButton>
  );
}
