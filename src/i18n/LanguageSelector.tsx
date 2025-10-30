import { ListGroup, Offcanvas } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { TERRITORY_SELECTOR_VIEWPORT_HEIGHT } from "../utils/constants";
import { LanguageListingProps } from "../utils/interface";

const LanguageListing = ({
  showListing,
  hideFunction,
  handleSelect,
  currentLanguage,
  languageOptions = []
}: LanguageListingProps) => {
  const { t } = useTranslation();

  return (
    <Offcanvas
      placement="bottom"
      show={showListing}
      onHide={hideFunction}
      style={{ height: TERRITORY_SELECTOR_VIEWPORT_HEIGHT }}
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>
          {t("common.selectLanguage", "Select Language")}
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <ListGroup>
          {languageOptions.map((option) => (
            <ListGroup.Item
              key={option.value}
              action
              active={currentLanguage === option.value}
              onClick={() => handleSelect(option.value)}
              className="d-flex align-items-center"
            >
              <div
                style={{
                  justifyContent: "space-between",
                  display: "flex",
                  width: "100%"
                }}
              >
                <span className="fw-bold">{option.label}</span>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default LanguageListing;
