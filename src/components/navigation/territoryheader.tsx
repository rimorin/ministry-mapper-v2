import { memo } from "react";
import { Container } from "react-bootstrap";
import { territoryHeaderProp } from "../../utils/interface";
import { useTranslation } from "react-i18next";

const TerritoryHeader = memo(({ name }: territoryHeaderProp) => {
  const { t } = useTranslation();

  if (!name) return null;

  return (
    <Container fluid className="territory-header text-center">
      <span className="territory-label">{t("territory.territory")}:</span>{" "}
      <span className="territory-name">{name}</span>
    </Container>
  );
});

export default TerritoryHeader;
