import { useTranslation } from "react-i18next";
import StaticPageCard from "./staticpage";

const PwaUnsupported = () => {
  const { t } = useTranslation();

  return (
    <StaticPageCard title={t("pwa.unsupported.title")}>
      <p className="text-justify text-sm text-muted-foreground">
        {t("pwa.unsupported.message")}
      </p>
    </StaticPageCard>
  );
};

export default PwaUnsupported;
