import { useTranslation } from "react-i18next";
import StaticPageCard from "./staticpage";

const InvalidPage = () => {
  const { t } = useTranslation();

  return (
    <StaticPageCard
      title={t("errors.linkExpired", "This link has expired ⌛")}
    />
  );
};

export default InvalidPage;
