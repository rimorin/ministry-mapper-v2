import { memo } from "react";
import { Container } from "react-bootstrap";
import { territoryHeaderProp } from "../../utils/interface";
import { useTranslation } from "react-i18next";

const TerritoryHeader = memo(({ name }: territoryHeaderProp) => {
  const { t } = useTranslation();

  if (!name) return <></>;
  return (
    <Container
      fluid
      className="text-center bg-light py-2 fw-bolder text-success border-top"
    >
      {t("territory.territory")}: {name}
    </Container>
  );
});

export default TerritoryHeader;
