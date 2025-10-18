import { Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { LoaderProps } from "../../utils/interface";

const Loader: React.FC<LoaderProps> = ({ suspended = false }) => {
  const { t } = useTranslation();

  if (suspended) {
    return (
      <div className="suspense-loader">
        <Spinner variant="primary" />
      </div>
    );
  }
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <Spinner
          animation="border"
          variant="primary"
          className="loading-spinner"
        />
        <div className="loading-text">{t("common.loading")}</div>
      </div>
    </div>
  );
};

export default Loader;
