import { useTranslation } from "react-i18next";
import StaticPageCard from "./staticpage";

const InvalidPage = () => {
  const { t } = useTranslation();

  return (
    <StaticPageCard title={t("errors.linkExpired", "This link has expired ⌛")}>
      <p className="text-center text-sm text-muted-foreground mt-4">
        {t("errors.closeTab", "Please close this tab.")}
      </p>
    </StaticPageCard>
  );
};

export default InvalidPage;
