import { FC } from "react";
import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LanguageBtnProps {
  onClick: () => void;
  className?: string;
}

const LanguageBtn: FC<LanguageBtnProps> = ({ onClick, className = "" }) => {
  const { t } = useTranslation();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={className}
      aria-label={t("common.Language", "Language")}
      title={t("common.Language", "Language")}
    >
      <Languages
        aria-hidden="true"
        style={{ width: "1.25em", height: "1.25em" }}
      />
    </Button>
  );
};

export default LanguageBtn;
