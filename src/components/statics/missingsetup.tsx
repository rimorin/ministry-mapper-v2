import { useTranslation } from "react-i18next";
import { MissingSetupPageProps } from "../../utils/interface";
import StaticPageCard from "./staticpage";

const MissingSetupPage: React.FC<MissingSetupPageProps> = ({ message }) => {
  const { t } = useTranslation();

  const getTranslationKey = (msg: string): string => {
    if (msg.includes("PocketBase URL")) return "errors.missingPocketBaseUrl";
    return "errors.missingSetup";
  };

  return <StaticPageCard title={t(getTranslationKey(message))} />;
};

export default MissingSetupPage;
