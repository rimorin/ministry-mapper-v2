import React, { useContext, useState } from "react";
import { Button, Offcanvas, Image, ListGroup } from "react-bootstrap";
import { LanguageContext } from "./LanguageContext";
import { useTranslation } from "react-i18next";
import { TERRITORY_SELECTOR_VIEWPORT_HEIGHT } from "../utils/constants";

interface LanguageSelectorOffcanvasProps {
  variant?: string; // Optional prop for button variant
  buttonSize?: "sm" | "lg"; // Optional prop for button size
  showText?: boolean; // Whether to show text beside the icon
}

const LanguageSelector: React.FC<LanguageSelectorOffcanvasProps> = ({
  variant = "outline-primary",
  buttonSize = "sm",
  showText = true
}) => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage, languageOptions } =
    useContext(LanguageContext);
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleLanguageChange = (language: string) => {
    changeLanguage(language);
    handleClose();
  };

  const currentLanguageLabel =
    languageOptions.find((option) => option.value === currentLanguage)?.label ||
    "English";

  return (
    <>
      <Button
        variant={variant}
        size={buttonSize}
        onClick={handleShow}
        className="d-flex align-items-center"
      >
        <Image
          src="https://assets.ministry-mapper.com/language.svg"
          alt="Language"
          width="16"
          height="16"
        />
        {showText && <span className="ms-1">{currentLanguageLabel}</span>}
      </Button>
      <Offcanvas
        show={show}
        onHide={handleClose}
        placement="bottom"
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
                onClick={() => handleLanguageChange(option.value)}
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
                  {currentLanguage === option.value && <span>✓</span>}
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default LanguageSelector;
