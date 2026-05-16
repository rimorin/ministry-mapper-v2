import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import StaticPageCard from "./staticpage";

const NotFoundPage = () => {
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  return (
    <StaticPageCard title={t("errors.pageNotFound", "404 Page Not Found 🚫")}>
      <p className="text-center text-sm text-muted-foreground">
        {t(
          "errors.pageNotFoundMessage",
          "We are sorry, the page you requested could not be found."
        )}
      </p>
      <Button className="mt-4 w-full" onClick={() => navigate("/")}>
        {t("navigation.goHome", "Go to Home")}
      </Button>
    </StaticPageCard>
  );
};

export default NotFoundPage;
